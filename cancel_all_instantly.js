/**
 * INSTAGRAM - Annuleer ALLE pending follow requests IN ÉÉN KEER
 * 
 * GEBRUIK:
 * 1. Open Instagram.com in je browser (ingelogd)
 * 2. Druk F12 om Developer Tools te openen
 * 3. Ga naar de "Console" tab
 * 4. Kopieer en plak dit HELE script
 * 5. Druk Enter
 * 
 * Het script zal automatisch alle 4192 accounts verwerken!
 */

(async function() {
    console.log("🚀 Script gestart! Alle pending follow requests worden nu geannuleerd...\n");
    
    // Gebruikersnamen uit het bestand (4291 accounts)
    // Deze worden automatisch geladen via fetch of je kunt ze hier plakken
    
    // Methode 1: Laad via fetch (als je het bestand op een server hebt)
    // Methode 2: Kopieer de lijst hieronder tussen de backticks
    
    const USERNAMES_LIST = `
_.ayaab
_.diana.rm
_.donnag
_.emmr
_.l.svc
_.milouuu._
_.serinaa
__.68.f
__.777.eu
__.gabriela.m
`;

    // Helper functies
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }
    
    async function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Parse gebruikersnamen
    function parseUsernames(text) {
        return text.trim().split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('//') && !line.startsWith('/*'));
    }
    
    // Laad gebruikersnamen - probeer eerst uit bestand te lezen
    let usernames = [];
    
    // Probeer usernames te laden uit het bestand (als het in dezelfde directory is)
    try {
        // Voor lokale bestanden, moeten we ze eerst kopiëren
        // Of gebruik de prompt hieronder
        console.log("📋 Gebruikersnamen laden...");
        
        // ALTERNATIEF: Gebruik een prompt om de lijst te plakken
        const userInput = prompt(
            "Plak hier ALLE gebruikersnamen uit pending_usernames.txt\n" +
            "(Één per regel, of druk Cancel en gebruik de handmatige methode)"
        );
        
        if (userInput && userInput.trim()) {
            usernames = parseUsernames(userInput);
            console.log(`✅ ${usernames.length} gebruikersnamen geladen via prompt`);
        } else {
            // Fallback: gebruik de lijst in het script
            console.log("⚠️ Geen input, probeer de volgende methode...");
            throw new Error("No usernames provided");
        }
    } catch (e) {
        console.log("📝 Gebruik de alternatieve methode hieronder...");
    }
    
    // Als geen usernames, stop
    if (usernames.length === 0) {
        console.error(`
❌ GEEN GEBRUIKERSNAMEN GEVONDEN!

Methode 1 (Aanbevolen):
1. Open pending_usernames.txt in Notepad
2. Selecteer ALLES (Ctrl+A) en kopieer (Ctrl+C)
3. Voer dit script opnieuw uit
4. Plak de lijst in de prompt

Methode 2:
Pas de USERNAMES_LIST variabele aan in het script met je gebruikersnamen.
        `);
        return;
    }
    
    console.log(`📊 Totaal te verwerken: ${usernames.length} accounts\n`);
    console.log(`⚙️  Instellingen:
   - Delay tussen requests: 2 seconden
   - Batch pauze: elke 100 accounts (30 sec)
   - Dit voorkomt rate limiting\n`);
    
    // Instagram API helpers
    const csrfToken = getCookie('csrftoken');
    
    if (!csrfToken) {
        console.error("❌ FOUT: Geen CSRF token gevonden. Zorg dat je ingelogd bent op Instagram!");
        return;
    }
    
    console.log(`✅ CSRF Token gevonden: ${csrfToken.substring(0, 10)}...\n`);
    
    // Functie om user ID op te halen
    async function getUserID(username) {
        try {
            const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;
            const response = await fetch(url, {
                headers: {
                    'x-ig-app-id': '936619743392459',
                    'x-requested-with': 'XMLHttpRequest',
                },
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            return data?.data?.user?.id;
        } catch (error) {
            throw new Error(`User ID lookup failed: ${error.message}`);
        }
    }
    
    // Functie om follow request te annuleren
    async function cancelFollowRequest(userId) {
        try {
            const url = `https://www.instagram.com/web/friendships/${userId}/unfollow/`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    'x-csrftoken': csrfToken,
                    'x-ig-app-id': '936619743392459',
                    'x-requested-with': 'XMLHttpRequest',
                },
                credentials: 'include',
                body: ''
            });
            
            // 200 = success, 400 = al niet meer pending, 429 = rate limit
            if (response.status === 200 || response.status === 204) {
                return true;
            } else if (response.status === 400) {
                // Mogelijk al geannuleerd
                return true;
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            throw new Error(`Cancel failed: ${error.message}`);
        }
    }
    
    // Hoofdloop: verwerk alle accounts
    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;
    const failedUsernames = [];
    const skippedUsernames = [];
    
    const startTime = Date.now();
    
    for (let i = 0; i < usernames.length; i++) {
        const username = usernames[i];
        const progress = `${i + 1}/${usernames.length}`;
        
        try {
            // Haal user ID op
            const userId = await getUserID(username);
            
            if (!userId) {
                console.log(`⏭️  [${progress}] SKIP: ${username} (account niet gevonden)`);
                skipCount++;
                skippedUsernames.push(username);
                await sleep(1500); // Korte delay
                continue;
            }
            
            // Annuleer request
            await cancelFollowRequest(userId);
            
            successCount++;
            console.log(`✅ [${progress}] Geannuleerd: ${username}`);
            
            // Batch pauze elke 100 accounts
            if ((i + 1) % 100 === 0) {
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
                console.log(`\n⏸️  Batch pauze (30 sec) - Progress: ${progress} | Succes: ${successCount} | Fails: ${failCount}\n`);
                await sleep(30000); // 30 seconden pauze
            } else {
                await sleep(2000); // 2 seconden tussen requests
            }
            
        } catch (error) {
            failCount++;
            failedUsernames.push(username);
            console.error(`❌ [${progress}] FAIL: ${username} - ${error.message}`);
            await sleep(2000); // Delay ook bij failures
        }
    }
    
    // Eindstatistieken
    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎉 KLAAR! Alle requests verwerkt`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📊 Statistieken:`);
    console.log(`   ✅ Succesvol geannuleerd: ${successCount}`);
    console.log(`   ❌ Gefaald: ${failCount}`);
    console.log(`   ⏭️  Overgeslagen: ${skipCount}`);
    console.log(`   ⏱️  Totale tijd: ${totalTime} minuten`);
    console.log(`${'='.repeat(60)}\n`);
    
    if (failedUsernames.length > 0) {
        console.log(`❌ Gefaalde accounts (${failedUsernames.length}):`);
        console.log(JSON.stringify(failedUsernames, null, 2));
        console.log(`\n💡 Tip: Probeer deze accounts later opnieuw\n`);
    }
    
    if (skippedUsernames.length > 0) {
        console.log(`⏭️  Overgeslagen accounts (${skippedUsernames.length}):`);
        console.log(JSON.stringify(skippedUsernames.slice(0, 10), null, 2));
        if (skippedUsernames.length > 10) {
            console.log(`... en ${skippedUsernames.length - 10} meer`);
        }
    }
    
    console.log(`\n✨ Script voltooid!`);
    
})();


