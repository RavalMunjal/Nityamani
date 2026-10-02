import { createClient } from '@supabase/supabase-js'
import { Capacitor } from '@capacitor/core'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '⚠️ Supabase credentials missing. Check your .env file:\n' +
    'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.'
  )
}

const isAdminApp = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')

// ── One-Time Migration: Clean up old shared auth state ─────────────────────
if (typeof window !== 'undefined') {
  try {
    if (window.localStorage.getItem('sb-admin-auth-token') || window.localStorage.getItem('sb-customer-auth-token')) {
      window.localStorage.removeItem('sb-admin-auth-token')
      window.localStorage.removeItem('sb-customer-auth-token')
      console.log('✅ Cleared legacy shared localStorage auth sessions.')
    }
  } catch (err) {
    // ignore
  }
}

const isNative = Capacitor.isNativePlatform()

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: isAdminApp ? 'sb-admin-auth-token' : 'sb-customer-auth-token',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? (isNative ? window.localStorage : window.sessionStorage) : undefined,
  },
})

export type { User, Session } from '@supabase/supabase-js'
