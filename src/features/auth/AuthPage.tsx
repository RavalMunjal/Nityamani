import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, Gem, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

// ── Schemas ────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const registerSchema = z.object({
  full_name: z.string().min(2, 'Full name required'),
  business_name: z.string().min(2, 'Business name required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit Indian mobile number required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
  billing_address: z.string().min(5, 'Billing address required'),
  city: z.string().min(2, 'City required'),
  state: z.string().min(2, 'State required'),
  pin_code: z.string().regex(/^\d{6}$/, 'Valid 6-digit PIN code required'),
}).refine(d => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

const forgotSchema = z.object({
  email: z.string().email('Valid email required'),
})

type LoginForm = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>
type ForgotForm = z.infer<typeof forgotSchema>
type Mode = 'login' | 'register' | 'admin' | 'forgot'

// ── FieldInput helper ───────────────────────────────────────────────────────
function Field({ label, error, hint, children }: {
  label: string; error?: string; hint?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
      {error && <p className="field-error">{error}</p>}
      {hint && !error && <p className="field-hint">{hint}</p>}
    </div>
  )
}

// ── Main Auth Page ──────────────────────────────────────────────────────────
export default function AuthPage() {
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [showPw, setShowPw] = useState(false)
  const [showAdminPw, setShowAdminPw] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Login
  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  // Admin Login
  const adminForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@nityamani.com',
      password: '',
    },
  })

  // Register
  const regForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  // Forgot
  const forgotForm = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema) })

  const handleLogin = async (data: LoginForm) => {
    setIsSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    setIsSubmitting(false)
    if (error) {
      if (error.message.includes('Invalid login')) {
        toast.error('Incorrect email or password')
      } else {
        toast.error(error.message)
      }
    }
    // Redirect happens via AuthProvider / router
  }

  const handleAdminLogin = async (data: LoginForm) => {
    setIsSubmitting(true)
    const email = data.email.trim().toLowerCase()
    const password = data.password

    try {
      // 1. Try real Supabase password sign-in
      const signInRes = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      let activeUser = signInRes.data?.user
      let authError = signInRes.error

      // 2. If it's the default admin or not registered yet, try auto-provision via signUp
      if (authError && (authError.message.includes('Invalid login') || authError.message.includes('schema') || authError.message.includes('not found'))) {
        const signUpRes = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: 'Nityamani Admin',
              role: 'admin',
            },
          },
        })

        if (!signUpRes.error && signUpRes.data.user) {
          activeUser = signUpRes.data.user
          authError = null
        }
      }

      if (authError) {
        if (authError.message.includes('Invalid login')) {
          toast.error('Incorrect admin email or password')
        } else {
          toast.error(authError.message)
        }
        return
      }

      // 3. Guarantee role in profiles is 'admin'
      if (activeUser?.id) {
        await supabase.from('profiles').upsert({
          id: activeUser.id,
          email,
          full_name: activeUser.user_metadata?.full_name ?? 'Nityamani Admin',
          role: 'admin',
          status: 'active',
        })
      }

      await refreshProfile()
      toast.success('Admin login successful! Entering Admin Panel…')
      navigate('/admin')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Admin login failed'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = async (targetPath = '/app') => {
    setIsSubmitting(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${targetPath}`,
      }
    })
    setIsSubmitting(false)
    if (error) {
      toast.error(error.message)
    }
  }

  const handleRegister = async (data: RegisterForm) => {
    setIsSubmitting(true)
    try {
      // 1) Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { full_name: data.full_name } },
      })
      if (authError) throw authError

      const userId = authData.user?.id
      if (!userId) throw new Error('Registration failed — no user ID returned')

      // 2) Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        email: data.email,
        full_name: data.full_name,
        phone: data.phone,
        role: 'customer',
        status: 'pending',
      })
      if (profileError) throw profileError

      // 3) Create business profile
      const { error: bizError } = await supabase.from('business_profiles').insert({
        profile_id: userId,
        business_name: data.business_name,
        billing_address: data.billing_address,
        city: data.city,
        state: data.state,
        pin_code: data.pin_code,
      })
      if (bizError) throw bizError

      toast.success('Registration successful! Please check your email to verify your account.')
      setMode('login')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleForgot = async (data: ForgotForm) => {
    setIsSubmitting(true)
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setIsSubmitting(false)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password reset link sent! Check your email.')
      setMode('login')
    }
  }

  return (
    <div className="min-h-dvh bg-surface-bg flex flex-col">
      {/* Header */}
      <div className="bg-white px-6 pt-16 pb-12 text-center relative overflow-hidden border-b border-surface-border">
        {/* decorative circles */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-brand-yellow/10 blur-3xl pointer-events-none" />
        <div className="relative">
          <img src="/nityamani-logo-rounded.png" alt="Nityamani" className="h-14 sm:h-16 w-auto object-contain mx-auto mb-4 drop-shadow-sm rounded-lg" />
          <p className="text-text-muted text-sm font-medium">Premium Wholesale — Beads · Crystals · Rudraksha</p>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 px-4 py-8 max-w-md mx-auto w-full">
        <div className="card p-6 animate-slide-up">

          {/* Tab switcher — login / register / admin */}
          {mode !== 'forgot' && (
            <div className="flex rounded-xl bg-surface-bg p-1 mb-6 gap-1 border border-surface-border/60">
              {[
                { id: 'login', label: 'Sign In' },
                { id: 'register', label: 'Register' },
                { id: 'admin', label: 'Admin', icon: ShieldCheck },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setMode(tab.id as Mode)}
                  className={cn(
                    'flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5',
                    mode === tab.id
                      ? tab.id === 'admin'
                        ? 'bg-brand-blue text-brand-yellow font-bold shadow-sm'
                        : 'bg-white shadow text-text-main font-semibold'
                      : 'text-text-muted hover:text-text-main'
                  )}
                >
                  {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* ── LOGIN ── */}
          {mode === 'login' && (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <Field label="Email" error={loginForm.formState.errors.email?.message}>
                <input
                  type="email"
                  autoComplete="email"
                  className={cn('field-input', loginForm.formState.errors.email && 'field-input-error')}
                  placeholder="you@business.com"
                  {...loginForm.register('email')}
                />
              </Field>
              <Field label="Password" error={loginForm.formState.errors.password?.message}>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={cn('field-input pr-10', loginForm.formState.errors.password && 'field-input-error')}
                    placeholder="••••••••"
                    {...loginForm.register('password')}
                  />
                  <button type="button" tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light"
                    onClick={() => setShowPw(p => !p)}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
              <button
                type="button"
                className="text-xs text-brand-red hover:underline"
                onClick={() => setMode('forgot')}
              >Forgot password?</button>
              <button type="submit" className="btn-primary w-full btn-lg" disabled={isSubmitting}>
                {isSubmitting ? <><span className="nm-spinner" /> Signing in…</> : 'Sign In'}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-surface-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-text-muted">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleGoogleLogin('/app')}
                className="w-full flex justify-center items-center gap-2 px-4 py-2.5 border border-surface-border rounded-lg text-sm font-medium text-text-main bg-white hover:bg-surface-bg transition-colors shadow-sm"
                disabled={isSubmitting}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
            </form>
          )}

          {/* ── ADMIN LOGIN ── */}
          {mode === 'admin' && (
            <form onSubmit={adminForm.handleSubmit(handleAdminLogin)} className="space-y-4">
              <div className="bg-brand-blue/5 border border-brand-blue/15 rounded-xl p-3 mb-1">
                <div className="flex items-center gap-2 text-brand-blue font-semibold text-sm">
                  <ShieldCheck className="w-4 h-4 text-brand-red" />
                  <span>Admin Access Portal</span>
                </div>
                <p className="text-xs text-text-muted mt-1">
                  Enter your admin credentials to manage products, categories, orders & broadcast notifications.
                </p>
              </div>

              <Field label="Admin Email" error={adminForm.formState.errors.email?.message}>
                <input
                  type="email"
                  autoComplete="email"
                  className={cn('field-input', adminForm.formState.errors.email && 'field-input-error')}
                  placeholder="admin@nityamani.com"
                  {...adminForm.register('email')}
                />
              </Field>

              <Field label="Admin Password" error={adminForm.formState.errors.password?.message}>
                <div className="relative">
                  <input
                    type={showAdminPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={cn('field-input pr-10', adminForm.formState.errors.password && 'field-input-error')}
                    placeholder="••••••••"
                    {...adminForm.register('password')}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text-main"
                    onClick={() => setShowAdminPw(p => !p)}
                  >
                    {showAdminPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="text-text-muted">Default admin login:</span>
                <button
                  type="button"
                  onClick={() => {
                    adminForm.setValue('email', 'admin@nityamani.com')
                    adminForm.setValue('password', 'admin123')
                  }}
                  className="text-brand-red font-semibold hover:underline"
                >
                  Auto-fill Demo (admin123)
                </button>
              </div>

              <button
                type="submit"
                className="btn-primary w-full btn-lg bg-brand-blue hover:bg-brand-red text-white flex items-center justify-center gap-2 shadow-md"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><span className="nm-spinner" /> Signing in to Admin…</>
                ) : (
                  <><ShieldCheck className="w-4 h-4 text-brand-yellow" /> Enter Admin Panel</>
                )}
              </button>
            </form>
          )}

          {/* ── REGISTER ── */}
          {mode === 'register' && (
            <form onSubmit={regForm.handleSubmit(handleRegister)} className="space-y-4">
              <p className="text-xs text-text-muted bg-surface-bg rounded-lg px-3 py-2">
                📋 Your account will be reviewed before wholesale access is granted.
              </p>

              <div className="grid grid-cols-1 gap-4">
                <Field label="Owner Full Name *" error={regForm.formState.errors.full_name?.message}>
                  <input className={cn('field-input', regForm.formState.errors.full_name && 'field-input-error')}
                    placeholder="Ravi Kumar" {...regForm.register('full_name')} />
                </Field>
                <Field label="Business Name *" error={regForm.formState.errors.business_name?.message}>
                  <input className={cn('field-input', regForm.formState.errors.business_name && 'field-input-error')}
                    placeholder="Kumar Traders" {...regForm.register('business_name')} />
                </Field>
                <Field label="Mobile Number *" error={regForm.formState.errors.phone?.message}
                  hint="Unverified — used for contact only">
                  <input type="tel" className={cn('field-input', regForm.formState.errors.phone && 'field-input-error')}
                    placeholder="9876543210" maxLength={10} {...regForm.register('phone')} />
                </Field>
                <Field label="Email *" error={regForm.formState.errors.email?.message}>
                  <input type="email" className={cn('field-input', regForm.formState.errors.email && 'field-input-error')}
                    placeholder="owner@business.com" {...regForm.register('email')} />
                </Field>
                <Field label="Password *" error={regForm.formState.errors.password?.message}>
                  <input type="password" className={cn('field-input', regForm.formState.errors.password && 'field-input-error')}
                    placeholder="Min. 8 characters" {...regForm.register('password')} />
                </Field>
                <Field label="Confirm Password *" error={regForm.formState.errors.confirm_password?.message}>
                  <input type="password" className={cn('field-input', regForm.formState.errors.confirm_password && 'field-input-error')}
                    placeholder="Repeat password" {...regForm.register('confirm_password')} />
                </Field>
              </div>

              <div className="divider-brand-yellow" />
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Business Address</p>

              <div className="grid grid-cols-1 gap-4">
                <Field label="Office / Billing Address *" error={regForm.formState.errors.billing_address?.message}>
                  <input className={cn('field-input', regForm.formState.errors.billing_address && 'field-input-error')}
                    placeholder="Shop No., Street, Area" {...regForm.register('billing_address')} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City *" error={regForm.formState.errors.city?.message}>
                    <input className={cn('field-input', regForm.formState.errors.city && 'field-input-error')}
                      placeholder="Surat" {...regForm.register('city')} />
                  </Field>
                  <Field label="PIN Code *" error={regForm.formState.errors.pin_code?.message}>
                    <input type="tel" maxLength={6} className={cn('field-input', regForm.formState.errors.pin_code && 'field-input-error')}
                      placeholder="395001" {...regForm.register('pin_code')} />
                  </Field>
                </div>
                <Field label="State *" error={regForm.formState.errors.state?.message}>
                  <input className={cn('field-input', regForm.formState.errors.state && 'field-input-error')}
                    placeholder="Gujarat" {...regForm.register('state')} />
                </Field>
              </div>

              <button type="submit" className="btn-primary w-full btn-lg" disabled={isSubmitting}>
                {isSubmitting ? <><span className="nm-spinner" /> Registering…</> : 'Create Account'}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-surface-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-text-muted">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleGoogleLogin('/admin')}
                className="w-full flex justify-center items-center gap-2 px-4 py-2.5 border border-surface-border rounded-lg text-sm font-medium text-text-main bg-white hover:bg-surface-bg transition-colors shadow-sm"
                disabled={isSubmitting}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
            </form>
          )}

          {/* ── FORGOT ── */}
          {mode === 'forgot' && (
            <form onSubmit={forgotForm.handleSubmit(handleForgot)} className="space-y-4">
              <div>
                <button type="button" onClick={() => setMode('login')}
                  className="text-xs text-brand-red hover:underline mb-4 flex items-center gap-1">
                  ← Back to Sign In
                </button>
                <h2 className="text-xl font-display font-semibold mb-1">Reset Password</h2>
                <p className="text-sm text-text-muted">We'll send a reset link to your email.</p>
              </div>
              <Field label="Email" error={forgotForm.formState.errors.email?.message}>
                <input type="email" className={cn('field-input', forgotForm.formState.errors.email && 'field-input-error')}
                  placeholder="you@business.com" {...forgotForm.register('email')} />
              </Field>
              <button type="submit" className="btn-primary w-full btn-lg" disabled={isSubmitting}>
                {isSubmitting ? <><span className="nm-spinner" /> Sending…</> : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
