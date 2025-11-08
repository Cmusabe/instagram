/**
 * INSTAGRAM - Annuleer ALLE pending follow requests IN ÉÉN KEER
 * 
 * INSTRUCTIES:
 * 1. Je bent al ingelogd op Instagram.com ✅
 * 2. Open Developer Tools: Druk F12
 * 3. Ga naar de "Console" tab
 * 4. Kopieer en plak dit HELE script en druk Enter
 * 5. Plak de gebruikersnamen wanneer gevraagd (uit pending_usernames.txt)
 * 
 * Het script verwerkt automatisch alle ~4192 accounts!
 */

(async function() {
    console.log("🚀 Instagram Pending Requests Annuler Script");
    console.log("=".repeat(60));
    
    // Vraag om gebruikersnamen
    console.log("\n📋 Stap 1: Gebruikersnamen kopiëren");
    console.log("1. Open pending_usernames.txt in Notepad");
    console.log("2. Selecteer ALLES (Ctrl+A) en kopieer (Ctrl+C)");
    console.log("3. Kom terug naar deze console");
    
    const userInput = prompt(
        "Plak hier ALLE gebruikersnamen uit pending_usernames.txt\n" +
        "(Druk Ctrl+V om te plakken)\n\n" +
        "Of druk Cancel om het script te stoppen."
    );
    
    if (!userInput || !userInput.trim()) {
        console.log("❌ Geen gebruikersnamen opgegeven. Script gestopt.");
        return;
    }
    
    // Parse gebruikersnamen (één per regel)
    const usernames = userInput.trim().split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    if (usernames.length === 0) {
        console.log("❌ Geen geldige gebruikersnamen gevonden. Script gestopt.");
        return;
    }
    
    console.log(`\n✅ ${usernames.length} gebruikersnamen geladen!\n`);
    
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
    
    // Check CSRF token
    const csrfToken = getCookie('csrftoken');
    if (!csrfToken) {
        console.error("❌ FOUT: Geen CSRF token gevonden!");
        console.error("Zorg dat je ingelogd bent op Instagram.com");
        return;
    }
    
    console.log(`✅ CSRF Token gevonden`);
    console.log(`⚙️  Instellingen:`);
    console.log(`   - Delay tussen requests: 2 seconden`);
    console.log(`   - Batch pauze: elke 100 accounts (30 sec)`);
    console.log(`   - Dit voorkomt rate limiting\n`);
    console.log(`🎯 Start verwerking...\n`);
    
    // Functie om direct naar profiel te gaan en request te annuleren (werkt betrouwbaarder)
    async function cancelFollowRequestByVisiting(username) {
        try {
            // Navigeer naar het profiel
            const profileUrl = `https://www.instagram.com/${username}/`;
            window.location.href = profileUrl;
            
            // Wacht tot pagina geladen is
            await sleep(3000);
            
            // Zoek naar "Requested" knop
            let requestedButton = null;
            const possibleSelectors = [
                'button:contains("Requested")',
                'button:contains("Verzoek verzonden")',
                '*[aria-label*="Requested"]',
                '*[aria-label*="Verzoek"]',
                'button[type="button"]'
            ];
            
            // Zoek door alle buttons
            const allButtons = Array.from(document.querySelectorAll('button'));
            for (const btn of allButtons) {
                const text = btn.textContent.trim() || btn.innerText.trim() || btn.getAttribute('aria-label') || '';
                if (text.includes('Requested') || text.includes('Verzoek verzonden') || 
                    text.includes('Cancel Request') || text.includes('Verzoek annuleren')) {
                    requestedButton = btn;
                    break;
                }
            }
            
            if (!requestedButton) {
                // Check of er geen "Requested" meer is (mogelijk al geannuleerd)
                const pageText = document.body.textContent || document.body.innerText;
                if (!pageText.includes('Requested') && !pageText.includes('Verzoek verzonden')) {
                    return true; // Geen pending request meer
                }
                throw new Error('Requested knop niet gevonden');
            }
            
            // Scroll naar knop en klik
            requestedButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await sleep(500);
            
            // Probeer te klikken
            requestedButton.click();
            await sleep(1000);
            
            // Check voor bevestigingsmenu
            const confirmButtons = Array.from(document.querySelectorAll('button')).find(btn => {
                const text = btn.textContent.trim() || btn.innerText.trim() || '';
                return text.includes('Cancel Request') || text.includes('Unfollow') || 
                       text.includes('Annuleer') || text.includes('Ontvolgen');
            });
            
            if (confirmButtons) {
                confirmButtons.click();
                await sleep(500);
            }
            
            return true;
            
        } catch (error) {
            throw new Error(`Cancel failed: ${error.message}`);
        }
    }
    
    // Fallback: probeer eerst API, dan direct profiel bezoeken
    async function cancelFollowRequest(username) {
        try {
            // Probeer eerst via API (sneller)
            try {
                const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;
                const response = await fetch(url, {
                    headers: {
                        'x-ig-app-id': '936619743392459',
                        'x-requested-with': 'XMLHttpRequest',
                    },
                    credentials: 'include'
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const userId = data?.data?.user?.id;
                    
                    if (userId) {
                        const unfollowUrl = `https://www.instagram.com/web/friendships/${userId}/unfollow/`;
                        const unfollowResponse = await fetch(unfollowUrl, {
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
                        
                        if (unfollowResponse.status === 200 || unfollowResponse.status === 204 || unfollowResponse.status === 400) {
                            return true;
                        }
                    }
                }
            } catch (apiError) {
                // API faalt, gebruik alternatieve methode
                console.log(`⚠️ API call failed voor ${username}, gebruik alternatieve methode...`);
            }
            
            // Fallback: bezoek profiel direct
            return await cancelFollowRequestByVisiting(username);
            
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
    const total = usernames.length;
    
    for (let i = 0; i < total; i++) {
        const username = usernames[i];
        const progress = `${i + 1}/${total}`;
        
        try {
            // Haal user ID op
            const userId = await getUserID(username);
            
            if (!userId) {
                console.log(`⏭️  [${progress}] SKIP: ${username} (account niet gevonden)`);
                skipCount++;
                skippedUsernames.push(username);
                await sleep(1500);
                continue;
            }
            
            // Annuleer request
            await cancelFollowRequest(userId);
            
            successCount++;
            
            // Toon progress elke 10 accounts of belangrijke milestones
            if ((i + 1) % 10 === 0 || (i + 1) === 1 || (i + 1) === total) {
                const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
                const rate = ((i + 1) / ((Date.now() - startTime) / 1000)).toFixed(1);
                console.log(`✅ [${progress}] ${username} | Succes: ${successCount} | Fails: ${failCount} | ${elapsed}min | ~${rate}/sec`);
            }
            
            // Batch pauze elke 100 accounts
            if ((i + 1) % 100 === 0 && (i + 1) < total) {
                const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
                console.log(`\n⏸️  Batch pauze (30 sec) - Progress: ${progress} | Succes: ${successCount} | Fails: ${failCount} | Tijd: ${elapsed}min\n`);
                await sleep(30000); // 30 seconden pauze
            } else {
                await sleep(2000); // 2 seconden tussen requests
            }
            
        } catch (error) {
            failCount++;
            failedUsernames.push(username);
            console.error(`❌ [${progress}] ${username} - ${error.message}`);
            await sleep(2000); // Delay ook bij failures
        }
    }
    
    // Eindstatistieken
    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    const successRate = ((successCount / total) * 100).toFixed(1);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎉 KLAAR! Alle requests verwerkt`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📊 Statistieken:`);
    console.log(`   ✅ Succesvol geannuleerd: ${successCount} (${successRate}%)`);
    console.log(`   ❌ Gefaald: ${failCount}`);
    console.log(`   ⏭️  Overgeslagen: ${skipCount}`);
    console.log(`   📦 Totaal: ${total}`);
    console.log(`   ⏱️  Totale tijd: ${totalTime} minuten`);
    console.log(`${'='.repeat(60)}\n`);
    
    if (failedUsernames.length > 0) {
        console.log(`❌ Gefaalde accounts (${failedUsernames.length}):`);
        console.log(JSON.stringify(failedUsernames.slice(0, 20), null, 2));
        if (failedUsernames.length > 20) {
            console.log(`... en ${failedUsernames.length - 20} meer`);
        }
        console.log(`\n💡 Tip: Probeer deze accounts later opnieuw\n`);
        
        // Kopieerbaar maken
        console.log(`📋 Kopieer deze lijst om later opnieuw te proberen:`);
        console.log(failedUsernames.join('\n'));
    }
    
    if (skippedUsernames.length > 0) {
        console.log(`\n⏭️  Overgeslagen accounts (${skippedUsernames.length}):`);
        console.log(`(Mogelijk verwijderde accounts of privé accounts)`);
    }
    
    console.log(`\n✨ Script voltooid!`);
    console.log(`💾 Statistieken zijn hierboven zichtbaar.\n`);
    
})();

