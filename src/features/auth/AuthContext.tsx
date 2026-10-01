import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, type User, type Session } from '@/lib/supabase'
import type { Profile, BusinessProfile } from '@/lib/types'

export type AuthStatus = 
  | 'INITIALIZING'
  | 'AUTHENTICATED_PROFILE_LOADING'
  | 'AUTHENTICATED_READY'
  | 'UNAUTHENTICATED'
  | 'ERROR'

interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: Profile | null
  businessProfile: BusinessProfile | null
  status: AuthStatus
  isAdmin: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  // Expose isLoading for backwards compatibility in App.tsx
  isLoading: boolean 
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [status, setStatus] = useState<AuthStatus>('INITIALIZING')

  const clearState = () => {
    setUser(null)
    setSession(null)
    setProfile(null)
    setBusinessProfile(null)
  }

  const fetchProfile = async (currentSession: Session) => {
    try {
      const currentUser = currentSession.user
      const userId = currentUser.id

      const { data: pData, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (pError && pError.code !== 'PGRST116') {
        throw pError
      }

      let activeProfile = pData

      if (!activeProfile) {
        // If profile doesn't exist, the postgres trigger might have failed or not fired.
        // We ensure we create a fallback profile row exactly matching the auth.uid().
        const newProfile = {
          id: userId,
          email: currentUser.email ?? '',
          full_name: currentUser.user_metadata?.full_name ?? currentUser.email?.split('@')[0] ?? 'User',
          phone: '',
          role: 'customer',
          status: 'active', // Defaulting to active for seamless login
        }
        const { data: insertedProfile, error: insertError } = await supabase.from('profiles').insert(newProfile).select().single()
        if (insertError) throw insertError
        activeProfile = insertedProfile
      }

      // Auto-activate existing pending users so they can immediately test the app
      if (activeProfile && activeProfile.status === 'pending') {
        const { data: activatedProfile } = await supabase
          .from('profiles')
          .update({ status: 'active' })
          .eq('id', userId)
          .select()
          .maybeSingle()
        if (activatedProfile) {
          activeProfile = activatedProfile
        }
      }

      const { data: bData } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('profile_id', userId)
        .maybeSingle()

      if (!bData) {
        await supabase.from('business_profiles').insert({
          profile_id: userId,
          business_name: currentUser.user_metadata?.full_name ?? 'My Business',
          billing_address: 'Pending',
          city: 'Pending',
          state: 'Pending',
          pin_code: '000000',
        })
      }

      setProfile(activeProfile ?? null)
      setBusinessProfile(bData ?? null)
      setStatus('AUTHENTICATED_READY')
    } catch (err) {
      console.error('Failed to hydrate profile:', err)
      setStatus('ERROR')
    }
  }

  const handleSessionChange = async (newSession: Session | null) => {
    if (newSession?.user) {
      // Prevent stale data leakage
      if (user?.id !== newSession.user.id) {
        clearState()
      }
      setSession(newSession)
      setUser(newSession.user)
      setStatus('AUTHENTICATED_PROFILE_LOADING')
      await fetchProfile(newSession)
    } else {
      clearState()
      setStatus('UNAUTHENTICATED')
    }
  }

  const refreshProfile = async () => {
    if (session) await fetchProfile(session)
  }

  useEffect(() => {
    let mounted = true

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      handleSessionChange(session)
    })

    // 2. Listen for auth changes (this handles Google OAuth callback and normal login)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return
      handleSessionChange(newSession)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    setStatus('INITIALIZING')
    await supabase.auth.signOut()
    clearState()
    setStatus('UNAUTHENTICATED')
  }

  const isAdmin = profile?.role === 'admin'
  const isLoading = status === 'INITIALIZING' || status === 'AUTHENTICATED_PROFILE_LOADING'

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile, 
      businessProfile, 
      status, 
      isLoading, 
      isAdmin, 
      signOut, 
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
