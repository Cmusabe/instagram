/**
 * INSTAGRAM - Annuleer pending requests door direct naar profielen te gaan
 * 
 * DEZE VERSIE WERKT BETROUWBARDER:
 * - Gaat naar elk profiel
 * - Zoekt de "Requested" knop
 * - Klikt om te annuleren
 * 
 * INSTRUCTIES:
 * 1. Log in op Instagram.com
 * 2. Open F12 → Console tab
 * 3. Typ: allow pasting
 * 4. Plak dit script
 * 5. Plak gebruikersnamen wanneer gevraagd
 */

(async function() {
    console.log("🚀 Instagram Direct Profile Method");
    console.log("=".repeat(60));
    console.log("\n📋 Deze methode gaat naar elk profiel en annuleert daar");
    console.log("⚠️  Let op: Je browser navigeert door alle profielen!\n");
    
    // Vraag om gebruikersnamen
    const userInput = prompt(
        "Plak hier ALLE gebruikersnamen uit pending_usernames.txt\n" +
        "(Één per regel)\n\n" +
        "Of druk Cancel om te stoppen."
    );
    
    if (!userInput || !userInput.trim()) {
        console.log("❌ Geen gebruikersnamen opgegeven. Script gestopt.");
        return;
    }
    
    const usernames = userInput.trim().split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    if (usernames.length === 0) {
        console.log("❌ Geen geldige gebruikersnamen gevonden.");
        return;
    }
    
    console.log(`✅ ${usernames.length} gebruikersnamen geladen!\n`);
    console.log(`⚙️  Instellingen:`);
    console.log(`   - Delay tussen profielen: 4 seconden`);
    console.log(`   - Pauze elke 50 accounts: 30 seconden\n`);
    
    async function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;
    const failedUsernames = [];
    const startTime = Date.now();
    
    // Functie om request te annuleren op huidige pagina
    function cancelRequestOnCurrentPage() {
        // Zoek alle buttons
        const allButtons = Array.from(document.querySelectorAll('button'));
        
        for (const btn of allButtons) {
            const text = (btn.textContent || btn.innerText || btn.getAttribute('aria-label') || '').trim();
            
            if (text.includes('Requested') || text.includes('Verzoek verzonden')) {
                // Scroll naar knop
                btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Klik
                setTimeout(() => {
                    btn.click();
                    
                    // Check voor bevestiging
                    setTimeout(() => {
                        const confirmBtns = Array.from(document.querySelectorAll('button')).find(b => {
                            const t = (b.textContent || b.innerText || '').trim();
                            return t.includes('Cancel') || t.includes('Unfollow') || t.includes('Annuleer');
                        });
                        
                        if (confirmBtns) {
                            confirmBtns.click();
                        }
                    }, 500);
                }, 500);
                
                return true;
            }
        }
        
        return false;
    }
    
    // Verwerk alle accounts
    for (let i = 0; i < usernames.length; i++) {
        const username = usernames[i];
        const progress = `${i + 1}/${usernames.length}`;
        
        try {
            // Navigeer naar profiel
            const profileUrl = `https://www.instagram.com/${username}/`;
            console.log(`[${progress}] Bezoeken: ${username}...`);
            
            window.location.href = profileUrl;
            
            // Wacht tot pagina geladen
            await sleep(4000);
            
            // Probeer request te annuleren
            const cancelled = cancelRequestOnCurrentPage();
            
            if (cancelled) {
                successCount++;
                console.log(`✅ [${progress}] Geannuleerd: ${username}`);
            } else {
                // Check of er geen request meer is
                const pageText = document.body.textContent || '';
                if (!pageText.includes('Requested') && !pageText.includes('Verzoek verzonden')) {
                    skipCount++;
                    console.log(`⏭️  [${progress}] SKIP: ${username} (geen pending request)`);
                } else {
                    failCount++;
                    failedUsernames.push(username);
                    console.log(`❌ [${progress}] FAIL: ${username} (knop niet gevonden)`);
                }
            }
            
            // Batch pauze
            if ((i + 1) % 50 === 0 && (i + 1) < usernames.length) {
                console.log(`\n⏸️  Pauze 30 sec (${progress} verwerkt)...\n`);
                await sleep(30000);
            } else {
                await sleep(2000);
            }
            
        } catch (error) {
            failCount++;
            failedUsernames.push(username);
            console.error(`❌ [${progress}] ERROR: ${username} - ${error.message}`);
            await sleep(2000);
        }
    }
    
    // Eindstatistieken
    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎉 KLAAR!`);
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Succesvol: ${successCount}`);
    console.log(`❌ Gefaald: ${failCount}`);
    console.log(`⏭️  Overgeslagen: ${skipCount}`);
    console.log(`⏱️  Tijd: ${totalTime} minuten`);
    console.log(`${'='.repeat(60)}\n`);
    
    if (failedUsernames.length > 0) {
        console.log(`❌ Gefaalde accounts:\n${failedUsernames.join('\n')}\n`);
    }
    
})();


