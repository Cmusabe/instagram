# Instagram Pending Follow Requests Annuleren

Dit script annuleert automatisch alle pending follow requests die je hebt verzonden op Instagram.

## ⚠️ Waarschuwing

- **Gebruik dit script op eigen risico**. Instagram kan rate limiting toepassen bij te snelle acties
- Het script gebruikt een vertraging tussen acties om rate limiting te voorkomen
- Het is mogelijk dat Instagram je account tijdelijk blokkeert bij te veel automatische acties
- Test eerst met een klein aantal accounts

## Vereisten

1. **Python 3.8+** geïnstalleerd
2. **Chrome browser** geïnstalleerd
3. De volgende Python packages:
   ```bash
   pip install -r requirements.txt
   ```

## Gebruik

1. **Installeer de vereisten:**

   ```bash
   pip install -r requirements.txt
   ```

2. **Voer het script uit:**

   ```bash
   python cancel_pending_requests.py
   ```

3. **Volg de instructies:**

   - Voer je Instagram gebruikersnaam in
   - Voer je Instagram wachtwoord in
   - Kies een vertraging tussen acties (standaard: 3 seconden - aanbevolen!)

4. **Wacht tot het script klaar is:**
   - Het script verwerkt automatisch alle 4192 accounts
   - Je ziet real-time progress updates
   - Het script pauzeert elke 100 accounts om rate limiting te voorkomen

## Instellingen

- **Vertraging (delay)**: Aantal seconden tussen elke actie
  - Standaard: 3 seconden (aanbevolen voor veiligheid)
  - Te laag (< 2): Risico op rate limiting
  - Te hoog (> 5): Veilig maar langzaam

## Output

Na afloop krijg je:

- Totaal aantal verwerkte accounts
- Aantal succesvol geannuleerde requests
- Aantal gefaalde requests
- Een bestand `failed_cancellations.txt` met accounts die niet geannuleerd konden worden

## Problemen oplossen

### "Login gefaald"

- Controleer je gebruikersnaam en wachtwoord
- Mogelijk vraagt Instagram om 2FA verificatie
- Probeer handmatig in te loggen op Instagram.com eerst

### "Kan 'Requested' knop niet vinden"

- Mogelijk is de request al geaccepteerd/geweigerd
- Mogelijk heeft Instagram de UI veranderd
- Check het account handmatig

### Rate limiting

- Verhoog de delay (bijvoorbeeld naar 5 seconden)
- Wacht een paar uur en hervat het script met `failed_cancellations.txt`

### Browser crasht

- Het script slaat progress niet op tussen runs
- Als het script stopt, kun je het opnieuw draaien (geannuleerde requests worden overgeslagen)

## Alternatieve methode (Browser Console)

Als je liever geen Python gebruikt, kun je ook de browser console methode gebruiken (zie het eerdere bericht).

