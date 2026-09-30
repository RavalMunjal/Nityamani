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

async function testAuth() {
  console.log('Testing Supabase Auth & DB connection...')
  
  const testEmail = `testuser+${Date.now()}@gmail.com`
  const password = 'password123'
  
  try {
    // 1. Sign up
    console.log(`Attempting to sign up ${testEmail}...`)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: password,
      options: { data: { full_name: 'Test Auto User' } },
    })
    
    if (authError) throw new Error(`Auth Error: ${authError.message}`)
    console.log('✅ Auth sign up successful.')
    
    const userId = authData.user?.id
    if (!userId) throw new Error('No user ID returned.')

    // 2. Create Profile
    console.log('Attempting to create profile...')
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      email: testEmail,
      full_name: 'Test Auto User',
      phone: '9876543210',
      role: 'customer',
      status: 'pending',
    })
    if (profileError) throw new Error(`Profile Error: ${profileError.message}`)
    console.log('✅ Profile inserted successfully.')

    // 3. Create Business Profile
    console.log('Attempting to create business profile...')
    const { error: bizError } = await supabase.from('business_profiles').insert({
      profile_id: userId,
      business_name: 'Test Biz',
      billing_address: '123 Test St',
      city: 'Surat',
      state: 'Gujarat',
      pin_code: '395001',
    })
    if (bizError) throw new Error(`Business Profile Error: ${bizError.message}`)
    console.log('✅ Business profile inserted successfully.')

    // 4. Test Login
    console.log('Attempting to log in...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: password,
    })
    if (loginError) {
      console.log(`ℹ️ Login failed (possibly due to email confirmation required): ${loginError.message}`)
    } else {
      console.log('✅ Login successful.')
    }
    
    console.log('🎉 All backend flow tests completed.')
  } catch (e: any) {
    console.error('❌ Test failed:', e.message)
  }
}

testAuth()
