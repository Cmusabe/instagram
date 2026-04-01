# Instagram Follow Request Cancellation Tool

Tool om automatisch alle pending follow requests op Instagram te annuleren.

## 📋 Inhoudsopgave

- [Vereisten](#vereisten)
- [Installatie](#installatie)
- [Gebruik](#gebruik)
  - [Methode 1: Python Script (Aanbevolen)](#methode-1-python-script-aanbevolen)
  - [Methode 2: Browser Console](#methode-2-browser-console)
  - [Methode 3: Docker Compose (24/7, auto-restart)](#methode-3-docker-compose-247-auto-restart)
- [Bestandsstructuur](#bestandsstructuur)
- [Veiligheid & Waarschuwingen](#veiligheid--waarschuwingen)
- [Problemen oplossen](#problemen-oplossen)
- [Voor Collega's](#voor-collega's)

---

## Vereisten

- **Python 3.8+** geïnstalleerd
- **Chrome browser** geïnstalleerd
- **Git** (voor het clonen van de repository)

---

## Installatie

1. **Clone de repository:**
   ```bash
   git clone git@github.com:Cmusabe/instagram.git
   cd instagram
   ```

2. **Installeer Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Zorg dat je ingelogd bent op Instagram** in je browser

---

## Gebruik

### Methode 1: Python Script (Aanbevolen)

**Voordelen:**
- Automatisch inloggen (optioneel)
- Progress tracking met `progress.json`
- Automatische retry bij fouten
- Rate limiting bescherming

**Stappen:**

1. **Start het script:**
   ```bash
   python cancel_pending_requests.py
   ```

2. **Volg de instructies:**
   - Voer je Instagram gebruikersnaam in
   - Voer je Instagram wachtwoord in (of kies handmatig inloggen)
   - Kies vertraging tussen acties (standaard: 3 seconden)

3. **Het script:**
   - Verwerkt automatisch alle accounts uit `pending_usernames.txt`
   - Slaat voortgang op in `progress.json`
   - Pauzeert automatisch om rate limiting te voorkomen
   - Toont real-time progress updates

**Instellingen:**
- **Vertraging (delay)**: Aantal seconden tussen elke actie
  - Standaard: 3 seconden (aanbevolen)
  - Te laag (< 2): Risico op rate limiting
  - Te hoog (> 5): Veilig maar langzaam

**Output:**
- `progress.json` - Voortgang en statistieken
- `failed_cancellations.txt` - Accounts die niet geannuleerd konden worden

---

### Methode 2: Browser Console

**Voordelen:**
- Geen Python nodig
- Werkt direct in de browser
- Geen externe dependencies

**Stappen:**

#### Stap 1: Open Developer Tools
1. Ga naar **instagram.com** (zorg dat je ingelogd bent)
2. Druk **F12** (of rechtsklik → "Inspecteren")
3. Ga naar het tabblad **"Console"**

#### Stap 2: Geef toestemming voor plakken
1. Typ dit in de console: **`allow pasting`**
2. Druk **Enter**

#### Stap 3: Plak het script
1. Open het bestand **`cancel_all_in_browser.js`** in een editor
2. Selecteer **ALLES** (Ctrl+A) en kopieer (Ctrl+C)
3. Ga terug naar de Console tab
4. Plak het script (Ctrl+V)
5. Druk **Enter**

#### Stap 4: Plak de gebruikersnamen
1. Het script vraagt om gebruikersnamen
2. Open **`pending_usernames.txt`** in een editor
3. Selecteer **ALLES** (Ctrl+A) en kopieer (Ctrl+C)
4. Ga terug naar de Console en plak (Ctrl+V)
5. Druk **Enter**

✅ Het script begint nu automatisch alle requests te annuleren!

**Alternatief: Via Sources Tab**
Als de console methode niet werkt:
1. Druk **F12** → Ga naar tabblad **"Sources"**
2. Klik op **"Snippets"** → **"New snippet"**
3. Geef het een naam (bijv. "cancel-instagram")
4. Plak de inhoud van `cancel_all_in_browser.js`
5. Druk **Ctrl+Enter** om te runnen

---

### Methode 3: Docker Compose (24/7, auto-restart)

Gebruik deze methode als je wilt dat de bot blijft draaien zonder open terminal.

**Voordelen:**
- Draait op de achtergrond met `restart: unless-stopped`
- Herstart automatisch na crash/reboot
- Voortgang blijft behouden via `progress.json`
- Selenium draait in aparte container

**Stappen:**

1. **Maak een env-bestand:**
   ```bash
   cp .env.example .env
   ```
   Vul in `.env` je gegevens in:
   - `INSTAGRAM_USERNAME`
   - `INSTAGRAM_PASSWORD`
   - `BOT_DELAY` (optioneel, standaard 3)

2. **Start de containers:**
   ```bash
   docker compose up -d --build
   ```

3. **Bekijk logs van de bot:**
   ```bash
   docker compose logs -f bot
   ```

4. **Stoppen (indien nodig):**
   ```bash
   docker compose down
   ```

**Handige URLs:**
- Selenium status: `http://localhost:4444`
- Selenium live view (noVNC): `http://localhost:7900`

---

## Bestandsstructuur

```
instagram/
├── README.md                          # Dit bestand
├── requirements.txt                   # Python dependencies
├── Dockerfile                         # Container image voor bot
├── docker-compose.yml                 # Bot + Selenium services
├── .env.example                       # Voorbeeld environment variabelen
├── pending_usernames.txt              # Lijst met gebruikersnamen (één per regel)
├── progress.json                      # Voortgang tracking (wordt automatisch aangemaakt)
│
├── cancel_pending_requests.py         # Python script (Methode 1)
│
├── cancel_all_in_browser.js           # Browser console script (Methode 2)
├── cancel_all_instantly.js            # Alternatief browser script
├── cancel_direct_profiles.js          # Alternatief browser script
├── cancel_via_browser.js              # Alternatief browser script
│
├── INSTRUCTIES.md                     # Gedetailleerde instructies (Nederlands)
├── README_CANCEL_REQUESTS.md          # Aanvullende documentatie
│
├── connections/                       # Instagram export data
│   └── followers_and_following/
│       ├── pending_follow_requests.html
│       └── ...
│
└── files/
    └── Instagram-Logo.png
```

---

## Veiligheid & Waarschuwingen

⚠️ **BELANGRIJK - Gebruik op eigen risico!**

- Instagram kan **rate limiting** toepassen bij te snelle acties
- Mogelijk dat Instagram je account **tijdelijk blokkeert** bij te veel automatische acties
- Het script gebruikt vertragingen tussen acties om rate limiting te voorkomen
- **Test eerst met een klein aantal accounts** voordat je alle accounts verwerkt
- Dit script gebruikt alleen officiële Instagram API endpoints
- Geen externe servers of downloads - werkt volledig lokaal

**Aanbevolen instellingen:**
- Vertraging: 3 seconden tussen acties
- Pauze elke 50-100 accounts
- Lange pauze elke 250 accounts (10-20 minuten)

---

## Problemen oplossen

### "Login gefaald"
- Controleer je gebruikersnaam en wachtwoord
- Mogelijk vraagt Instagram om 2FA verificatie
- Probeer handmatig in te loggen op Instagram.com eerst
- Kies voor "Handmatig inloggen" optie in het Python script

### "Kan 'Requested' knop niet vinden"
- Mogelijk is de request al geaccepteerd/geweigerd
- Mogelijk heeft Instagram de UI veranderd
- Check het account handmatig
- Refresh de pagina en probeer opnieuw

### Rate limiting / "Actie geblokkeerd"
- Het script pauzeert automatisch, maar als het blijft gebeuren:
  - Verhoog de delay (bijvoorbeeld naar 5 seconden)
  - Wacht 30-60 minuten
  - Herstart het script (geannuleerde accounts worden overgeslagen)

### Browser crasht / Sessie verloren
- Het script slaat progress op tussen runs
- Als het script stopt, kun je het opnieuw draaien
- Geannuleerde requests worden automatisch overgeslagen
- Check `progress.json` voor je voortgang

### "Geen CSRF token gevonden" (Browser Console)
- Zorg dat je **ingelogd** bent op instagram.com
- Refresh de pagina en probeer opnieuw

### Console blokkeert plakken
- Typ eerst `allow pasting` in de console
- Of gebruik de Sources Tab methode (zie Methode 2)

### Script stopt plotseling
- Mogelijk heeft Instagram de sessie beëindigd
- Refresh de pagina, log opnieuw in en herstart
- Check `progress.json` voor je voortgang

---

## Voor Collega's

### Eerste keer setup

1. **Clone de repository:**
   ```bash
   git clone git@github.com:Cmusabe/instagram.git
   cd instagram
   ```

2. **Installeer dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Kies je methode:**
   - **Python script**: `python cancel_pending_requests.py`
   - **Browser console**: Volg instructies in Methode 2

### Progress.json

- `progress.json` bevat persoonlijke voortgang
- **Nieuw gebruik**: Verwijder `progress.json` om vanaf het begin te starten
- **Voortzetten**: Behoud het bestand om verder te gaan waar je was
- Het bestand wordt automatisch aangemaakt als het niet bestaat

### Bestanden die je nodig hebt

- ✅ `pending_usernames.txt` - Lijst met gebruikersnamen (aanwezig)
- ✅ `cancel_pending_requests.py` - Python script (aanwezig)
- ✅ `cancel_all_in_browser.js` - Browser console script (aanwezig)
- ✅ `requirements.txt` - Python dependencies (aanwezig)

### Alles werkt direct na pull!

Na `git pull` en `pip install -r requirements.txt` kun je direct aan de slag. Geen extra configuratie nodig!

---

## Statistieken

- **Totaal accounts**: ~4192 (zie `pending_usernames.txt`)
- **Geschatte tijd**: ~2-3 uur voor alle accounts (met 3s delay)
- **Snelheid**: ~120-150 accounts/minuut (snelheidsmodus)

---

## Licentie

Gebruik op eigen risico. Dit is geen officieel Instagram tool.

---

## Support

Voor vragen of problemen:
1. Check de [Problemen oplossen](#problemen-oplossen) sectie
2. Bekijk `INSTRUCTIES.md` voor gedetailleerde instructies
3. Check `README_CANCEL_REQUESTS.md` voor aanvullende informatie

---

**Laatste update**: 2025-11-08

