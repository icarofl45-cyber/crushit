import os

path = "c:/Users/odiva/Downloads/crush it/imagens_webp_crush_it"
files = [f for f in os.listdir(path) if os.path.isfile(os.path.join(path, f))]

with open('index.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

with open('js/app.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

combined_content = html_content + js_content

unused = []
used = []

for f in files:
    if f in combined_content:
        used.append(f)
    else:
        unused.append(f)

print(f"Total files: {len(files)}")
print(f"Used files: {len(used)}")
print(f"Unused files: {len(unused)}")
if unused:
    print("Unused files list:")
    for u in unused:
        print(f"- {u}")
