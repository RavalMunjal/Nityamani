import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

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

export default function AdminLoginPage() {
  const { refreshProfile } = useAuth()
  const [showAdminPw, setShowAdminPw] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const adminForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const handleAdminLogin = async (data: LoginForm) => {
    setIsSubmitting(true)
    const email = data.email.trim().toLowerCase()
    const password = data.password

    try {
      // 1. Try real Supabase password sign-in (uses sb-admin-auth-token)
      const signInRes = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInRes.error) {
        if (signInRes.error.message.includes('Invalid login')) {
          toast.error('Incorrect admin email or password')
        } else {
          toast.error(signInRes.error.message)
        }
        return
      }

      // 2. Verify role from database securely
      const user = signInRes.data.user
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || !profileData || profileData.role !== 'admin') {
        // Not an admin!
        await supabase.auth.signOut()
        toast.error('This account is not authorized for Admin access.')
        return
      }

      await refreshProfile()
      toast.success('Admin login successful! Entering Admin Panel…')
      
      // Force a full reload to ensure the UI mounts properly
      window.location.href = '/admin'
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Admin login failed'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh bg-surface-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/nityamani-logo-rounded.png" alt="Nityamani" className="h-16 w-auto object-contain mx-auto mb-4 drop-shadow-sm rounded-lg" />
          <h1 className="text-2xl font-extrabold text-brand-blue tracking-tight">System Administration</h1>
          <p className="text-sm text-text-muted font-medium mt-1">Authorized personnel only</p>
        </div>

        <div className="card p-6 shadow-xl animate-slide-up border-t-4 border-t-brand-blue">
          <form onSubmit={adminForm.handleSubmit(handleAdminLogin)} className="space-y-5">
            <div className="bg-brand-blue/5 border border-brand-blue/15 rounded-xl p-4 mb-2">
              <div className="flex items-center gap-2 text-brand-blue font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-brand-red" />
                <span>Secure Admin Portal</span>
              </div>
              <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
                Warning: Access to this portal is restricted and monitored. Unauthorized access attempts are logged.
              </p>
            </div>

            <Field label="Admin Email" error={adminForm.formState.errors.email?.message}>
              <input
                type="email"
                autoComplete="email"
                className={cn('field-input', adminForm.formState.errors.email && 'field-input-error')}
                placeholder="Enter admin email"
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



            <button
              type="submit"
              className="btn-primary w-full btn-lg bg-brand-blue hover:bg-brand-red text-white flex items-center justify-center gap-2 shadow-md mt-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <><span className="nm-spinner" /> Authenticating…</>
              ) : (
                <><ShieldCheck className="w-4 h-4 text-brand-yellow" /> Secure Sign In</>
              )}
            </button>
          </form>
        </div>
        
        <div className="text-center mt-8">
          <a href="/" className="text-sm font-semibold text-text-muted hover:text-brand-blue transition-colors">
            &larr; Return to Public Website
          </a>
        </div>
      </div>
    </div>
  )
}
