# 📋 Instructies: Annuleer alle Instagram Pending Follow Requests

## ⚠️ BELANGRIJK - Lees dit eerst!

De browser console blokkeert plakken voor veiligheid. Je moet eerst toestemming geven.

---

## Methode 1: Via Console (Aanbevolen)

### Stap 1: Open Developer Tools
1. Ga naar **instagram.com** (zorg dat je ingelogd bent)
2. Druk **F12** (of rechtsklik → "Inspecteren")
3. Ga naar het tabblad **"Console"**

### Stap 2: Geef toestemming voor plakken
1. Typ dit in de console: **`allow pasting`**
2. Druk **Enter**

### Stap 3: Plak het script
1. Open het bestand **`cancel_all_in_browser.js`** in Notepad of een editor
2. Selecteer **ALLES** (Ctrl+A) en kopieer (Ctrl+C)
3. Ga terug naar de Console tab
4. Plak het script (Ctrl+V)
5. Druk **Enter**

### Stap 4: Plak de gebruikersnamen
1. Het script vraagt om gebruikersnamen
2. Open **`pending_usernames.txt`** in Notepad
3. Selecteer **ALLES** (Ctrl+A) en kopieer (Ctrl+C)
4. Ga terug naar de Console en plak (Ctrl+V)
5. Druk **Enter**

✅ Het script begint nu automatisch alle ~4192 requests te annuleren!

---

## Methode 2: Via Sources Tab (Alternatief)

Als de console methode niet werkt:

### Stap 1: Open Sources
1. Druk **F12** → Ga naar tabblad **"Sources"**
2. Klik op **"Snippets"** in het linker menu (of "+ New snippet")
3. Klik rechts op **"New snippet"** → Geef het een naam (bijv. "cancel-instagram")

### Stap 2: Plak het script
1. Open **`cancel_all_in_browser.js`** in Notepad
2. Kopieer **ALLES** (Ctrl+A, Ctrl+C)
3. Plak in de Snippet editor (Ctrl+V)
4. Klik op **"Ctrl+Enter"** om te runnen, of klik op het ▶️ play icoon

### Stap 3: Plak de gebruikersnamen
- Het script vraagt om gebruikersnamen
- Volg dezelfde stappen als bij Methode 1, Stap 4

---

## Wat gebeurt er nu?

✅ Het script verwerkt automatisch alle accounts
✅ Real-time progress wordt getoond
✅ Pauzeert elke 100 accounts (om rate limiting te voorkomen)
✅ Geeft een eindrapport met statistieken

**Geschatte tijd:** ~2-3 uur voor alle 4192 accounts

**Tip:** Laat de browser open staan, het script werkt op de achtergrond!

---

## Problemen oplossen

### "Geen CSRF token gevonden"
→ Zorg dat je **ingelogd** bent op instagram.com

### "RATE LIMIT" foutmelding
→ Het script pauzeert automatisch, maar als het blijft gebeuren:
- Wacht 30 minuten
- Herstart het script (geannuleerde accounts worden overgeslagen)

### Script stopt plotseling
→ Mogelijk heeft Instagram de sessie beëindigd
→ Refresh de pagina, log opnieuw in en herstart

### Console blokkeert nog steeds
→ Gebruik **Methode 2** (Sources Tab) hierboven

---

## Veiligheid

- ✅ Dit script gebruikt alleen officiële Instagram API endpoints
- ✅ Geen externe servers of downloads
- ✅ Werkt volledig lokaal in je browser
- ⚠️ Gebruik op eigen risico (Instagram kan rate limiting toepassen)


