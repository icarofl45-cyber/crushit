
import os

def fix_encoding(file_path):
    # Mapping of common corrupted patterns to correct Spanish characters
    replacements = {
        'automǭtico': 'automático',
        'Das': 'Días',
        'precisin': 'precisión',
        'transformacin': 'transformación',
        'mǭs': 'más',
        'logrǸ': 'logró',
        'aos': 'años',
        'estǭndar': 'estándar',
        'tecnologa': 'tecnología',
        'fsica': 'física',
        'crea': 'creía',
        'supremaca': 'supremacía',
        'fsico': 'físico',
        'call': 'calló',
        'rǭpidos': 'rápidos',
        'compar': 'comparó',
        'prdida': 'pérdida',
        'impeda': 'impedía',
        'configuracin': 'configuración',
        'metablico': 'metabólico',
        'metablica': 'metabólica',
        'activacin': 'activación',
        'rǭpida': 'rápida',
        'reajuste': 'reajuste',
        'da': 'día',
        'das': 'días',
        'soaba': 'soñaba',
        'energa': 'energía',
        'ǧnico': 'único',
        'mǭximo': 'máximo',
        'mǭxima': 'máxima',
        'solucin': 'solución',
        'Ǹlite': 'élite',
        'Poltica': 'Política',
        'TǸrminos': 'Términos',
        'reproduccin': 'reproducción',
        'autorizacin': 'autorización',
        'MǸtodos': 'Métodos',
        'Garanta': 'Garantía',
        'Ademǭs': 'Además',
        'estǭ': 'está',
        'estǭn': 'están',
        'segǧn': 'según',
        'Ǹ': 'é',
        '': 'í',
        'ǭ': 'á',
        'Ǹ': 'é',
        'ǲ': 'ó',
        'ǳ': 'ú',
        'Ǳ': 'í',
        'ǻ': 'ñ'
    }

    try:
        with open(file_path, 'r', encoding='latin-1') as f:
            content = f.read()
        
        for bad, good in replacements.items():
            content = content.replace(bad, good)
            
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {file_path}")
    except Exception as e:
        print(f"Error fixing {file_path}: {e}")

files = ["index.html", "js/app.js", "css/style.css"]
for f in files:
    if os.path.exists(f):
        fix_encoding(f)
