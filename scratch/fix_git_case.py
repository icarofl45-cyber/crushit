import os
import subprocess

path = "c:/Users/odiva/Downloads/crush it/imagens_webp_crush_it"
files = os.listdir(path)

for f in files:
    if f.lower() != f:
        # This shouldn't happen if they are already lowercase on disk
        pass

# Since they are already lowercase on disk, but Git might have the old casing:
# We need to find what Git thinks the name is.
try:
    git_files = subprocess.check_output(["git", "ls-files", "imagens_webp_crush_it"], cwd="c:/Users/odiva/Downloads/crush it").decode('utf-8').splitlines()
    for gf in git_files:
        basename = os.path.basename(gf)
        if basename.lower() != basename:
            # Git has a capitalized name.
            old_name = gf
            new_name = gf.lower()
            
            # To fix this in Git on Windows:
            # git mv FileName filename (fails if same)
            # git mv FileName temp && git mv temp filename
            temp_name = gf + ".tmp"
            
            print(f"Fixing Git case: {old_name} -> {new_name}")
            subprocess.run(["git", "mv", old_name, temp_name], cwd="c:/Users/odiva/Downloads/crush it")
            subprocess.run(["git", "mv", temp_name, new_name], cwd="c:/Users/odiva/Downloads/crush it")
except Exception as e:
    print(f"Error: {e}")
