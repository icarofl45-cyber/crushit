import re

file_path = "c:/Users/odiva/Downloads/crush it/index.html"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the specific Portuguese text
content = content.replace("Os objetivos do seu programa também incluem:", "Los objetivos de tu programa también incluyen:")
content = content.replace("Reduzir o estresse", "Reducir el estrés")
content = content.replace("Sinta-se mais saudável", "Sentirte más saludable")
content = content.replace("Forme um hábito físico", "Formar un hábito físico")
content = content.replace("Melhore o sono", "Mejorar el sueño")

# Replace the inline script at the end of the file
# Use non-greedy match to grab the inline script that starts with // JS LOGIC FOR FOCUS AREAS
pattern = re.compile(r"<script>\s*// JS LOGIC FOR FOCUS AREAS.*?</script>", re.DOTALL)
content = pattern.sub("<script src=\"js/app.js\"></script>", content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Refactoring complete.")
