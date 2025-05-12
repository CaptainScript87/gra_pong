// script.js - Logika Gry Pong

// --- WERSJA GRY ---
const GAME_VERSION = "1.2.0";
if (document.getElementById('version-number')) {
    document.getElementById('version-number').textContent = GAME_VERSION;
}

// --- Ustawienie roku w stopce ---
if (document.getElementById('current-year')) {
    document.getElementById('current-year').textContent = new Date().getFullYear();
}

// --- OBSŁUGA BANERA COOKIES ---
const cookieBanner = document.getElementById('cookie-consent-banner');
console.log('Cookie Banner Element:', cookieBanner); // Debug
const acceptCookiesButton = document.getElementById('accept-cookies-button');
console.log('Accept Cookies Button Element:', acceptCookiesButton); // Debug

if (!localStorage.getItem('pongCookieConsent')) {
    console.log('Cookie consent not found in localStorage.'); // Debug
    if (cookieBanner) {
        cookieBanner.style.display = 'block';
        console.log('Cookie banner displayed.'); // Debug
    } else {
        console.error('Cookie banner element (#cookie-consent-banner) not found in DOM!'); // Debug
    }
} else {
    console.log('Cookie consent FOUND in localStorage.'); // Debug
    if (cookieBanner) { // Ukryj baner, jeśli zgoda już jest
        cookieBanner.style.display = 'none';
    }
}

if (acceptCookiesButton) {
    acceptCookiesButton.addEventListener('click', () => {
        console.log('Accept cookies button CLICKED.'); // Debug
        try {
            localStorage.setItem('pongCookieConsent', 'true');
            console.log('Cookie consent set in localStorage.'); // Debug
            if (cookieBanner) {
                cookieBanner.style.display = 'none';
                console.log('Cookie banner hidden.'); // Debug
            }
        } catch (e) {
            console.error('Error setting localStorage or hiding banner:', e); // Debug
        }
    });
    console.log('Event listener for accept cookies button ADDED.'); // Debug
} else {
    console.error('Accept cookies button element (#accept-cookies-button) not found, listener NOT added.'); // Debug
}


// --- Licznik odwiedzin (serwerowy PHP) ---
const visitsSpan = document.getElementById('visits');
function updateVisitorCount() {
    if (!visitsSpan) {
        console.warn("Element #visits for visitor counter not found."); // Ostrzeżenie, jeśli elementu nie ma
        return;
    }
    fetch('counter.php') // Wywołaj skrypt PHP
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { // Spróbuj odczytać treść błędu z serwera
                    console.error('Server response for counter.php:', text); // Loguj odpowiedź serwera w razie błędu
                    throw new Error('Network response for counter.php was not ok: ' + response.status + ' ' + response.statusText);
                });
            }
            return response.text(); // Oczekujemy tekstu (liczby)
        })
        .then(count => {
            if (!isNaN(parseInt(count))) {
                visitsSpan.textContent = count;
            } else {
                visitsSpan.textContent = 'Błąd danych';
                console.error('Otrzymano niepoprawną wartość licznika z counter.php:', count);
            }
        })
        .catch(error => {
            console.error('Błąd pobierania licznika odwiedzin (fetch to counter.php failed):', error);
            visitsSpan.textContent = 'Błąd';
        });
}
// Wywołaj funkcję przy ładowaniu strony
updateVisitorCount();


// --- Elementy DOM ---
const startMenu = document.getElementById('start-menu');
const gameContainer = document.getElementById('game-container');
const onePlayerButton = document.getElementById('one-player-button');
const twoPlayerButton = document.getElementById('two-player-button');
const difficultySelection = document.getElementById('difficulty-selection');
const difficultyButtons = document.querySelectorAll('.difficulty-button');
const canvas = document.getElementById('pongCanvas');
const context = canvas ? canvas.getContext('2d') : null;
const scoreElement = document.getElementById('score');
const controlsInfo = document.getElementById('controls-info');
const messageBox = document.getElementById('message-box');
const winnerMessage = document.getElementById('winner-message');
const restartButton = document.getElementById('restart-button');
const menuButton = document.getElementById('menu-button');

// --- Ustawienia Gry ---
const baseWidth = 800;
const baseHeight = 400;
let scaleFactor = 1;
const winningScore = 5;

