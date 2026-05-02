import re
import os

path = "c:/Users/odiva/Downloads/crush it/imagens_webp_crush_it"
files_on_disk = set([f.lower() for f in os.listdir(path)])

with open('index.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

with open('js/app.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

combined_content = html_content + js_content

# Find all occurrences of imagens_webp_crush_it/filename
pattern = r'imagens_webp_crush_it/([\w\.\-]+)'
matches = re.findall(pattern, combined_content)

broken = []
for m in matches:
    if m.lower() not in files_on_disk:
        broken.append(m)

# Also check dynamic parts from JS arrays
js_files_parts = ['5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39', '40-plus']
for p in js_files_parts:
    for suffix in ['', '-w']:
        fname = f"{p}{suffix}.webp"
        if fname.lower() not in files_on_disk:
            broken.append(f"Dynamic: {fname}")

if broken:
    print("Broken images found in code:")
    for b in set(broken):
        print(f"- {b}")
else:
    print("No broken images found in code!")
