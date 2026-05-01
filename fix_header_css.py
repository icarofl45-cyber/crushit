
import sys

file_path = r'c:\Users\odiva\Downloads\crush it\css\style.css'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if line.strip() == "/* LOGO STYLE */":
        skip = True
        new_lines.append(line)
        new_lines.append("""
/* --- HEADER REESCRITO E LIMPO --- */
.main-header {
    width: 100%;
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
    background: var(--bg-color);
    position: relative;
    z-index: 100;
}

.logo-container {
    width: 100%;
    display: flex;
    justify-content: flex-start;
    padding: 10px 20px;
}

.logo-img {
    max-width: 120px;
    filter: drop-shadow(0 0 8px rgba(123, 47, 247, 0.3));
}

.nav-controls {
    display: flex;
    align-items: center;
    padding: 0 20px;
    margin-bottom: 10px;
    min-height: 30px;
}

.btn-back-global {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: #888;
    padding: 6px 12px;
    border-radius: 50px;
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
}

.top-nav {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* MODO LIMPO - ATIVADO APÓS O NOME */
.main-header.clean-header .logo-container {
    justify-content: center;
    padding: 20px 0;
}

.main-header.clean-header .logo-img {
    max-width: 160px;
    filter: drop-shadow(0 0 12px rgba(123, 47, 247, 0.4));
}

.main-header.clean-header .nav-controls,
.main-header.clean-header .top-nav {
    display: none !important;
}
""")
        continue
    
    if skip and line.strip() == ".progress-container {":
        skip = False
        
    if not skip:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("CSS header rewritten successfully")
