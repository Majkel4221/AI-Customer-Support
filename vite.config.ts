#!/bin/bash

# Skrypt uruchamiający projekt deweloperski lokalnie na macOS / Linux
# Autor: AI Coding Agent (Google AI Studio)

echo "======================================================"
echo "    AI Customer Support - System Uruchamiania (Unix)  "
echo "======================================================"
echo ""

# Sprawdzenie czy zainstalowany jest Node.js
if ! command -v node &> /dev/null
then
    echo "[BŁĄD] Nie znaleziono Node.js w systemie!"
    echo "Pobierz i zainstaluj Node.js ze strony: https://nodejs.org/"
    echo "Po instalacji spróbuj ponownie uruchomić ten skrypt."
    exit 1
fi

echo "[*] Wykryto Node.js, wersja: $(node -v)"
echo ""

# Instalowanie zależności, jeśli katalog node_modules nie istnieje
if [ ! -d "node_modules" ]; then
    echo "[i] Pierwsze uruchomienie: Instalowanie zależności (npm install)..."
    npm install
    if [ $? -ne 0 ]; then
        echo ""
        echo "[BŁĄD] Instalacja zależności nie powiodła się. Sprawdź połączenie z Internetem."
        exit 1
    fi
    echo "[*] Zależności zainstalowane pomyślnie!"
else
    echo "[*] Katalog zależności (node_modules) już istnieje. Pomijanie instalacji."
fi

# Tworzenie pliku .env, jeśli nie istnieje
if [ ! -f ".env" ]; then
    echo "[i] Tworzenie lokalnego pliku .env na podstawie .env.example..."
    cp .env.example .env
    echo "[*] Plik .env stworzony. Uzupełnij w nim klucz GEMINI_API_KEY dla prawidłowego działania AI."
fi

echo ""
echo "====================================================== "
echo " Serwer deweloperski uruchamia się na: http://localhost:3000"
echo " Aby wyłączyć aplikację, naciśnij Ctrl + C w tym oknie."
echo "====================================================== "
echo ""

npm run dev
