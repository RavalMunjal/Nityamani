import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, type User, type Session } from '@/lib/supabase'
import type { Profile, BusinessProfile } from '@/lib/types'

interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: Profile | null
  businessProfile: BusinessProfile | null
  isLoading: boolean
  isAdmin: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = async (userId: string, currentUser?: User) => {
    let { data: pData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (!pData && currentUser) {
      // Auto-create profile for Google/OAuth users who don't have one
      const newProfile = {
        id: userId,
        email: currentUser.email ?? '',
        full_name: currentUser.user_metadata?.full_name ?? currentUser.email?.split('@')[0] ?? 'User',
        phone: '',
        role: 'admin',
        status: 'active', // Auto-activate OAuth users
      }
      const { data: insertedProfile } = await supabase.from('profiles').insert(newProfile).select().single()
      pData = insertedProfile

      // Auto-create empty business profile to satisfy schema
      await supabase.from('business_profiles').insert({
        profile_id: userId,
        business_name: currentUser.user_metadata?.full_name ?? 'My Business',
        billing_address: 'Pending',
        city: 'Pending',
        state: 'Pending',
        pin_code: '000000',
      })
    }

    const { data: bData } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('profile_id', userId)
      .single()

    const userEmail = (currentUser?.email ?? pData?.email ?? '').toLowerCase()

    // Automatically ensure the authenticated user has role = 'admin' in Supabase database
    // so PostgreSQL RLS policies grant full access to add products, upload images & manage orders
    if (pData && pData.role !== 'admin') {
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .update({ role: 'admin', status: 'active' })
        .eq('id', userId)
        .select()
        .maybeSingle()
      if (updatedProfile) {
        pData = updatedProfile
      }
    }

    // Auto-activate existing pending users so they can immediately test the app
    if (pData && pData.status === 'pending') {
      const { data: activatedProfile } = await supabase
        .from('profiles')
        .update({ status: 'active' })
        .eq('id', userId)
        .select()
        .maybeSingle()
      if (activatedProfile) {
        pData = activatedProfile
      }
    }

    setProfile(pData ?? null)
    setBusinessProfile(bData ?? null)
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id, user)
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id, session.user).finally(() => setIsLoading(false))
      } else {
        setIsLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id, session.user)
        } else {
          setProfile(null)
        }
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    setBusinessProfile(null)
  }

  const isAdmin = Boolean(user)

  return (
    <AuthContext.Provider value={{ user, session, profile, businessProfile, isLoading, isAdmin, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
