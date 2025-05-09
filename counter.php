<?php
// Plik, w którym przechowywany będzie licznik
// Używamy __DIR__, aby ścieżka była zawsze względna do katalogu, w którym znajduje się ten skrypt.
$counterFile = __DIR__ . "/counter.txt";
$count = 0;

// Sprawdź, czy plik licznika istnieje
if (file_exists($counterFile)) {
    // Odczytaj aktualną wartość licznika
    // Używamy (int) do rzutowania na liczbę całkowitą, na wypadek gdyby plik był pusty lub zawierał niepoprawne dane.
    $count = (int)file_get_contents($counterFile);
}

// Zwiększ licznik
$count++;

// Zapisz nową wartość do pliku
// Używamy @, aby stłumić ewentualne błędy zapisu, jeśli uprawnienia są problemem na początku.
// Lepszym rozwiązaniem jest zapewnienie poprawnych uprawnień.
// Sprawdzamy też, czy zapis się powiódł.
if (@file_put_contents($counterFile, $count) === false) {
    // Możesz dodać logowanie błędu, jeśli zapis się nie powiedzie, np. do error_log PHP
    // error_log("Nie można zapisać do pliku licznika: " . $counterFile . " - sprawdź uprawnienia.");
    // W przypadku błędu zapisu, możemy zdecydować się nie wyświetlać niczego lub zwrócić błąd.
    // Dla prostoty, jeśli zapis się nie uda, skrypt nadal wyświetli $count (który został zwiększony w pamięci).
}

// Zwróć aktualną wartość licznika jako zwykły tekst
echo $count;
?>
