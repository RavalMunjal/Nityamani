import os
import glob

def fix_invalidation(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # If it's a mutation onSuccess block, we want to make sure it invalidates 'admin-dashboard-stats'
    # For AdminProductsPage:
    if 'AdminProductsPage.tsx' in filepath:
        content = content.replace("queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })",
                                  "queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })")
        if "queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })" not in content.split('togglePublish')[1]:
            content = content.replace("queryClient.invalidateQueries({ queryKey: ['products-catalog'] })",
                                      "queryClient.invalidateQueries({ queryKey: ['products-catalog'] })\n      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })")
        
    elif 'AdminCategoriesPage.tsx' in filepath:
        if "queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })" not in content:
            content = content.replace("queryClient.invalidateQueries({ queryKey: ['categories-catalog'] })",
                                      "queryClient.invalidateQueries({ queryKey: ['categories-catalog'] })\n      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })")

    elif 'AdminCustomersPage.tsx' in filepath:
        if "queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })" not in content:
            content = content.replace("queryClient.invalidateQueries({ queryKey: ['admin-customers'] })",
                                      "queryClient.invalidateQueries({ queryKey: ['admin-customers'] })\n      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })")
            
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

base_dir = r'C:\Users\kanda\OneDrive\Desktop\Nityamani\NityaMani\src\features\admin'
for f in glob.glob(os.path.join(base_dir, '*.tsx')):
    fix_invalidation(f)
