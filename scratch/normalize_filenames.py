import os

path = "c:/Users/odiva/Downloads/crush it/imagens_webp_crush_it"
files = os.listdir(path)

for f in files:
    if f.lower() != f:
        old_path = os.path.join(path, f)
        new_path = os.path.join(path, f.lower())
        # Check if destination exists to avoid overwriting or errors
        if os.path.exists(new_path) and old_path.lower() == new_path.lower():
            # On windows, renaming to same name with different case requires a temp name
            temp_path = os.path.join(path, "temp_" + f)
            os.rename(old_path, temp_path)
            os.rename(temp_path, new_path)
        else:
            os.rename(old_path, new_path)
        print(f"Renamed: {f} -> {f.lower()}")
