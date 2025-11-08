"""
Script om automatisch alle pending follow requests op Instagram te annuleren.
Gebruik dit script op eigen risico. Instagram kan rate limiting toepassen.

Vereisten:
- pip install selenium webdriver-manager
- Chrome browser geïnstalleerd
"""

import time
import random
import json
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException, ElementClickInterceptedException, InvalidSessionIdException
from webdriver_manager.chrome import ChromeDriverManager
from datetime import datetime

class InstagramCancelRequests:
    def __init__(self, usernames_file='pending_usernames.txt', delay=3):
        """
        Args:
            usernames_file: Pad naar het bestand met gebruikersnamen (één per regel)
            delay: Vertraging tussen acties in seconden (voor veiligheid)
        """
        self.usernames_file = usernames_file
        self.delay = delay
        self.driver = None
        self.cancelled_count = 0
        self.failed_count = 0
        self.failed_usernames = []
        self.progress_file = 'progress.json'
        self.completed_usernames = set()
        self.load_progress()
        # Veilige snelheidsprofiel (kan later aangepast worden)
        self.min_delay = 1.0
        self.max_delay = 2.5
        self.short_batch = 50
        self.short_pause_range = (60, 120)  # 1-2 min
        self.long_batch = 250
        self.long_pause_range = (600, 1200)  # 10-20 min

    def sleep_jitter(self, a=None, b=None):
        """Slaap met willekeurige jitter (meer menselijk gedrag)."""
        low = self.min_delay if a is None else a
        high = self.max_delay if b is None else b
        try:
            time.sleep(random.uniform(low, high))
        except Exception:
            time.sleep(low)

    def detect_action_blocked(self):
        """Detecteer meldingen zoals 'Probeer het later opnieuw' / action blocked."""
        try:
            body_text = self.driver.find_element(By.TAG_NAME, "body").text.lower()
            keywords = [
                'probeer het later opnieuw',
                'actie geblokkeerd',
                'bepaalde activiteit is beperkt',
                'try again later',
                'we restrict certain activity',
                'we limit how often'
            ]
            return any(k in body_text for k in keywords)
        except Exception:
            return False
    
    def is_session_valid(self):
        """Check of de browser sessie nog geldig is."""
        try:
            if self.driver is None:
                return False
            # Probeer een simpele operatie uit te voeren
            self.driver.current_url
            return True
        except (InvalidSessionIdException, Exception):
            return False
    
    def reconnect_driver(self):
        """Herstel de browser sessie door een nieuwe driver te maken."""
        try:
            print("[WARNING] Browser sessie verloren. Probeer te herstellen...")
            if self.driver:
                try:
                    self.driver.quit()
                except:
                    pass
            self.setup_driver()
            print("[INFO] Browser sessie hersteld. Je moet opnieuw inloggen.")
            return True
        except Exception as e:
            print(f"[ERROR] Kon browser sessie niet herstellen: {e}")
            return False
        
    def setup_driver(self):
        """Zet de Chrome WebDriver op"""
        chrome_options = Options()
        # Optioneel: gebruik headless mode (geen zichtbare browser)
        # chrome_options.add_argument('--headless')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        self.driver.implicitly_wait(5)
    
    def animate_click(self, element, button_name="knop"):
        """
        Voer een geanimeerde klik uit met visuele feedback:
        1. Scroll naar element met smooth animatie
        2. Hover over element
        3. Highlight element (border + glow)
        4. Mouse beweging naar element
        5. Klik op element
        6. Verwijder highlight
        """
        try:
            print(f"[ANIMATIE] Start visuele animatie voor '{button_name}'...")
            
            # Stap 1: Scroll naar element met smooth animatie
            print(f"[ANIMATIE] Scroll naar '{button_name}'...")
            self.driver.execute_script("""
                arguments[0].scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'center'
                });
            """, element)
            time.sleep(1.2)  # Wacht zodat scroll animatie zichtbaar is
            
            # Stap 2: Highlight element met border en glow effect
            print(f"[ANIMATIE] Highlight '{button_name}' met border en glow...")
            self.driver.execute_script("""
                var element = arguments[0];
                var originalStyle = {
                    border: element.style.border,
                    boxShadow: element.style.boxShadow,
                    transition: element.style.transition,
                    transform: element.style.transform
                };
                
                // Sla originele stijl op voor later
                element.setAttribute('data-original-style', JSON.stringify(originalStyle));
                
                // Voeg highlight effecten toe
                element.style.border = '3px solid #0095f6';
                element.style.boxShadow = '0 0 15px rgba(0, 149, 246, 0.8), 0 0 30px rgba(0, 149, 246, 0.4)';
                element.style.transition = 'all 0.3s ease';
                element.style.transform = 'scale(1.05)';
                element.style.zIndex = '9999';
            """, element)
            time.sleep(0.8)  # Wacht zodat highlight zichtbaar is
            
            # Stap 3: Hover effect (mouseover event)
            print(f"[ANIMATIE] Hover over '{button_name}'...")
            self.driver.execute_script("""
                var element = arguments[0];
                var event = new MouseEvent('mouseover', {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    clientX: element.getBoundingClientRect().left + element.offsetWidth / 2,
                    clientY: element.getBoundingClientRect().top + element.offsetHeight / 2
                });
                element.dispatchEvent(event);
            """, element)
            time.sleep(0.6)  # Wacht zodat hover zichtbaar is
            
            # Stap 4: Mouse beweging naar element (ActionChains)
            print(f"[ANIMATIE] Beweeg muis naar '{button_name}'...")
            try:
                actions = ActionChains(self.driver)
                actions.move_to_element(element).perform()
                time.sleep(0.5)  # Wacht zodat muis beweging zichtbaar is
            except:
                pass
            
            # Stap 5: Klik op element
            print(f"[ANIMATIE] Klik op '{button_name}'...")
            try:
                # Normale click eerst (meest zichtbaar)
                element.click()
                print(f"[OK] Geklikt op '{button_name}'!")
            except:
                # Fallback: JavaScript click
                self.driver.execute_script("arguments[0].click();", element)
                print(f"[OK] Geklikt op '{button_name}' via JavaScript!")
            
            time.sleep(0.5)  # Wacht zodat klik zichtbaar is
            
            # Stap 6: Verwijder highlight effecten (na korte delay)
            time.sleep(0.3)
            self.driver.execute_script("""
                var element = arguments[0];
                try {
                    var originalStyle = JSON.parse(element.getAttribute('data-original-style') || '{}');
                    element.style.border = originalStyle.border || '';
                    element.style.boxShadow = originalStyle.boxShadow || '';
                    element.style.transition = originalStyle.transition || '';
                    element.style.transform = originalStyle.transform || '';
                    element.style.zIndex = '';
                } catch(e) {
                    element.style.border = '';
                    element.style.boxShadow = '';
                    element.style.transform = '';
                    element.style.zIndex = '';
                }
            """, element)
            
            print(f"[ANIMATIE] Visuele animatie voltooid voor '{button_name}'!")
            
        except Exception as e:
            print(f"[WARNING] Animatie fout voor '{button_name}': {e}")
            # Fallback: gewoon klikken zonder animatie
            try:
                element.click()
            except:
                self.driver.execute_script("arguments[0].click();", element)
    
    def load_progress(self):
        """Laad opgeslagen voortgang"""
        if os.path.exists(self.progress_file):
            try:
                with open(self.progress_file, 'r', encoding='utf-8') as f:
                    progress_data = json.load(f)
                    self.completed_usernames = set(progress_data.get('completed', []))
                    self.cancelled_count = progress_data.get('cancelled_count', 0)
                    self.failed_count = progress_data.get('failed_count', 0)
                    self.failed_usernames = progress_data.get('failed_usernames', [])
                    last_updated = progress_data.get('last_updated', 'Onbekend')
                    print(f"[INFO] Opgeslagen voortgang geladen:")
                    print(f"  - {len(self.completed_usernames)} accounts al verwerkt")
                    print(f"  - {self.cancelled_count} geannuleerd, {self.failed_count} gefaald")
                    print(f"  - Laatste update: {last_updated}")
                    return True
            except Exception as e:
                print(f"[INFO] Kon voortgang niet laden: {e}")
                print("[INFO] Start vanaf begin")
                return False
        return False
    
    def save_progress(self, username, success=True):
        """Sla voortgang op"""
        if username not in self.completed_usernames:
            self.completed_usernames.add(username)
            try:
                progress_data = {
                    'completed': sorted(list(self.completed_usernames)),
                    'cancelled_count': self.cancelled_count,
                    'failed_count': self.failed_count,
                    'failed_usernames': self.failed_usernames,
                    'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                }
                with open(self.progress_file, 'w', encoding='utf-8') as f:
                    json.dump(progress_data, f, indent=2, ensure_ascii=False)
            except Exception as e:
                print(f"[WARNING] Kon voortgang niet opslaan: {e}")
        
    def login(self, username, password, max_retries=3):
        """Log in op Instagram met retry logica"""
        print(f"\n[INFO] Inloggen op Instagram...")
        
        for attempt in range(1, max_retries + 1):
            try:
                print(f"[INFO] Login poging {attempt}/{max_retries}...")
                
                # Check of sessie nog geldig is
                if not self.is_session_valid():
                    print("[WARNING] Browser sessie verloren, probeer te herstellen...")
                    if not self.reconnect_driver():
                        print("[ERROR] Kon browser sessie niet herstellen")
                        if attempt < max_retries:
                            print(f"[INFO] Wacht 5 seconden en probeer opnieuw...")
                            time.sleep(5)
                            continue
                        return False
                
                # Navigeer naar login pagina
                try:
                    self.driver.get("https://www.instagram.com/accounts/login/")
                    time.sleep(2)  # Wacht tot pagina geladen is
                except Exception as e:
                    print(f"[WARNING] Kon niet naar login pagina navigeren: {e}")
                    if attempt < max_retries:
                        print(f"[INFO] Wacht 5 seconden en probeer opnieuw...")
                        time.sleep(5)
                        continue
                    return False
                
                # Cookie banner accepteren (als aanwezig)
                try:
                    cookie_button = WebDriverWait(self.driver, 5).until(
                        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Accept') or contains(text(), 'Accepteren')]"))
                    )
                    cookie_button.click()
                    time.sleep(1)
                except TimeoutException:
                    pass
                except Exception as e:
                    print(f"[DEBUG] Cookie banner niet gevonden of fout: {e}")
                
                # Username en password invoeren - probeer meerdere selectors
                username_input = None
                password_input = None
                
                try:
                    # Probeer verschillende selectors voor username
                    username_selectors = [
                        (By.NAME, "username"),
                        (By.NAME, "text"),
                        (By.XPATH, "//input[@name='username']"),
                        (By.XPATH, "//input[@name='text']"),
                        (By.XPATH, "//input[@type='text']"),
                        (By.XPATH, "//input[@placeholder*='gebruikersnaam' or @placeholder*='username' or @placeholder*='Mobiel nummer']"),
                    ]
                    
                    for selector_type, selector_value in username_selectors:
                        try:
                            username_input = WebDriverWait(self.driver, 3).until(
                                EC.presence_of_element_located((selector_type, selector_value))
                            )
                            if username_input.is_displayed() and username_input.is_enabled():
                                print(f"[DEBUG] Username veld gevonden via {selector_type}: {selector_value}")
                                break
                        except:
                            continue
                    
                    if not username_input:
                        raise Exception("Kon username veld niet vinden")
                    
                    # Probeer verschillende selectors voor password
                    password_selectors = [
                        (By.NAME, "password"),
                        (By.XPATH, "//input[@name='password']"),
                        (By.XPATH, "//input[@type='password']"),
                        (By.XPATH, "//input[@placeholder*='Wachtwoord' or @placeholder*='Password']"),
                    ]
                    
                    for selector_type, selector_value in password_selectors:
                        try:
                            password_input = self.driver.find_element(selector_type, selector_value)
                            if password_input.is_displayed() and password_input.is_enabled():
                                print(f"[DEBUG] Password veld gevonden via {selector_type}: {selector_value}")
                                break
                        except:
                            continue
                    
                    if not password_input:
                        raise Exception("Kon password veld niet vinden")
                    
                    # Vul username en password in
                    username_input.clear()
                    username_input.send_keys(username)
                    time.sleep(0.5)
                    
                    password_input.clear()
                    password_input.send_keys(password)
                    time.sleep(0.5)
                    print("[DEBUG] Username en password ingevoerd")
                    
                except Exception as e:
                    print(f"[ERROR] Kon username/password niet invoeren: {e}")
                    print(f"[DEBUG] Huidige URL: {self.driver.current_url}")
                    if attempt < max_retries:
                        print(f"[INFO] Wacht 5 seconden en probeer opnieuw...")
                        time.sleep(5)
                        continue
                    return False
                
                # Login knop klikken - probeer meerdere selectors
                try:
                    login_selectors = [
                        (By.XPATH, "//button[@type='submit']"),
                        (By.XPATH, "//button[contains(text(), 'Aanmelden') or contains(text(), 'Log in')]"),
                        (By.XPATH, "//button[contains(., 'Aanmelden') or contains(., 'Log in')]"),
                        (By.XPATH, "//div[@role='button' and contains(text(), 'Aanmelden')]"),
                    ]
                    
                    login_button = None
                    for selector_type, selector_value in login_selectors:
                        try:
                            login_button = self.driver.find_element(selector_type, selector_value)
                            if login_button.is_displayed() and login_button.is_enabled():
                                print(f"[DEBUG] Login knop gevonden via {selector_type}: {selector_value}")
                                break
                        except:
                            continue
                    
                    if not login_button:
                        raise Exception("Kon login knop niet vinden")
                    
                    # Scroll naar knop en klik
                    self.driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", login_button)
                    time.sleep(0.5)
                    login_button.click()
                    print("[DEBUG] Login knop geklikt")
                    time.sleep(3)  # Wacht op login response
                    
                except Exception as e:
                    print(f"[ERROR] Kon login knop niet klikken: {e}")
                    print(f"[DEBUG] Huidige URL: {self.driver.current_url}")
                    if attempt < max_retries:
                        print(f"[INFO] Wacht 5 seconden en probeer opnieuw...")
                        time.sleep(5)
                        continue
                    return False
                
                # Wachten op login success of error
                try:
                    # Check voor "Save your login info?" of "Not now"
                    WebDriverWait(self.driver, 15).until(
                        EC.presence_of_element_located((By.XPATH, "//button[contains(text(), 'Not Now') or contains(text(), 'Nu niet')]"))
                    )
                    print("[INFO] Login succesvol!")
                    return True
                except TimeoutException:
                    # Check of we op Instagram zijn (mogelijk al ingelogd)
                    current_url = self.driver.current_url
                    if "instagram.com" in current_url and "/accounts/login/" not in current_url:
                        print("[INFO] Mogelijk al ingelogd of login succesvol")
                        return True
                    
                    # Check voor login errors
                    try:
                        error_elements = self.driver.find_elements(By.XPATH, "//div[contains(@class, 'error')] | //p[contains(@class, 'error')] | //div[contains(text(), 'incorrect')]")
                        if error_elements:
                            error_text = error_elements[0].text
                            print(f"[ERROR] Login gefaald: {error_text}")
                            if attempt < max_retries:
                                print(f"[INFO] Wacht 5 seconden en probeer opnieuw...")
                                time.sleep(5)
                                continue
                            return False
                    except:
                        pass
                    
                    # Als we hier zijn, is login mogelijk gefaald maar geen duidelijke error
                    print("[WARNING] Login status onduidelijk - check handmatig")
                    if attempt < max_retries:
                        print(f"[INFO] Wacht 5 seconden en probeer opnieuw...")
                        time.sleep(5)
                        continue
                    return False
                    
            except InvalidSessionIdException:
                print("[ERROR] Browser sessie verloren tijdens login")
                if attempt < max_retries:
                    if self.reconnect_driver():
                        print(f"[INFO] Browser hersteld, probeer opnieuw...")
                        time.sleep(3)
                        continue
                return False
            except Exception as e:
                print(f"[ERROR] Onverwachte login error (poging {attempt}/{max_retries}): {e}")
                import traceback
                traceback.print_exc()
                if attempt < max_retries:
                    print(f"[INFO] Wacht 5 seconden en probeer opnieuw...")
                    time.sleep(5)
                    continue
                return False
        
        print("[ERROR] Alle login pogingen gefaald")
        return False
    
    def cancel_follow_request(self, target_username):
        """
        Annuleer een follow request voor een specifieke gebruiker - SNELLE API METHODE
        """
        try:
            # SNELSTE METHODE: Gebruik Instagram API direct via JavaScript
            # Geen pagina navigatie nodig - veel sneller!
            
            # Stap 1: Haal user ID op via API
            user_id = None
            try:
                user_id_script = f"""
                return fetch('https://www.instagram.com/api/v1/users/web_profile_info/?username={target_username}', {{
                    headers: {{
                        'x-ig-app-id': '936619743392459',
                        'x-requested-with': 'XMLHttpRequest',
                    }},
                    credentials: 'include'
                }})
                .then(r => r.json())
                .then(data => data?.data?.user?.id || null)
                .catch(() => null);
                """
                user_id = self.driver.execute_async_script(f"""
                    var callback = arguments[arguments.length - 1];
                    {user_id_script.replace('return fetch', 'fetch').replace('|| null', '|| null').replace('.then', '.then')}
                    .then(id => callback(id))
                    .catch(() => callback(null));
                """)
            except:
                pass
            
            # Als user ID niet gevonden via async, probeer sync
            if not user_id:
                try:
                    # Navigeer naar profiel (alleen als API faalt)
                    profile_url = f"https://www.instagram.com/{target_username}/"
                    self.driver.get(profile_url)
                    time.sleep(0.5)  # Minimaal wachten
                    
                    # Probeer user ID uit URL of data
                    user_id_script = """
                    var scripts = document.querySelectorAll('script[type="application/json"]');
                    for (var s of scripts) {
                        try {
                            var data = JSON.parse(s.textContent);
                            if (data?.config?.viewerId) return data.config.viewerId;
                            if (data?.entry_data?.ProfilePage?.[0]?.graphql?.user?.id) 
                                return data.entry_data.ProfilePage[0].graphql.user.id;
                        } catch(e) {}
                    }
                    return null;
                    """
                    user_id = self.driver.execute_script(user_id_script)
                except:
                    pass
            
            # Stap 2: Annuleer request via API (SNELSTE METHODE)
            if user_id:
                try:
                    cancel_script = f"""
                    return fetch('https://www.instagram.com/web/friendships/{user_id}/unfollow/', {{
                        method: 'POST',
                        headers: {{
                            'content-type': 'application/x-www-form-urlencoded',
                            'x-csrftoken': document.cookie.match(/csrftoken=([^;]+)/)?.[1] || '',
                            'x-ig-app-id': '936619743392459',
                            'x-requested-with': 'XMLHttpRequest',
                        }},
                        credentials: 'include',
                        body: ''
                    }})
                    .then(r => r.status)
                    .catch(() => 0);
                    """
                    status = self.driver.execute_async_script(f"""
                        var callback = arguments[arguments.length - 1];
                        {cancel_script.replace('return fetch', 'fetch').replace('|| 0', '|| 0')}
                        .then(status => callback(status))
                        .catch(() => callback(0));
                    """)
                    
                    # 200/204 = success, 400 = al geannuleerd (ook OK)
                    if status in [200, 204, 400]:
                        return True
                except:
                    pass
            
            # FALLBACK: Oude methode (langzamer maar betrouwbaar)
            # Ga naar het profiel
            profile_url = f"https://www.instagram.com/{target_username}/"
            if self.driver.current_url != profile_url:
                print(f"[ACTIE] Navigeer naar profiel: {target_username}")
                self.driver.get(profile_url)
                print(f"[OK] Profiel geladen: {target_username}")
            time.sleep(1.0)  # Wacht zodat pagina zichtbaar is
            
            # BELANGRIJK: EERST checken op "Volgen" knop - als die er is, direct SKIP!
            # Alleen als er GEEN "Volgen" knop is, dan zoeken naar "Aangevraagd" knop
            # Wacht even zodat de pagina volledig geladen is
            print(f"[ACTIE] Wacht tot pagina volledig geladen is...")
            time.sleep(1.0)
            
            # STAP 1: Check EERST op "Volgen" knop - als die er is, direct SKIP
            print(f"[ACTIE] Check eerst op 'Volgen' of 'Follow' knop...")
            try:
                all_buttons_check = self.driver.find_elements(By.TAG_NAME, "button")
                print(f"[DEBUG] Gevonden {len(all_buttons_check)} knoppen op pagina")
                for button in all_buttons_check:
                    try:
                        button_text = button.text.strip()
                        button_text_lower = button_text.lower()
                        # Check voor "Volgen" / "Follow" - betekent GEEN pending request, direct SKIP
                        if any(keyword in button_text_lower for keyword in [
                            'volgen', 'follow'
                        ]):
                            # Check dat het NIET "Niet meer volgen" of "Aangevraagd" is
                            if 'niet meer' not in button_text_lower and 'unfollow' not in button_text_lower:
                                if 'aangevraagd' not in button_text_lower and 'requested' not in button_text_lower:
                                    if button.is_displayed() and button.is_enabled():
                                        print(f"[SKIP] Gevonden 'Volgen' knop - geen pending request voor: {target_username}")
                                        return True  # Direct skip!
                    except:
                        continue
            except:
                pass
            
            # STAP 2: Als er GEEN "Volgen" knop is, zoek naar "Aangevraagd" knop
            print(f"[ACTIE] Geen 'Volgen' knop gevonden, zoek naar 'Aangevraagd' of 'Requested' knop...")
            cancel_button = None
            
            # Methode 1: Zoek door alle buttons en check de tekst (meer uitgebreid)
            print(f"[DEBUG] Zoek door alle knoppen op pagina...")
            try:
                all_buttons = self.driver.find_elements(By.TAG_NAME, "button")
                print(f"[DEBUG] Gevonden {len(all_buttons)} knoppen op pagina")
                found_button_texts = []
                for button in all_buttons:
                    try:
                        button_text = button.text.strip()
                        if button_text:
                            found_button_texts.append(button_text)
                        button_text_lower = button_text.lower()
                        # Check voor "Aangevraagd" / "Requested" - betekent WEL pending request
                        if any(keyword in button_text_lower for keyword in [
                            'requested', 'aangevraagd', 'verzoek verzonden'
                        ]):
                            # Check dat het NIET "Niet meer volgen" is
                            if 'niet meer' not in button_text_lower and 'unfollow' not in button_text_lower:
                                if button.is_displayed() and button.is_enabled():
                                    cancel_button = button
                                    print(f"[OK] Gevonden '{button_text}' knop via button scan voor: {target_username}")
                                    break
                    except Exception as e:
                        continue
                
                # Debug: laat zien welke knoppen gevonden zijn
                if found_button_texts:
                    print(f"[DEBUG] Gevonden knoppen op pagina: {', '.join(found_button_texts[:10])}")  # Eerste 10 knoppen
            except Exception as e:
                print(f"[ERROR] Fout bij zoeken naar knoppen: {e}")
                pass
            
            # Methode 2: Probeer XPath selectors als fallback (meer selectors, langere wachttijd)
            if not cancel_button:
                selectors = [
                    "//button[contains(text(), 'Requested')]",
                    "//button[contains(text(), 'Aangevraagd')]",
                    "//button[contains(text(), 'Verzoek verzonden')]",
                    "//button[contains(text(), 'Cancel Request')]",
                    "//button[contains(text(), 'Verzoek annuleren')]",
                    "//button[contains(., 'Requested')]",
                    "//button[contains(., 'Aangevraagd')]",
                    "//span[contains(text(), 'Requested')]/parent::button",
                    "//span[contains(text(), 'Aangevraagd')]/parent::button",
                    "//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'requested')]",
                    "//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'aangevraagd')]",
                    "//div[contains(@class, 'button')]//span[contains(text(), 'Requested')]/parent::button",
                    "//div[contains(@class, 'button')]//span[contains(text(), 'Aangevraagd')]/parent::button",
                ]
                
                for selector in selectors:
                    try:
                        element = WebDriverWait(self.driver, 3).until(  # Verhoogd naar 3 seconden
                            EC.presence_of_element_located((By.XPATH, selector))
                        )
                        if element.is_displayed() and element.is_enabled():
                            cancel_button = element
                            print(f"[DEBUG] Gevonden via XPath selector voor: {target_username}")
                            break
                    except TimeoutException:
                        continue
                    except:
                        continue
            
            if cancel_button:
                # Debug: laat zien welke knop gevonden is
                try:
                    btn_text_found = cancel_button.text.strip()
                    print(f"[OK] 'Aangevraagd' knop gevonden: '{btn_text_found}' voor: {target_username}")
                except:
                    print(f"[OK] 'Aangevraagd' knop gevonden (tekst niet leesbaar) voor: {target_username}")
                
                # Klik op "Aangevraagd" knop - MET VISUELE ANIMATIES
                print(f"[ACTIE] Klik NU op 'Aangevraagd' knop voor: {target_username}")
                try:
                    btn_text = cancel_button.text.strip()
                    # Gebruik animate_click voor volledige visuele animatie
                    self.animate_click(cancel_button, f"'{btn_text}' knop")
                    time.sleep(1.0)  # Extra wachttijd zodat alles zichtbaar is
                except Exception as e:
                    print(f"[WARNING] Geanimeerde click gefaald, probeer normale click: {e}")
                    try:
                        # Fallback: normale click zonder animatie
                        cancel_button.click()
                        print(f"[OK] Geklikt op '{cancel_button.text.strip()}' knop!")
                        time.sleep(1.0)
                    except Exception as e2:
                        print(f"[ERROR] Klik gefaald: {e2}")
                        print(f"[ERROR] Kan niet klikken op 'Aangevraagd' knop voor: {target_username}")
                        return False
            else:
                print(f"[WARNING] 'Aangevraagd' knop NIET gevonden voor: {target_username}")
                print(f"[SKIP] Ga door naar volgende account...")
                # Stop hier - ga niet door met modal verwerking als knop niet gevonden is
                return True  # Skip account
            
            # Alleen doorgaan met modal verwerking als "Aangevraagd" knop gevonden en geklikt is
            print(f"[ACTIE] Wacht tot modal verschijnt...")
            time.sleep(2.0)  # Langere wachttijd zodat modal zichtbaar is
            
            # Zoek naar bevestigingsmenu - Instagram toont een modal/dialog
            # Probeer ALLE mogelijke Nederlandse en Engelse teksten
            confirm_button = None
            
            # Eerst: zoek door ALLE buttons in de modal (sneller en betrouwbaarder)
            print(f"[ACTIE] Zoek naar modal en bevestigingsknop...")
            try:
                # Wacht tot modal verschijnt - LANGERE wachttijd nodig
                # Check of modal/dialog aanwezig is
                print(f"[ACTIE] Wacht tot modal verschijnt...")
                modal_present = False
                for i in range(5):  # Probeer 5 keer
                    try:
                        dialogs = self.driver.find_elements(By.XPATH, "//div[@role='dialog']")
                        if dialogs:
                            modal_present = True
                            print(f"[OK] Modal gevonden!")
                            break
                    except:
                        pass
                    time.sleep(0.5)  # Langere wachttijd zodat check zichtbaar is
                
                if not modal_present:
                    print(f"[WARNING] Modal niet gevonden, wacht extra...")
                    time.sleep(1.0)  # Extra wachttijd als modal niet gevonden
                
                time.sleep(1.0)  # Extra wachttijd voor modal animatie zodat het zichtbaar is
                
                # Zoek door alle buttons op de pagina - VERBETERDE DETECTIE
                print(f"[ACTIE] Zoek door alle knoppen in modal...")
                all_buttons_modal = self.driver.find_elements(By.TAG_NAME, "button")
                print(f"[DEBUG] Gevonden {len(all_buttons_modal)} knoppen in modal")
                
                # PRIORITEIT 1: EERST zoeken naar "Niet meer volgen" / "Unfollow" knop
                # Dit is de knop die Instagram toont om het verzoek te annuleren
                print(f"[ACTIE] Zoek EERST naar 'Niet meer volgen' of 'Unfollow' knop...")
                for btn in all_buttons_modal:
                    try:
                        btn_text = btn.text.strip()
                        btn_text_lower = btn_text.lower()
                        
                        # Zoek naar "Niet meer volgen" of "Unfollow" knop - HOOGSTE PRIORITEIT
                        if 'niet meer volgen' in btn_text_lower or 'unfollow' in btn_text_lower:
                            if btn.is_displayed() and btn.is_enabled():
                                confirm_button = btn
                                print(f"[OK] Gevonden 'Niet meer volgen' knop in modal: '{btn_text}'")
                                break
                    except:
                        continue
                
                # PRIORITEIT 2: Als "Niet meer volgen" niet gevonden, probeer nogmaals met langere wachttijd
                # Soms heeft de modal tijd nodig om volledig te laden
                if not confirm_button:
                    print(f"[DEBUG] 'Niet meer volgen' niet direct gevonden, wacht langer...")
                    time.sleep(1.0)  # Extra wachttijd
                    
                    # Zoek opnieuw door alle buttons
                    all_buttons_modal_retry = self.driver.find_elements(By.TAG_NAME, "button")
                    for btn in all_buttons_modal_retry:
                        try:
                            btn_text = btn.text.strip()
                            btn_text_lower = btn_text.lower()
                            
                            # Zoek naar "Niet meer volgen" of "Unfollow" knop
                            if 'niet meer volgen' in btn_text_lower or 'unfollow' in btn_text_lower:
                                if btn.is_displayed() and btn.is_enabled():
                                    confirm_button = btn
                                    print(f"[DEBUG] Gevonden 'Niet meer volgen' knop (retry): '{btn_text}'")
                                    break
                        except:
                            continue
                
                # PRIORITEIT 4: Andere bevestigingsknoppen (fallback)
                if not confirm_button:
                    for btn in all_buttons_modal:
                        try:
                            btn_text = btn.text.strip()
                            btn_text_lower = btn_text.lower()
                            
                            # Check voor andere bevestigingsknoppen
                            if any(keyword in btn_text_lower for keyword in [
                                'ontvolgen'
                            ]):
                                if btn.is_displayed() and btn.is_enabled():
                                    confirm_button = btn
                                    print(f"[DEBUG] Gevonden bevestigingsknop (fallback): '{btn_text}'")
                                    break
                        except:
                            continue
            except:
                pass
            
            # Fallback: probeer XPath selectors - EERST "Niet meer volgen" / "Unfollow"
            if not confirm_button:
                confirm_selectors = [
                    # EERST "Niet meer volgen" / "Unfollow" knoppen (HOOGSTE prioriteit)
                    "//button[contains(text(), 'Niet meer volgen')]",
                    "//button[contains(., 'Niet meer volgen')]",
                    "//span[contains(text(), 'Niet meer volgen')]/parent::button",
                    "//div[contains(text(), 'Niet meer volgen')]/ancestor::button",
                    "//button[contains(text(), 'Unfollow')]",
                    "//button[contains(., 'Unfollow')]",
                    "//span[contains(text(), 'Unfollow')]/parent::button",
                    # Dialog/modal selectors voor "Niet meer volgen"
                    "//div[@role='dialog']//button[contains(text(), 'Niet meer volgen')]",
                    "//div[@role='dialog']//button[contains(., 'Niet meer volgen')]",
                    "//div[@role='dialog']//button[contains(text(), 'Unfollow')]",
                    "//div[@role='dialog']//button[contains(., 'Unfollow')]",
                ]
                
                for selector in confirm_selectors:
                    try:
                        btn = WebDriverWait(self.driver, 2.0).until(  # Verhoogd naar 2.0 seconden
                            EC.presence_of_element_located((By.XPATH, selector))
                        )
                        if btn.is_displayed() and btn.is_enabled():
                            btn_text = btn.text.strip().lower()
                            # Zoek naar "Niet meer volgen" of "Unfollow" knop
                            if 'niet meer volgen' in btn_text or 'unfollow' in btn_text:
                                confirm_button = btn
                                print(f"[OK] Gevonden via XPath: '{btn.text.strip()}'")
                                break
                    except TimeoutException:
                        continue
            
            # Als er een bevestigingsmenu is, klik erop (belangrijk!)
            if confirm_button:
                clicked_successfully = False
                try:
                    print(f"[ACTIE] Klik op bevestigingsknop: '{confirm_button.text.strip()}'")
                    
                    # Probeer meerdere klik methoden totdat modal sluit - MET VISUELE ANIMATIES
                    for attempt in range(5):  # Max 5 pogingen
                        try:
                            btn_text_confirm = confirm_button.text.strip()
                            
                            # Methode 1: Geanimeerde click met volledige visuele feedback
                            if attempt == 0:
                                print(f"[ACTIE] Geanimeerde click op '{btn_text_confirm}'...")
                                self.animate_click(confirm_button, f"'{btn_text_confirm}' knop")
                            # Methode 2: JavaScript click met scroll (zichtbaar)
                            elif attempt == 1:
                                print(f"[ACTIE] Scroll naar '{btn_text_confirm}' en klik via JavaScript...")
                                self.driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", confirm_button)
                                time.sleep(0.8)  # Wacht zodat scroll zichtbaar is
                                # Highlight effect
                                self.driver.execute_script("""
                                    arguments[0].style.border = '2px solid #0095f6';
                                    arguments[0].style.boxShadow = '0 0 10px rgba(0, 149, 246, 0.6)';
                                """, confirm_button)
                                time.sleep(0.5)
                                self.driver.execute_script("arguments[0].click();", confirm_button)
                                print(f"[OK] Geklikt via JavaScript")
                            # Methode 3: Force click opnieuw
                            else:
                                print(f"[ACTIE] Force click poging {attempt + 1}...")
                                self.driver.execute_script("arguments[0].click();", confirm_button)
                            
                            time.sleep(1.2)  # Wacht zodat klik en modal sluit zichtbaar zijn
                            
                            # Check of modal weg is
                            try:
                                dialogs = self.driver.find_elements(By.XPATH, "//div[@role='dialog']")
                                if not dialogs:
                                    clicked_successfully = True
                                    print(f"[DEBUG] Modal gesloten na poging {attempt + 1}")
                                    break  # Modal is weg, succes!
                            except:
                                pass
                            
                            # Check ook of de knop zelf weg is (betere indicator)
                            try:
                                if not confirm_button.is_displayed():
                                    clicked_successfully = True
                                    print(f"[DEBUG] Bevestigingsknop weg na poging {attempt + 1}")
                                    break
                            except:
                                pass
                            
                        except Exception as e:
                            if attempt == 4:
                                print(f"[WARNING] Klik fout na 5 pogingen: {e}")
                            continue
                    
                    if not clicked_successfully:
                        print(f"[WARNING] Modal sluit niet automatisch voor: {target_username}")
                        # Laatste poging: probeer ESC toets of klik buiten modal
                        try:
                            self.driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
                            time.sleep(0.5)
                        except:
                            pass
                        
                        time.sleep(1.0)
                except Exception as e:
                    print(f"[WARNING] Klik fout: {e}")
                    time.sleep(1.0)
            else:
                # Geen confirm button gevonden - check of er een "Aangevraagd" knop op de pagina is
                # Als die er is, betekent dit dat er een pending request is en we moeten doorgaan
                has_requested_on_page = False
                try:
                    page_buttons_check = self.driver.find_elements(By.TAG_NAME, "button")
                    for page_btn in page_buttons_check:
                        try:
                            page_btn_text = page_btn.text.strip().lower()
                            if 'aangevraagd' in page_btn_text or 'requested' in page_btn_text:
                                has_requested_on_page = True
                                break
                        except:
                            continue
                except:
                    pass
                
                if has_requested_on_page:
                    # Er is een "Aangevraagd" knop maar geen "Niet meer volgen" in modal
                    # Ga direct door naar alternatieve methode
                    print(f"[WARNING] 'Aangevraagd' knop gevonden maar 'Niet meer volgen' niet in modal voor: {target_username}")
                    print(f"[INFO] Ga direct door naar alternatieve methode...")
                    # Skip de rest en ga direct naar alternatieve methode (zie verderop)
                    # Zet still_pending op True zodat alternatieve methode wordt uitgevoerd
                    still_pending = True
                else:
                    # Geen "Aangevraagd" knop - probeer opnieuw met langere wachttijd
                    print(f"[WARNING] Bevestigingsknop niet gevonden voor: {target_username}")
                    print(f"[RETRY] Wacht langer en probeer opnieuw...")
                    time.sleep(1.0)  # Langere wachttijd
                    
                    # Probeer nogmaals alle buttons te vinden - EERST "Niet meer volgen"
                    all_buttons_retry2 = self.driver.find_elements(By.TAG_NAME, "button")
                    for btn_retry2 in all_buttons_retry2:
                        try:
                            btn_text_retry2 = btn_retry2.text.strip().lower()
                            # EERST zoeken naar "Niet meer volgen" voor pending requests
                            if 'niet meer volgen' in btn_text_retry2 or 'unfollow' in btn_text_retry2:
                                if btn_retry2.is_displayed() and btn_retry2.is_enabled():
                                    print(f"[RETRY] Gevonden na wachttijd: '{btn_retry2.text.strip()}'")
                                    self.driver.execute_script("arguments[0].click();", btn_retry2)
                                    time.sleep(0.8)
                                    confirm_button = btn_retry2  # Markeer als gevonden
                                    break
                        except:
                            continue
                    
                    # Als "Niet meer volgen" niet gevonden wordt, betekent dit dat:
                    # 1. De modal is anders dan verwacht, OF
                    # 2. Het account wordt al gevolgd (geen pending request)
                    # Als er een "Aangevraagd" knop is, moeten we doorgaan naar alternatieve methode
                    if not confirm_button:
                        print(f"[WARNING] 'Niet meer volgen' niet gevonden in modal voor: {target_username}")
                        # Check of er een "Aangevraagd" knop is - als die er is, moeten we doorgaan naar alternatieve methode
                        if cancel_button:
                            print(f"[INFO] 'Aangevraagd' knop gevonden, maar 'Niet meer volgen' niet in modal")
                            print(f"[INFO] Sluit modal en ga door naar alternatieve methode...")
                            # Sluit modal
                            try:
                                self.driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
                                time.sleep(1.0)
                            except:
                                pass
                            # Zet still_pending op True zodat alternatieve methode wordt uitgevoerd
                            still_pending = True
                        else:
                            # Geen "Aangevraagd" knop - account wordt al gevolgd
                            print(f"[SKIP] Geen 'Aangevraagd' knop gevonden, account wordt al gevolgd")
                            time.sleep(0.5)  # Laatste wachttijd
                            still_pending = False  # Geen pending request
            
            # VERIFICEER dat het echt geannuleerd is (belangrijk!)
            # Maar alleen als we een confirm_button hebben geklikt
            try:
                if confirm_button:
                    time.sleep(2.0)  # Verhoogd naar 2.0 seconden - wacht tot pagina bijgewerkt is

                    # Rate-limit detectie: stop netjes als Instagram blokkeert
                    if self.detect_action_blocked():
                        print("[RATE LIMIT] Actie geblokkeerd door Instagram. Session pauzeren.")
                        raise Exception("ActionBlocked")
                    
                    # Refresh pagina om zeker te zijn dat we de laatste staat zien
                    try:
                        self.driver.refresh()
                        time.sleep(1.5)  # Wacht tot pagina geladen is
                    except:
                        pass
                    
                    # Check of de "Requested"/"Aangevraagd" knop nog steeds bestaat
                    try:
                        all_buttons_check = self.driver.find_elements(By.TAG_NAME, "button")
                        still_pending = False
                        
                        for btn_check in all_buttons_check:
                            try:
                                btn_text_check = btn_check.text.strip().lower()
                                if any(keyword in btn_text_check for keyword in [
                                    'requested', 'aangevraagd', 'verzoek verzonden'
                                ]):
                                    still_pending = True
                                    break
                            except:
                                continue
                    except:
                        still_pending = False
                else:
                    # Geen confirm_button geklikt - check of still_pending al is gezet
                    # Als still_pending al True is (bijv. omdat er een "Aangevraagd" knop is maar geen "Niet meer volgen" in modal),
                    # dan moet het script doorgaan naar alternatieve methode
                    if 'still_pending' not in locals() or not still_pending:
                        # Check opnieuw of er een "Aangevraagd" knop op de pagina is
                        try:
                            page_buttons_final = self.driver.find_elements(By.TAG_NAME, "button")
                            has_requested_final = False
                            for page_btn_final in page_buttons_final:
                                try:
                                    page_btn_text_final = page_btn_final.text.strip().lower()
                                    if 'aangevraagd' in page_btn_text_final or 'requested' in page_btn_text_final:
                                        has_requested_final = True
                                        break
                                except:
                                    continue
                            
                            if has_requested_final:
                                # Er is een "Aangevraagd" knop - zet still_pending op True voor alternatieve methode
                                still_pending = True
                                print(f"[INFO] 'Aangevraagd' knop gevonden, zet still_pending op True voor alternatieve methode")
                                # Zorg dat modal gesloten is voordat we naar alternatieve methode gaan
                                try:
                                    self.driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
                                    time.sleep(1.0)
                                except:
                                    pass
                            else:
                                still_pending = False
                        except:
                            still_pending = False
                
                if still_pending:
                    # BELANGRIJK: Als nog steeds pending, probeer ANDERE METHODE
                    # Mogelijk werkt de modal klik niet - probeer direct via profiel
                    print(f"[PROBLEEM] Request nog steeds pending voor: {target_username}")
                    print(f"[ALTERNATIEF] Probeer directe methode zonder modal...")
                    
                    # Navigeer opnieuw naar profiel - ZICHTBAAR
                    print(f"[ACTIE] Navigeer opnieuw naar profiel: {target_username}")
                    profile_url_retry = f"https://www.instagram.com/{target_username}/"
                    self.driver.get(profile_url_retry)
                    print(f"[OK] Profiel geladen")
                    time.sleep(2.0)  # Wacht zodat pagina zichtbaar is
                    
                    # Zoek opnieuw naar "Aangevraagd" knop - ZICHTBAAR
                    print(f"[ACTIE] Zoek opnieuw naar 'Aangevraagd' knop...")
                    all_buttons_direct = self.driver.find_elements(By.TAG_NAME, "button")
                    for btn_direct in all_buttons_direct:
                        try:
                            btn_text_direct = btn_direct.text.strip().lower()
                            if 'aangevraagd' in btn_text_direct or 'requested' in btn_direct.text.strip().lower():
                                print(f"[ACTIE] Gevonden '{btn_direct.text.strip()}' knop - scroll en klik...")
                                # Gebruik animate_click voor volledige visuele animatie
                                try:
                                    self.animate_click(btn_direct, f"'{btn_direct.text.strip()}' knop")
                                    time.sleep(2.0)  # Extra wachttijd voor modal zodat het zichtbaar is
                                except:
                                    # Fallback: normale click
                                    self.driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", btn_direct)
                                    time.sleep(1.0)
                                    btn_direct.click()
                                    print(f"[OK] Geklikt op '{btn_direct.text.strip()}' knop")
                                time.sleep(2.5)  # Langere wachttijd voor modal zodat het zichtbaar is
                                
                                # Zoek opnieuw naar bevestigingsknop - EERST "Niet meer volgen"
                                for retry_attempt in range(3):
                                    all_buttons_confirm_retry = self.driver.find_elements(By.TAG_NAME, "button")
                                    
                                    # EERST zoeken naar "Niet meer volgen" / "Unfollow"
                                    for btn_confirm_retry in all_buttons_confirm_retry:
                                        try:
                                            btn_text_confirm_retry = btn_confirm_retry.text.strip().lower()
                                            if 'niet meer volgen' in btn_text_confirm_retry or 'unfollow' in btn_text_confirm_retry:
                                                print(f"[ACTIE] Gevonden 'Niet meer volgen' knop: '{btn_confirm_retry.text.strip()}' - klikken...")
                                                # Gebruik animate_click voor volledige visuele animatie
                                                try:
                                                    self.animate_click(btn_confirm_retry, f"'{btn_confirm_retry.text.strip()}' knop")
                                                    time.sleep(1.5)  # Extra wachttijd zodat alles zichtbaar is
                                                except:
                                                    # Fallback: normale click
                                                    try:
                                                        btn_confirm_retry.click()
                                                        print(f"[OK] Geklikt op '{btn_confirm_retry.text.strip()}'")
                                                    except:
                                                        self.driver.execute_script("arguments[0].click();", btn_confirm_retry)
                                                        print(f"[OK] Geklikt via JavaScript")
                                                time.sleep(2.0)  # Langere wachttijd zodat actie zichtbaar is
                                                
                                                # Check of modal weg is
                                                dialogs_check = self.driver.find_elements(By.XPATH, "//div[@role='dialog']")
                                                if not dialogs_check:
                                                    print(f"[OK] Modal gesloten via alternatieve methode")
                                                    break
                                        except:
                                            continue
                                    
                                    # Als "Niet meer volgen" niet gevonden wordt in de alternatieve methode,
                                    # betekent dit dat de modal anders is dan verwacht
                                    # Sluit modal en probeer opnieuw
                                    if not any('niet meer volgen' in btn.text.strip().lower() or 'unfollow' in btn.text.strip().lower() 
                                              for btn in all_buttons_confirm_retry if btn.is_displayed()):
                                        print(f"[WARNING] 'Niet meer volgen' niet gevonden in modal via alternatieve methode voor: {target_username}")
                                        print(f"[INFO] Sluit modal en probeer opnieuw...")
                                        # Sluit modal
                                        try:
                                            self.driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
                                            time.sleep(1.0)
                                        except:
                                            pass
                                        # Refresh pagina en probeer opnieuw
                                        try:
                                            self.driver.refresh()
                                            time.sleep(2.0)
                                        except:
                                            pass
                                    
                                    if retry_attempt < 2:
                                        time.sleep(0.5)
                                
                                # Refresh en check opnieuw
                                self.driver.refresh()
                                time.sleep(1.5)
                                break
                        except:
                            continue
                    
                    # Check nogmaals of het geannuleerd is
                    time.sleep(1.0)
                    if self.detect_action_blocked():
                        print("[RATE LIMIT] Actie geblokkeerd door Instagram. Session pauzeren.")
                        raise Exception("ActionBlocked")
                    final_check_buttons = self.driver.find_elements(By.TAG_NAME, "button")
                    still_pending_after_alt = False
                    for btn_final_check in final_check_buttons:
                        try:
                            btn_text_final_check = btn_final_check.text.strip().lower()
                            if any(keyword in btn_text_final_check for keyword in [
                                'requested', 'aangevraagd', 'verzoek verzonden'
                            ]):
                                still_pending_after_alt = True
                                break
                        except:
                            continue
                    
                    if still_pending_after_alt:
                        # Nog steeds pending na alternatieve methode - definitief gefaald
                        print(f"[FAIL] Kan request niet annuleren voor: {target_username} (na alternatieve methode)")
                        return False
                    else:
                        # Succes via alternatieve methode!
                        print(f"[OK] Request geannuleerd voor: {target_username} (via alternatieve methode)")
                        return True
                else:
                    # Succes! Geen "Requested" knop meer gevonden
                    print(f"[OK] Request geannuleerd voor: {target_username}")
                    return True
            except Exception as e:
                # Als verificatie faalt, maar we hebben geklikt, ga door
                print(f"[OK] Request geannuleerd voor: {target_username} (verificatie skip: {e})")
                return True
                
                # Oude verificatie code (uitgecommentarieerd voor snelheid)
                # Alleen actief als er problemen zijn
                """
                try:
                    all_buttons_after = self.driver.find_elements(By.TAG_NAME, "button")
                    for btn in all_buttons_after[:5]:  # Alleen eerste 5 checken (sneller)
                        try:
                            btn_text = btn.text.strip()
                            if any(keyword in btn_text for keyword in [
                                'Requested', 'Aangevraagd', 'Verzoek verzonden'
                            ]):
                                # Nog steeds pending - quick retry
                                self.driver.execute_script("arguments[0].click();", btn)
                                time.sleep(0.8)
                                # Quick confirm
                                for sel in confirm_selectors[:2]:  # Alleen eerste 2
                                    try:
                                        confirm_btn = self.driver.find_element(By.XPATH, sel)
                                        self.driver.execute_script("arguments[0].click();", confirm_btn)
                                        time.sleep(0.5)
                                        break
                                    except:
                                        continue
                                break
                        except:
                            continue
                except:
                    pass
                """
            else:
                # Geen "Aangevraagd" knop gevonden - check nu op andere knoppen om te bepalen of er een pending request is
                print(f"[DEBUG] Geen 'Aangevraagd'/'Requested' knop gevonden voor: {target_username}")
                
                # Check op andere knoppen om te bepalen of er een pending request is
                try:
                    all_buttons_skip = self.driver.find_elements(By.TAG_NAME, "button")
                    found_buttons = []
                    has_follow_button = False
                    has_unfollow_button = False
                    
                    for btn_skip in all_buttons_skip:
                        try:
                            btn_text_skip = btn_skip.text.strip()
                            if btn_text_skip:
                                found_buttons.append(btn_text_skip)
                            btn_text_skip_lower = btn_text_skip.lower()
                            
                            # Check voor "Volgen" / "Follow" - betekent geen pending request
                            if any(keyword in btn_text_skip_lower for keyword in [
                                'volgen', 'follow', 'volgend', 'following'
                            ]):
                                if 'niet meer' not in btn_text_skip_lower and 'unfollow' not in btn_text_skip_lower:
                                    has_follow_button = True
                            
                            # Check voor "Niet meer volgen" / "Unfollow" - betekent account wordt al gevolgd, geen pending request
                            if any(keyword in btn_text_skip_lower for keyword in [
                                'niet meer volgen', 'unfollow', 'ontvolgen'
                            ]):
                                has_unfollow_button = True
                        except:
                            continue
                    
                    # Debug: laat zien welke knoppen gevonden zijn
                    if found_buttons:
                        print(f"[DEBUG] Gevonden knoppen voor {target_username}: {', '.join(found_buttons[:5])}")  # Eerste 5 knoppen
                    
                    # Alleen skippen als er een duidelijke "Volgen" of "Niet meer volgen" knop is
                    # Als er geen "Aangevraagd" knop is EN geen "Volgen"/"Niet meer volgen" knop, 
                    # dan is er mogelijk nog een pending request maar de knop is niet goed gedetecteerd
                    if has_follow_button:
                        print(f"[SKIP] Geen pending request (gevonden 'Volgen' knop) voor: {target_username}")
                        return True
                    elif has_unfollow_button:
                        print(f"[SKIP] Account wordt al gevolgd (gevonden 'Niet meer volgen' knop) voor: {target_username}")
                        return True
                    else:
                        # Geen duidelijke knop gevonden - mogelijk is er nog een pending request
                        # Probeer de pagina tekst te checken
                        print(f"[WARNING] Geen duidelijke knop gevonden voor: {target_username}, check pagina tekst...")
                except:
                    pass
                
                # Check of er nog een pending request is door de pagina tekst te checken
                page_text = self.driver.page_source.lower()
                page_body_text = self.driver.find_element(By.TAG_NAME, "body").text.lower()
                
                # Check voor verschillende talen
                has_pending = any(keyword in page_text or keyword in page_body_text for keyword in [
                    'requested', 'aangevraagd', 'verzoek verzonden'
                ])
                
                if not has_pending:
                    # Geen pending request - skip
                    return True  # Geen actie nodig
                else:
                    # Er is een pending request maar we kunnen de knop niet vinden
                    # Probeer nogmaals met langere wachttijd
                    print(f"[RETRY] Probeer opnieuw voor: {target_username}")
                    time.sleep(2)
                    # Zoek opnieuw door alle buttons
                    all_buttons = self.driver.find_elements(By.TAG_NAME, "button")
                    for button in all_buttons:
                        try:
                            button_text = button.text.strip().lower()
                            if any(keyword in button_text for keyword in [
                                'requested', 'aangevraagd', 'verzoek'
                            ]):
                                self.driver.execute_script("arguments[0].scrollIntoView(true);", button)
                                time.sleep(1)
                                self.driver.execute_script("arguments[0].click();", button)
                                time.sleep(1)
                                print(f"[OK] Request geannuleerd voor: {target_username} (retry)")
                                return True
                        except:
                            continue
                    
                    print(f"[FAIL] Kan 'Requested/Aangevraagd' knop niet vinden voor: {target_username}")
                    return False
                    
        except InvalidSessionIdException:
            print(f"[ERROR] Browser sessie verloren voor {target_username}")
            raise  # Re-raise zodat process_all_requests het kan afhandelen
        except Exception as e:
            print(f"[ERROR] Fout bij annuleren request voor {target_username}: {e}")
            return False
    
    def process_all_requests(self):
        """Verwerk alle pending follow requests"""
        # Lees gebruikersnamen
        try:
            with open(self.usernames_file, 'r', encoding='utf-8') as f:
                usernames = [line.strip() for line in f if line.strip()]
        except FileNotFoundError:
            print(f"[ERROR] Bestand niet gevonden: {self.usernames_file}")
            return
        
        total = len(usernames)
        remaining = total - len(self.completed_usernames)
        
        print(f"\n[INFO] Totaal aantal accounts in bestand: {total}")
        print(f"[INFO] Al verwerkt: {len(self.completed_usernames)}")
        print(f"[INFO] Nog te verwerken: {remaining}")
        print(f"[INFO] Starttijd: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"[INFO] Vertraging tussen acties: {self.delay} seconden (wordt genegeerd - gebruik minimaal 0.3s)")
        print(f"[INFO] ⚡ SNELHEIDSMODUS GEACTIVEERD!")
        print(f"[INFO] ⚡ Geschatte snelheid: ~120-150 accounts/minuut")
        print(f"[INFO] ⚡ Geschatte tijd voor {remaining} accounts: ~{remaining/120:.1f}-{remaining/150:.1f} minuten")
        print(f"[INFO] Progress wordt opgeslagen in: {self.progress_file}\n")
        
        if remaining == 0:
            print("[INFO] Alle accounts zijn al verwerkt!")
            print(f"[INFO] Totaal geannuleerd: {self.cancelled_count}")
            print(f"[INFO] Totaal gefaald: {self.failed_count}")
            return
        
        input("Druk op Enter om te beginnen (zorg dat je ingelogd bent)...")
        
        start_time = time.time()
        processed_count = 0
        
        for index, username in enumerate(usernames, 1):
            # SKIP als al verwerkt
            if username in self.completed_usernames:
                if index % 100 == 0:
                    print(f"[SKIP] {username} (al verwerkt - {index}/{total})")
                continue
            
            processed_count += 1
            # Minder output voor snelheid
            if processed_count % 10 == 0 or processed_count == 1:
                print(f"[{processed_count}/{remaining}] Verwerken: {username} ({index}/{total})")
            
            # Check of sessie nog geldig is
            if not self.is_session_valid():
                print("[WARNING] Browser sessie verloren. Probeer te herstellen...")
                if not self.reconnect_driver():
                    print("[ERROR] Kon browser sessie niet herstellen. Script stopt.")
                    print("[INFO] Voortgang is opgeslagen. Start het script opnieuw om te hervatten.")
                    break
                # Na reconnect moet je opnieuw inloggen
                print("[INFO] Je moet opnieuw inloggen. Script pauzeert...")
                input("Druk op Enter nadat je opnieuw bent ingelogd in de browser...")
            
            try:
                success = self.cancel_follow_request(username)
            except InvalidSessionIdException:
                # Sessie verloren tijdens operatie
                print("[WARNING] Browser sessie verloren tijdens verwerking.")
                if not self.reconnect_driver():
                    print("[ERROR] Kon browser sessie niet herstellen. Script stopt.")
                    print("[INFO] Voortgang is opgeslagen. Start het script opnieuw om te hervatten.")
                    break
                # Na reconnect moet je opnieuw inloggen
                print("[INFO] Je moet opnieuw inloggen. Script pauzeert...")
                input("Druk op Enter nadat je opnieuw bent ingelogd in de browser...")
                # Probeer opnieuw
                try:
                    success = self.cancel_follow_request(username)
                except Exception as retry_e:
                    print(f"[ERROR] Fout bij retry voor {username}: {retry_e}")
                    success = False
            except Exception as e:
                if str(e) == "ActionBlocked":
                    # Lange pauze en nette stop; hervatten kan later
                    pause_s = random.uniform(1800, 3600)  # 30-60 min
                    print(f"[RATE LIMIT] Lange pauze van ~{int(pause_s/60)} min. Script stopt daarna.")
                    try:
                        time.sleep(pause_s)
                    except KeyboardInterrupt:
                        pass
                    break
                else:
                    success = False
            
            # Sla voortgang op (elke account)
            if success:
                self.cancelled_count += 1
                self.save_progress(username, success=True)
                # Alleen output elke 10 accounts
                if processed_count % 10 == 0:
                    elapsed = (time.time() - start_time) / 60
                    rate = processed_count / elapsed if elapsed > 0 else 0
                    print(f"  ✅ {self.cancelled_count} geannuleerd | ~{rate:.1f} accounts/min")
            else:
                self.failed_count += 1
                self.failed_usernames.append(username)
                self.save_progress(username, success=False)
                print(f"[FAIL] {username}")
            
            # Status update elke 50 accounts met meer info
            if processed_count % 50 == 0:
                elapsed = (time.time() - start_time) / 60
                rate = processed_count / elapsed if elapsed > 0 else 0
                remaining_after = remaining - processed_count
                remaining_time = remaining_after / rate if rate > 0 else 0
                print(f"\n[STATUS] {processed_count}/{remaining} verwerkt | ✅ {self.cancelled_count} | ❌ {self.failed_count} | {rate:.1f}/min | ~{remaining_time:.0f}min resterend")
                print(f"[PROGRESS] {len(self.completed_usernames)} accounts opgeslagen in {self.progress_file}\n")
            
            # Veilige jitter tussen accounts
            self.sleep_jitter()
            
            # Korte batchpauze
            if processed_count % self.short_batch == 0 and processed_count < remaining:
                p = random.uniform(*self.short_pause_range)
                print(f"[INFO] Korte pauze van ~{int(p)}s voor veiligheid...")
                time.sleep(p)

            # Lange batchpauze
            if processed_count % self.long_batch == 0 and processed_count < remaining:
                p = random.uniform(*self.long_pause_range)
                print(f"[INFO] Lange pauze van ~{int(p/60)}min voor veiligheid...")
                time.sleep(p)
        
        # Eindstatistieken
        print(f"\n{'='*60}")
        print(f"[KLAAR] Alle requests verwerkt!")
        print(f"  - Totaal accounts: {total}")
        print(f"  - Verwerkt deze sessie: {processed_count}")
        print(f"  - Succesvol geannuleerd (totaal): {self.cancelled_count}")
        print(f"  - Gefaald (totaal): {self.failed_count}")
        print(f"  - Eindtijd: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*60}")
        
        # Sla eindstatistieken op
        try:
            progress_data = {
                'completed': sorted(list(self.completed_usernames)),
                'cancelled_count': self.cancelled_count,
                'failed_count': self.failed_count,
                'failed_usernames': self.failed_usernames,
                'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'total_accounts': total,
                'completed_all': len(self.completed_usernames) == total
            }
            with open(self.progress_file, 'w', encoding='utf-8') as f:
                json.dump(progress_data, f, indent=2, ensure_ascii=False)
            print(f"\n[INFO] Voortgang opgeslagen in: {self.progress_file}")
        except Exception as e:
            print(f"\n[WARNING] Kon eindstatistieken niet opslaan: {e}")
        
        if self.failed_usernames:
            with open('failed_cancellations.txt', 'w', encoding='utf-8') as f:
                f.write('\n'.join(self.failed_usernames))
            print(f"[INFO] Gefaalde gebruikersnamen opgeslagen in: failed_cancellations.txt")
    
    def close(self):
        """Sluit de browser"""
        if self.driver:
            self.driver.quit()


def main():
    print("="*60)
    print("Instagram Pending Follow Requests Annuleren")
    print("="*60)
    
    # Configuratie
    username = input("Instagram gebruikersnaam: ")
    password = input("Instagram wachtwoord: ")
    delay = input("Vertraging tussen acties in seconden (standaard 3): ").strip()
    delay = int(delay) if delay.isdigit() else 3
    
    bot = InstagramCancelRequests(delay=delay)
    
    try:
        bot.setup_driver()
        
        # Vraag gebruiker of ze automatisch of handmatig willen inloggen
        print("\n[INFO] Kies inlogmethode:")
        print("  1. Automatisch inloggen (kan falen)")
        print("  2. Handmatig inloggen (aanbevolen)")
        login_choice = input("Kies 1 of 2 (standaard: 2): ").strip()
        
        if login_choice == "1":
            login_success = bot.login(username, password)
            
            if not login_success:
                print("\n[WARNING] Automatisch inloggen gefaald.")
                print("[INFO] Schakel over naar handmatig inloggen...")
                login_choice = "2"  # Fallback naar handmatig
            else:
                bot.process_all_requests()
                return
        
        if login_choice == "2" or login_choice == "":
            # Handmatig inloggen - open browser en wacht
            print("\n[INFO] Handmatig inloggen...")
            print("[INFO] Browser wordt geopend. Log in op Instagram.")
            print("[INFO] Na het inloggen, kom terug naar deze terminal.")
            
            # Open Instagram login pagina
            try:
                bot.driver.get("https://www.instagram.com/accounts/login/")
                print("[INFO] Instagram login pagina geopend in browser.")
            except Exception as e:
                print(f"[WARNING] Kon niet naar login pagina navigeren: {e}")
                print("[INFO] Open handmatig: https://www.instagram.com/accounts/login/")
            
            # Wacht tot gebruiker inlogt
            input("\n[INFO] Druk op Enter nadat je bent ingelogd in de browser (of 'q' om te stoppen): ").strip().lower()
            
            # Check of login succesvol is
            try:
                current_url = bot.driver.current_url
                if "instagram.com" in current_url and "/accounts/login/" not in current_url:
                    print("[INFO] Login succesvol! Start verwerking...")
                    bot.process_all_requests()
                else:
                    print("[WARNING] Nog op login pagina. Check of je bent ingelogd.")
                    retry = input("Druk op Enter om door te gaan (of 'q' om te stoppen): ").strip().lower()
                    if retry != 'q':
                        bot.process_all_requests()
                    else:
                        print("[INFO] Script gestopt door gebruiker")
            except Exception as e:
                print(f"[ERROR] Kon login status niet checken: {e}")
                print("[INFO] Probeer door te gaan...")
                bot.process_all_requests()
    except KeyboardInterrupt:
        print("\n[INFO] Script gestopt door gebruiker")
    except Exception as e:
        print(f"\n[ERROR] Onverwachte fout: {e}")
    finally:
        bot.close()
        print("\n[INFO] Browser gesloten")


if __name__ == "__main__":
    main()

