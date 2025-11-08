/**
 * Browser Console Script om alle pending follow requests te annuleren
 * 
 * INSTRUCTIES:
 * 1. Log in op Instagram.com
 * 2. Open de browser console (F12 -> Console tab)
 * 3. Plak dit script en druk Enter
 * 4. Het script begint automatisch alle pending requests te annuleren
 * 
 * WAARSCHUWING: Gebruik op eigen risico. Instagram kan rate limiting toepassen.
 */

(async function() {
    const DELAY = 3000; // 3 seconden tussen elke actie (in milliseconden)
    const BATCH_SIZE = 50; // Pauzeer elke X accounts
    
    // Lees gebruikersnamen uit het bestand (moet in dezelfde directory zijn)
    // OF: gebruik de lijst hieronder
    const usernames = [
        // Plak hier de gebruikersnamen uit pending_usernames.txt
        // Of laad ze dynamisch via fetch (alleen als je de file op een server hebt)
    ];
    
    console.log("Script gestart! Verzamelen van pending requests...");
    
    // Functie om de volgende pending request te vinden en te annuleren
    function findAndCancelNextRequest() {
        // Zoek naar alle "Requested" knoppen op de huidige pagina
        const requestedButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
            const text = btn.textContent.trim();
            return text.includes('Requested') || text.includes('Verzoek verzonden');
        });
        
        if (requestedButtons.length > 0) {
            const button = requestedButtons[0];
            button.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            setTimeout(() => {
                button.click();
                console.log(`Request geannuleerd (${requestedButtons.length - 1} resterend op deze pagina)`);
                
                setTimeout(() => {
                    // Check voor bevestigingsmenu
                    const confirmButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
                        const text = btn.textContent.trim();
                        return text.includes('Cancel Request') || text.includes('Unfollow') || text.includes('Annuleer');
                    });
                    
                    if (confirmButtons.length > 0) {
                        confirmButtons[0].click();
                    }
                    
                    // Verwerk volgende request
                    setTimeout(findAndCancelNextRequest, DELAY);
                }, 1000);
            }, 1000);
        } else {
            console.log("Geen 'Requested' knoppen meer gevonden op deze pagina.");
            console.log("Ga naar de volgende pagina met pending requests of refresh de pagina.");
        }
    }
    
    // Alternatieve methode: ga naar elk profiel en annuleer daar
    async function cancelViaProfileList() {
        // Eerst: ga naar een lijst met pending requests (als beschikbaar)
        // Instagram heeft geen directe pagina voor dit, dus we moeten anders werken
        
        console.log("LET OP: Instagram heeft geen directe 'pending requests' pagina.");
        console.log("Gebruik liever het Python script of annuleer handmatig via elk profiel.");
        console.log("\nAls alternatief kun je:");
        console.log("1. Elke username handmatig in de URL typen");
        console.log("2. Of het Python automation script gebruiken");
    }
    
    // Start het proces
    console.log("\nMethode 1: Zoek op de huidige pagina naar 'Requested' knoppen...");
    findAndCancelNextRequest();
    
    console.log("\nTIP: Navigeer naar profielen met pending requests en dit script annuleert ze automatisch.");
    console.log("TIP: Voor volledige automatisering, gebruik het Python script (cancel_pending_requests.py)");
    
})();


