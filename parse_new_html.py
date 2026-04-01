import re
import sys

# Lees HTML van stdin of argument
if len(sys.argv) > 1:
    html_file = sys.argv[1]
    with open(html_file, 'r', encoding='utf-8') as f:
        html = f.read()
else:
    # Lees van stdin
    html = sys.stdin.read()

# Extraheer gebruikersnamen uit Instagram links
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

