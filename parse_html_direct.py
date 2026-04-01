import re
import sys

# Lees HTML van bestand of stdin
if len(sys.argv) > 1:
    with open(sys.argv[1], 'r', encoding='utf-8') as f:
        html = f.read()
else:
    # Probeer temp bestand
    try:
        with open('temp_new.html', 'r', encoding='utf-8') as f:
            html = f.read()
    except:
        print("Geef HTML bestand als argument of plaats HTML in temp_new.html")
        sys.exit(1)

# Extraheer gebruikersnamen
usernames = re.findall(r'instagram\.com/([^"\'/\s<>]+)', html)
usernames = [u for u in usernames if not u.startswith('http') and u != 'files' and not u.startswith('www')]

# Verwijder duplicaten en sorteer
unique_usernames = sorted(set(usernames))

# Schrijf naar bestand
output_file = 'pending_usernames.txt'
with open(output_file, 'w', encoding='utf-8') as f:
    f.write('\n'.join(unique_usernames))

print(f"Gevonden: {len(unique_usernames)} unieke gebruikersnamen")
print(f"Opgeslagen in: {output_file}")
if len(unique_usernames) > 0:
    print(f"Eerste 5: {unique_usernames[:5]}")

