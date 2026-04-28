# InstaClean Chrome Extension

Chrome Extension om Instagram pending follow requests in bulk te annuleren. Geen F12, geen console, geen scripts plakken.

## Installatie (Developer Mode)

1. Open Chrome en ga naar `chrome://extensions/`
2. Zet **Developer mode** aan (rechtsboven)
3. Klik **Load unpacked**
4. Selecteer deze `extension/` map
5. De InstaClean extensie verschijnt in je toolbar

## Gebruik

1. Ga naar [instagram.com](https://www.instagram.com) en log in
2. Klik op het InstaClean icoon in de Chrome toolbar
3. Upload je Instagram data export (HTML/JSON/TXT) of plak usernames
4. Kies een snelheidsprofiel (Veilig / Gebalanceerd / Snel)
5. Klik **Start** en wacht tot het klaar is

## Architectuur

```
extension/
├── manifest.json           # Manifest V3 configuratie
├── popup/                  # UI die verschijnt bij klik op icoon
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/                # Draait op instagram.com
│   └── content.js          # Maakt de API calls
├── background/             # Service worker
│   └── background.js       # Message relay + badge
├── utils/                  # Gedeelde hulpfuncties
│   ├── parser.js           # Username extractie uit exports
│   ├── instagram-api.js    # Instagram API wrapper
│   └── storage.js          # chrome.storage wrapper
└── icons/                  # Extensie iconen
```

## Hoe het werkt

1. Het **content script** draait op instagram.com en heeft toegang tot de sessie-cookies
2. De **popup** is de UI waar je usernames uploadt en voortgang ziet
3. De popup stuurt berichten naar het content script via `chrome.runtime.sendMessage`
4. Het content script maakt API calls naar Instagram (dezelfde als handmatig klikken op "Unfollow")
5. Voortgang wordt opgeslagen in `chrome.storage.local` zodat je kunt hervatten

## Veiligheid

- Geen wachtwoord nodig (gebruikt bestaande Instagram sessie)
- Alle data blijft lokaal (geen externe servers)
- Geen tracking of analytics
- Open source — inspecteer de code zelf

## API Endpoints

Het script gebruikt twee Instagram API endpoints:

- `GET /api/v1/users/web_profile_info/?username=...` — User ID opzoeken
- `POST https://i.instagram.com/api/v1/web/friendships/{id}/unfollow/` — Probeer de pending request te annuleren
- `POST /api/v1/friendships/destroy/{id}/` — Fallback als Instagram de eerste route niet bevestigt

Na elke POST controleert de extensie opnieuw of de account nog steeds op `Requested` staat, zodat een 200-response niet automatisch als succes wordt geteld.
