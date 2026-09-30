import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.resolve('.env')
const envContent = fs.readFileSync(envPath, 'utf8')
const env: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=')
  if (key && val.length) env[key.trim()] = val.join('=').trim()
})

const supabaseUrl = env['VITE_SUPABASE_URL']
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY']
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verify() {
  console.log('--- NITYAMANI END-TO-END SYSTEM VERIFICATION ---')
  console.log('Connecting to Supabase:', supabaseUrl)

  // 1. Verify categories exist
  console.log('\n1. Checking Categories table...')
  const { data: categories, error: catErr } = await supabase
    .from('categories')
    .select('id, name, slug, is_active')
  console.log('Categories count:', categories?.length, catErr?.message || 'OK')

  // 2. Verify products table
  console.log('\n2. Checking Products table...')
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('id, name, sku, price_paise, available, is_published, description')
    .limit(5)
  console.log('Products sample count:', products?.length, prodErr?.message || 'OK')
  if (products && products.length > 0) {
    console.log('First product:', products[0].name, 'Price:', products[0].price_paise / 100, 'INR')
  }

  // 3. Verify notifications table structure
  console.log('\n3. Checking Notifications table...')
  const { data: notifs, error: notifErr } = await supabase
    .from('notifications')
    .select('*')
    .limit(3)
  console.log('Notifications query result:', notifs?.length, notifErr?.message || 'OK')

  // 4. Verify orders table
  console.log('\n4. Checking Orders table...')
  const { data: orders, error: orderErr } = await supabase
    .from('orders')
    .select('id, fulfilment_status, customer_id')
    .limit(3)
  console.log('Orders query result:', orders?.length, orderErr?.message || 'OK')

  // 5. Verify storage public access
  console.log('\n5. Checking product-images bucket public URL access...')
  const { data: urlData } = supabase.storage.from('product-images').getPublicUrl('test-image.jpg')
  console.log('Storage Public URL generated:', urlData.publicUrl)

  console.log('\n--- VERIFICATION COMPLETED ---')
}

verify().catch(e => console.error('Verification error:', e))