// --- Stan Gry ---
let gameMode = null;
let difficultyLevel = 'normal';
let gameRunning = false;
let animationFrameId = null;

// --- Parametry Trudności ---
const difficultySettings = {
    easy:   { computerMaxSpeed: 2.2, ballSpeed: 4.8, ballAcceleration: 0.05, aiErrorRange: 60 },
    normal: { computerMaxSpeed: 3.2, ballSpeed: 5.2, ballAcceleration: 0.08, aiErrorRange: 35 },
    hard:   { computerMaxSpeed: 4.5, ballSpeed: 6.0, ballAcceleration: 0.12, aiErrorRange: 20 }
};

// --- Elementy Gry ---
const basePaddleWidth = 15;
const basePaddleHeight = 100;
const baseBallRadius = 10;
const basePlayerPaddleSpeed = 6;

let player1, player2, ball;
const keysPressed = { w: false, s: false, ArrowUp: false, ArrowDown: false };

// --- Funkcje Pomocnicze ---
function drawRect(x, y, w, h, color) { if(context) {context.fillStyle = color; context.fillRect(x, y, w, h);} }
function drawCircle(x, y, r, color) { if(context) {context.fillStyle = color; context.beginPath(); context.arc(x, y, r, 0, Math.PI * 2, false); context.closePath(); context.fill();} }
function drawNet() {
    if(!context || !canvas) return;
    context.strokeStyle = '#555'; context.lineWidth = 4 * scaleFactor;
    context.setLineDash([10 * scaleFactor, 10 * scaleFactor]); context.beginPath();
    context.moveTo(canvas.width / 2, 0); context.lineTo(canvas.width / 2, canvas.height);
    context.stroke(); context.setLineDash([]);
}

function updateScore() {
    if (!player1 || !player2 || !scoreElement) return;
    let scoreText = '';
    if (gameMode === 'single') {
        scoreText = `Gracz: ${player1.score} - Komputer: ${player2.score} (${difficultyLevel.charAt(0).toUpperCase() + difficultyLevel.slice(1)})`;
    } else if (gameMode === 'twoPlayer') {
        scoreText = `Gracz 1: ${player1.score} - Gracz 2: ${player2.score}`;
    }
    scoreElement.textContent = scoreText;
}

function resetBall() {
    if (!ball || !canvas) return;
    const currentDifficultyParams = difficultySettings[difficultyLevel] || difficultySettings.normal;
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speed = currentDifficultyParams.ballSpeed * scaleFactor;
    let angle = (Math.random() * Math.PI / 2.5) - (Math.PI / 5);
    let directionX = (Math.random() > 0.5 ? 1 : -1);
    let directionY = (Math.random() > 0.5 ? 1 : -1);
    ball.velocityX = directionX * ball.speed * Math.cos(angle);
    let tempVelocityY = ball.speed * Math.sin(angle);
    if (Math.abs(tempVelocityY) < 0.5 * scaleFactor) {
        tempVelocityY = (Math.sign(tempVelocityY) || (Math.random() > 0.5 ? 1 : -1)) * 0.5 * scaleFactor;
    }
    ball.velocityY = directionY * tempVelocityY;
}

