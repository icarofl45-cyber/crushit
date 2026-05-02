import re

def lowercase_paths(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # regex to find imagens_webp_crush_it/ filename
    pattern = r'imagens_webp_crush_it/[\w\.\-]+'
    
    def to_lower(match):
        return match.group(0).lower()
    
    new_content = re.sub(pattern, to_lower, content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Processed: {filepath}")

lowercase_paths('index.html')
lowercase_paths('js/app.js')
