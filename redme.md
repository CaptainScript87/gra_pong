# Gra Pong Online

Prosta, klasyczna gra Pong zaimplementowana w HTML, CSS i JavaScript, z dodatkowym licznikiem odwiedzin po stronie serwera (PHP).

## Opis

Jest to implementacja kultowej gry Pong, oferująca rozgrywkę dla jednego gracza przeciwko komputerowi na różnych poziomach trudności, oraz tryb dla dwóch graczy na jednym komputerze. Strona zawiera również podstawowe informacje o prawach autorskich, polityce prywatności, informacji o cookies oraz prosty licznik odwiedzin.

**Aktualna wersja gry:** 1.2.0

**Link do gry:** [pong.com.pl](http://pong.com.pl) (lub aktualny adres, np. `http://frog02-22249.wykr.es/`)

## Technologie

* **Frontend:**
    * HTML5
    * CSS3
    * JavaScript (ES6+)
* **Backend (licznik odwiedzin):**
    * PHP
* **Serwer WWW:** Nginx (lub Apache)
* **System operacyjny serwera:** Alpine Linux

## Struktura Plików Projektu

/ (główny katalog strony, np. /var/www/pong.com.pl/)├── index.html             # Główny plik gry├── style.css              # Style CSS├── script.js              # Logika gry w JavaScript├── counter.php            # Skrypt PHP licznika odwiedzin├── counter.txt            # Plik przechowujący liczbę odwiedzin (tworzony przez counter.php)├── polityka-prywatnosci.html # Podstrona z polityką prywatności└── cookies-info.html      # Podstrona z informacją o cookies
## Funkcjonalności

* Menu główne z wyborem trybu gry.
* **Tryb dla jednego gracza:**
    * Możliwość wyboru poziomu trudności (Łatwy, Normalny, Trudny).
    * Przeciwnik sterowany przez AI z różnym poziomem umiejętności.
* **Tryb dla dwóch graczy:**
    * Sterowanie za pomocą klawiatury (Gracz 1: W/S, Gracz 2: Strzałki Góra/Dół).
* System punktacji do 5 punktów.
* Wyświetlanie wyniku i informacji o sterowaniu.
* Możliwość restartu gry i powrotu do menu.
* Prosty licznik odwiedzin strony (po stronie serwera).
* Informacja o prawach autorskich i numer wersji gry.
* Baner informujący o plikach cookie z możliwością akceptacji.
* Podstrony "Polityka Prywatności" i "Informacja o Cookies".

## Jak Uruchomić Lokalnie (do testów)

1.  Pobierz wszystkie pliki (`index.html`, `style.css`, `script.js`, `counter.php`) do jednego folderu na swoim komputerze.
2.  Aby licznik odwiedzin działał, potrzebujesz lokalnego serwera WWW z obsługą PHP (np. XAMPP, WAMP, MAMP lub wbudowany serwer PHP).
3.  Umieść folder z grą w katalogu głównym swojego lokalnego serwera WWW.
4.  Otwórz `index.html` w przeglądarce przez adres lokalnego serwera (np. `http://localhost/nazwa_folderu_gry/`).
    * *Uwaga: Bez serwera PHP, sam plik `index.html` uruchomi grę, ale licznik odwiedzin nie będzie działał i może pokazywać błąd.*

## Instalacja na Serwerze (Przykład dla Alpine Linux z Nginx i PHP-FPM)

1.  **Prześlij pliki** na serwer (np. do `/var/www/pong.com.pl/`).
2.  **Zainstaluj Nginx i PHP-FPM:**
    ```bash
    apk add nginx php php-fpm # lub odpowiednie wersje np. php83 php83-fpm
    rc-service php-fpm83 start # dostosuj wersję
    rc-update add php-fpm83 default
    ```
3.  **Skonfiguruj Nginx:** Utwórz plik konfiguracyjny w `/etc/nginx/http.d/`, np. `pong.conf`:
    ```nginx
    server {
        listen [::]:PORT_TWOJEJ_SUBDOMENY_LUB_80; # np. [::]:22249 lub [::]:80
        listen PORT_TWOJEJ_SUBDOMENY_LUB_80;     # np. 22249 lub 80

        server_name twoja_domena.pl; # np. frog02-22249.wykr.es
        root /var/www/pong.com.pl;   # Ścieżka do plików gry
        index index.html index.php;

        location / {
            try_files $uri $uri/ =404;
        }

        location ~ \.php$ {
            try_files $uri =404;
            fastcgi_split_path_info ^(.+\.php)(/.+)$;
            fastcgi_pass unix:/run/php-fpm83/php-fpm.sock; # Sprawdź ścieżkę do gniazda PHP-FPM
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            include fastcgi_params;
        }
    }
    ```
4.  **Ustaw uprawnienia:**
    ```bash
    chown -R nginx:nginx /var/www/pong.com.pl
    find /var/www/pong.com.pl -type d -exec chmod 755 {} \;
    find /var/www/pong.com.pl -type f -exec chmod 644 {} \;
    touch /var/www/pong.com.pl/counter.txt
    chown nginx:nginx /var/www/pong.com.pl/counter.txt
    chmod 664 /var/www/pong.com.pl/counter.txt
    ```
5.  **Przetestuj i przeładuj Nginx:**
    ```bash
    nginx -t
    rc-service nginx reload
    ```

## Możliwe Przyszłe Ulepszenia

* Bardziej zaawansowana grafika i animacje.
* Efekty dźwiękowe.
* Zapisywanie najlepszych wyników.
* Tryb gry online dla wielu graczy (wymagałoby backendu np. Node.js z WebSockets).
* Bardziej rozbudowana Polityka Prywatności i Informacja o Cookies.

## Autor

pong.com.pl (CaptainScript87)

## Licencja

Ten projekt jest udostępniany bez konkretnej licencji (do własnego użytku). Jeśli planujesz go rozwijać lub udostępniać szerzej, rozważ dodanie licencji open source (np. MIT).
