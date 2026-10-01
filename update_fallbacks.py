import os
import glob

admin_dir = r'C:\Users\kanda\OneDrive\Desktop\Nityamani\NityaMani\src\features\admin'
files = glob.glob(os.path.join(admin_dir, '*.tsx'))

old_str = "'https://images.unsplash.com/photo-1515082161172-2f3b9c8c9735?q=80&w=400&auto=format&fit=crop'"
new_str = "'/nityamani-logo-rounded.png'"

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
        
    if old_str in content:
        content = content.replace(old_str, new_str)
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Updated {os.path.basename(f)}")
