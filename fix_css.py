
import sys

file_path = r'c:\Users\odiva\Downloads\crush it\css\style.css'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace status-title
old_title = """.status-title {
    font-size: 20px;
    font-weight: 900;
    text-transform: uppercase;
    margin-bottom: 20px;
    line-height: 1.2;
}"""
new_title = """.status-title {
    font-size: 24px;
    font-weight: 900;
    text-transform: uppercase;
    margin-bottom: 24px;
    line-height: 1.1;
    background: linear-gradient(to right, #fff 0%, var(--cta-green) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 10px rgba(0, 255, 102, 0.2));
}"""

# Replace stats-row
old_row = """.stats-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
}"""
new_row = """.stats-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    background: rgba(255, 255, 255, 0.03);
    padding: 15px;
    border-radius: 20px;
}"""

# Replace stat-item/val/lbl
old_stats = """.stat-item { text-align: center; }
.stat-val { font-size: 18px; font-weight: 900; color: var(--text-white); display: block; }
.stat-lbl { font-size: 10px; font-weight: 700; color: #555; text-transform: uppercase; margin-top: 4px; display: block; }"""
new_stats = """.stat-item { text-align: center; flex: 1; }
.stat-val { 
    font-size: 22px; 
    font-weight: 900; 
    color: var(--text-white); 
    display: block;
    text-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
}
.stat-lbl { font-size: 9px; font-weight: 800; color: #777; text-transform: uppercase; margin-top: 6px; display: block; letter-spacing: 0.5px; }"""

# Replace protocol-box remaining
old_protocol = """.protocol-box {
    background: rgba(123, 47, 247, 0.08);
    border-radius: 16px;
    padding: 15px;
    font-size: 12px;
    line-height: 1.4;
    color: var(--text-gray);
}"""
new_protocol = """.protocol-box {
    background: rgba(123, 47, 247, 0.08);
    border: 1px solid rgba(123, 47, 247, 0.2);
    border-radius: 18px;
    padding: 18px;
    font-size: 13px;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 600;
    box-shadow: inset 0 0 20px rgba(123, 47, 247, 0.05);
}"""

content = content.replace(old_title, new_title)
content = content.replace(old_row, new_row)
content = content.replace(old_stats, new_stats)
content = content.replace(old_protocol, new_protocol)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Replacement done successfully")