function showEndGameMessage() {
    if (!player1 || !player2 || !winnerMessage || !messageBox) return;
    let winnerName = '';
    if (gameMode === 'single') {
        winnerName = (player1.score >= winningScore) ? "Gracz" : "Komputer";
    } else {
        winnerName = (player1.score >= winningScore) ? "Gracz 1" : "Gracz 2";
    }
    winnerMessage.textContent = `${winnerName} Wygrywa!`;
    messageBox.style.display = 'flex';
    gameRunning = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

function restartGame() {
    if (!player1 || !player2 || !ball || !messageBox || !canvas) return;
    player1.score = 0;
    player2.score = 0;
    player1.y = canvas.height / 2 - player1.height / 2;
    player2.y = canvas.height / 2 - player2.height / 2;
    updateScore();
    messageBox.style.display = 'none';
    gameRunning = true;
    resetBall();
    if (!animationFrameId) { gameLoop(); }
}

function goToMenu() {
    if (!gameContainer || !startMenu || !difficultySelection || !onePlayerButton || !twoPlayerButton || !messageBox) return;
    gameRunning = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    gameContainer.style.display = 'none';
    startMenu.style.display = 'block';
    difficultySelection.style.display = 'none';
    onePlayerButton.style.display = 'block';
    twoPlayerButton.style.display = 'block';
    messageBox.style.display = 'none';
    removeGameEventListeners();
    player1 = null; player2 = null; ball = null; gameMode = null;
 }

function collision(b, p) {
     if (!b || !p) return false;
    const p_top = p.y; const p_bottom = p.y + p.height;
    const p_left = p.x; const p_right = p.x + p.width;
    const b_top = b.y - b.radius; const b_bottom = b.y + b.radius;
    const b_left = b.x - b.radius; const b_right = b.x + b.radius;
    return b_right > p_left && b_left < p_right && b_bottom > p_top && b_top < p_bottom;
}

function update() {
    if (!gameRunning || !player1 || !player2 || !ball || !canvas) return;

    if (gameMode === 'single') {
        const currentDifficultyParams = difficultySettings[difficultyLevel];
        const aiMaxSpeed = currentDifficultyParams.computerMaxSpeed * scaleFactor;
        let targetYOnPaddleCenter = ball.y;
        let errorOffset = (Math.random() - 0.5) * (currentDifficultyParams.aiErrorRange * scaleFactor);
        let targetBallYForPaddle = targetYOnPaddleCenter + errorOffset;
        let targetPaddleY = targetBallYForPaddle - player2.height / 2;
        let dy = targetPaddleY - player2.y;
        let effectiveAiSpeed = aiMaxSpeed;
        if (ball.velocityX < 0) {
            effectiveAiSpeed *= 0.5;
        } else {
            if (Math.abs(ball.x - player2.x) > canvas.width * 0.65) {
                effectiveAiSpeed *= 0.6;
            } else if (Math.abs(ball.x - player2.x) > canvas.width * 0.4) {
                effectiveAiSpeed *= 0.8;
            }
        }
        if (Math.abs(dy) < player2.height * 0.2) {
            effectiveAiSpeed *= 0.5;
        }
        if (Math.abs(dy) > effectiveAiSpeed * 0.1) {
            player2.y += Math.sign(dy) * Math.min(Math.abs(dy), effectiveAiSpeed);
        }
        player2.y = Math.max(0, Math.min(canvas.height - player2.height, player2.y));
    } else if (gameMode === 'twoPlayer') {
        const paddleSpeed = basePlayerPaddleSpeed * scaleFactor;
        if (keysPressed.w && player1.y > 0) { player1.y -= paddleSpeed; }
        if (keysPressed.s && player1.y < canvas.height - player1.height) { player1.y += paddleSpeed; }
        player1.y = Math.max(0, Math.min(canvas.height - player1.height, player1.y));

        if (keysPressed.ArrowUp && player2.y > 0) { player2.y -= paddleSpeed; }
        if (keysPressed.ArrowDown && player2.y < canvas.height - player2.height) { player2.y += paddleSpeed; }
        player2.y = Math.max(0, Math.min(canvas.height - player2.height, player2.y));
    }

    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    if (ball.y + ball.radius > canvas.height) { ball.y = canvas.height - ball.radius; ball.velocityY *= -1; }
    else if (ball.y - ball.radius < 0) { ball.y = ball.radius; ball.velocityY *= -1; }
    if (Math.abs(ball.velocityY) < 0.1 * scaleFactor && ball.velocityY !== 0) {
        ball.velocityY = (Math.sign(ball.velocityY) || (Math.random() > 0.5 ? 1: -1)) * 0.2 * scaleFactor;
    }

    let pointScored = false;
    if (ball.x + ball.radius > canvas.width) { player1.score++; pointScored = true; }
    else if (ball.x - ball.radius < 0) { player2.score++; pointScored = true; }

    if(pointScored) {
        updateScore();
        if (player1.score >= winningScore || player2.score >= winningScore) {
            showEndGameMessage();
        } else {
            resetBall();
        }
    }

    let paddle = (ball.x < canvas.width / 2) ? player1 : player2;
    if (collision(ball, paddle)) {
        let collidePoint = (ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
        const maxAngleRatio = 0.85;
        collidePoint = Math.max(-maxAngleRatio, Math.min(maxAngleRatio, collidePoint));
        let angleRad = collidePoint * (Math.PI / 3.2);
        let direction = (ball.x < canvas.width / 2) ? 1 : -1;
        ball.velocityX = direction * ball.speed * Math.cos(angleRad);
        ball.velocityY = ball.speed * Math.sin(angleRad);
        const minYVelocity = 0.4 * scaleFactor;
        if (Math.abs(ball.velocityY) < minYVelocity) {
            ball.velocityY = (ball.velocityY >= 0 ? 1 : -1) * minYVelocity;
            if (ball.velocityY === 0) ball.velocityY = (Math.random() > 0.5 ? 1 : -1) * minYVelocity;
        }
        ball.x += ball.velocityX * 0.1;
         const currentDifficultyParams = difficultySettings[difficultyLevel] || difficultySettings.normal;
         ball.speed += currentDifficultyParams.ballAcceleration * scaleFactor;
    }
}

function render() {
     if (!player1 || !player2 || !ball || !context) return; // Dodano sprawdzenie context
    drawRect(0, 0, canvas.width, canvas.height, '#000');
    drawNet();
    drawRect(player1.x, player1.y, player1.width, player1.height, player1.color);
    drawRect(player2.x, player2.y, player2.width, player2.height, player2.color);
    drawCircle(ball.x, ball.y, ball.radius, ball.color);
 }

function gameLoop(timestamp) {
    if (!gameRunning) {
        animationFrameId = null;
        return;
    }
    update();
    render();
    animationFrameId = requestAnimationFrame(gameLoop);
}

function movePlayer1Paddle(evt) {
     if (!player1 || gameMode !== 'single' || !canvas) return;
    let rect = canvas.getBoundingClientRect();
    let mouseY = evt.clientY;
    if (evt.touches && evt.touches.length > 0) {
         evt.preventDefault();
         mouseY = evt.touches[0].clientY;
    }
    player1.y = mouseY - rect.top - player1.height / 2;
    player1.y = Math.max(0, Math.min(canvas.height - player1.height, player1.y));
 }
function handleKeyDown(event) {
    if (gameMode !== 'twoPlayer') return;
    switch(event.key) {
        case 'w': case 'W': keysPressed.w = true; break;
        case 's': case 'S': keysPressed.s = true; break;
        case 'ArrowUp': keysPressed.ArrowUp = true; break;
        case 'ArrowDown': keysPressed.ArrowDown = true; break;
    }
 }
function handleKeyUp(event) {
    if (gameMode !== 'twoPlayer') return;
    switch(event.key) {
        case 'w': case 'W': keysPressed.w = false; break;
        case 's': case 'S': keysPressed.s = false; break;
        case 'ArrowUp': keysPressed.ArrowUp = false; break;
        case 'ArrowDown': keysPressed.ArrowDown = false; break;
    }
 }

function addGameEventListeners() {
    removeGameEventListeners();
    if (gameMode === 'single') {
        if(canvas) {
            canvas.style.cursor = 'none';
            canvas.addEventListener('mousemove', movePlayer1Paddle);
            canvas.addEventListener('touchmove', movePlayer1Paddle, { passive: false });
        }
    } else if (gameMode === 'twoPlayer') {
         if(canvas) canvas.style.cursor = 'default';
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        if(controlsInfo) controlsInfo.style.display = 'block';
    }
    window.addEventListener('resize', resizeGame);
 }
function removeGameEventListeners() {
    if(canvas) {
        canvas.removeEventListener('mousemove', movePlayer1Paddle);
        canvas.removeEventListener('touchmove', movePlayer1Paddle);
    }
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('resize', resizeGame);
    if(controlsInfo) controlsInfo.style.display = 'none';
    if(canvas) canvas.style.cursor = 'default';
 }

function resizeGame() {
    if (!gameMode || !canvas) return;

    const container = document.getElementById('game-container');
    if (!container) return;
    const availableWidth = container.clientWidth * 0.95;
    const availableHeight = window.innerHeight * 0.7;
    const scaleWidth = availableWidth / baseWidth;
    const scaleHeight = availableHeight / baseHeight;
    scaleFactor = Math.min(scaleWidth, scaleHeight);

    canvas.width = baseWidth * scaleFactor;
    canvas.height = baseHeight * scaleFactor;

    const scaledPaddleWidth = basePaddleWidth * scaleFactor;
    const scaledPaddleHeight = basePaddleHeight * scaleFactor;
    const scaledBallRadius = baseBallRadius * scaleFactor;

    const currentDifficultyParams = difficultySettings[difficultyLevel] || difficultySettings.normal;
    const scaledComputerSpeed = currentDifficultyParams.computerMaxSpeed * scaleFactor;
    const scaledBallSpeed = currentDifficultyParams.ballSpeed * scaleFactor;

    const score1 = player1 ? player1.score : 0;
    const score2 = player2 ? player2.score : 0;

    player1 = {
        x: 10 * scaleFactor, y: canvas.height / 2 - scaledPaddleHeight / 2,
        width: scaledPaddleWidth, height: scaledPaddleHeight, color: '#FFF', score: score1
    };

    player2 = {
        x: canvas.width - scaledPaddleWidth - (10 * scaleFactor), y: canvas.height / 2 - scaledPaddleHeight / 2,
        width: scaledPaddleWidth, height: scaledPaddleHeight, color: '#FFF', score: score2,
        speed: (gameMode === 'single') ? scaledComputerSpeed : 0
    };

    if (ball) {
         const oldCanvasWidth = canvas.width / scaleFactor * (ball.scaleFactor || 1);
         const oldCanvasHeight = canvas.height / scaleFactor * (ball.scaleFactor || 1);
         ball.x = (ball.x / oldCanvasWidth) * canvas.width;
         ball.y = (ball.y / oldCanvasHeight) * canvas.height;
         ball.radius = scaledBallRadius;
         const currentAbsSpeed = Math.sqrt(ball.velocityX**2 + ball.velocityY**2);
         const newBaseSpeed = currentDifficultyParams.ballSpeed * scaleFactor;
         const speedRatio = ball.speed / (currentDifficultyParams.ballSpeed * (ball.scaleFactor || 1));

         ball.speed = newBaseSpeed * speedRatio;
         if(currentAbsSpeed > 0) {
            ball.velocityX = (ball.velocityX / currentAbsSpeed) * ball.speed;
            ball.velocityY = (ball.velocityY / currentAbsSpeed) * ball.speed;
         } else {
            resetBall();
         }
         ball.scaleFactor = scaleFactor;
    } else {
         ball = {
             x: canvas.width / 2, y: canvas.height / 2, radius: scaledBallRadius,
             speed: scaledBallSpeed, velocityX: 0, velocityY: 0, color: '#FFF', scaleFactor: scaleFactor
         };
         resetBall();
    }

    updateScore();
    if (gameRunning) { render(); }
}

function startGame(selectedMode, selectedDifficulty = 'normal') {
    if (!startMenu || !gameContainer) return;
    gameMode = selectedMode;
    difficultyLevel = selectedDifficulty;

    startMenu.style.display = 'none';
    gameContainer.style.display = 'flex';

    player1 = null; player2 = null; ball = null;
    keysPressed.w = false; keysPressed.s = false; keysPressed.ArrowUp = false; keysPressed.ArrowDown = false;

    resizeGame();
    addGameEventListeners();
    gameRunning = true;
    if (!animationFrameId) { gameLoop(); }
}

// Inicjalizacja obsługi zdarzeń dla przycisków menu (zabezpieczona przed null)
if (onePlayerButton) {
    onePlayerButton.addEventListener('click', () => {
        if(difficultySelection) difficultySelection.style.display = 'block';
        if(onePlayerButton) onePlayerButton.style.display = 'none';
        if(twoPlayerButton) twoPlayerButton.style.display = 'none';
    });
}

if (difficultyButtons) {
    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const selectedDifficulty = button.getAttribute('data-difficulty');
            startGame('single', selectedDifficulty);
        });
    });
}

if (twoPlayerButton) {
    twoPlayerButton.addEventListener('click', () => {
         if(difficultySelection) difficultySelection.style.display = 'none';
         startGame('twoPlayer');
    });
}

if (restartButton) {
    restartButton.addEventListener('click', restartGame);
}
if (menuButton) {
    menuButton.addEventListener('click', goToMenu);
}

// Stan początkowy - upewnij się, że elementy istnieją przed próbą zmiany ich stylu
if (gameContainer) gameContainer.style.display = 'none';
if (startMenu) startMenu.style.display = 'block';
if (difficultySelection) difficultySelection.style.display = 'none';
