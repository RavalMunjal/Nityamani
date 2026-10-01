import os

with open(r'C:\Users\kanda\OneDrive\Desktop\Nityamani\NityaMani\supabase_schema.sql', 'r', encoding='utf-8') as f:
    content = f.read()

for p in content.split('CREATE POLICY'):
    if 'products' in p.lower():
        print(p[:200].strip())
