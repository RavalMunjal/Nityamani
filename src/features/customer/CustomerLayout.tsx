import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Grid3X3, ShoppingCart, Package, Video, Bell, User, LogOut, Gem, Menu, X, ShieldCheck } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/app', label: 'Home', icon: Home, exact: true },
  { to: '/app/categories', label: 'Categories', icon: Grid3X3 },
  { to: '/app/cart', label: 'Cart', icon: ShoppingCart, hasBadge: true },
  { to: '/app/orders', label: 'Orders', icon: Package },
  { to: '/app/videos', label: 'Videos', icon: Video },
]

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const queryClient = useQueryClient()

  // Real-time notifications subscription via Supabase WebSockets (Replaces Socket.io)
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('customer-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          // Client-side filtering to guarantee it works without requiring cloud replication column filters
          if (payload.new && payload.new.profile_id === user.id) {
            if (payload.new.title) {
              toast.success(payload.new.title, { icon: '🔔', duration: 4000 })
            }
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
            queryClient.invalidateQueries({ queryKey: ['customer-notifications'] })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, queryClient])

  const { data: cartCount = 0 } = useQuery({
    queryKey: ['cart-count', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: cart } = await supabase.from('carts').select('id').eq('customer_id', user!.id).maybeSingle()
      if (!cart) return 0
      const { count } = await supabase.from('cart_items').select('*', { count: 'exact', head: true }).eq('cart_id', cart.id)
      return count ?? 0
    }
  })

  const { data: unreadNotificationsCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', user!.id)
        .eq('is_read', false)
      return count ?? 0
    },
    refetchInterval: 20_000,
  })

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-dvh bg-surface-bg flex flex-col">
      {/* Top nav — desktop */}
      <header className="hidden md:block sticky top-0 z-40 bg-brand-yellow border-b border-brand-yellow safe-top shadow-sm">
        <div className="page-container flex items-center justify-between h-16">
          <NavLink to="/app" className="flex items-center transition-transform hover:scale-105">
            <img src="/nityamani-logo-rounded.png" alt="Nityamani" className="h-10 sm:h-11 w-auto object-contain rounded-lg drop-shadow-sm" />
          </NavLink>

          <nav className="flex items-center gap-1">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.exact}
                className={({ isActive }) => cn(
                  'relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'text-white bg-brand-red'
                    : 'text-brand-blue hover:bg-brand-red/10'
                )}>
                <item.icon className="w-4 h-4" />
                {item.label}
                {item.hasBadge && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {cartCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">


            <NavLink to="/app/notifications" className="btn-icon btn-ghost relative">
              <Bell className="w-5 h-5 text-brand-blue" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm animate-pulse-soft">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </NavLink>
            <NavLink to="/app/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-border transition-colors">
              <div className="w-7 h-7 rounded-full bg-brand-yellow flex items-center justify-center">
                <span className="text-xs font-semibold text-brand-blue">
                  {profile?.full_name?.[0]?.toUpperCase() ?? 'U'}
                </span>
              </div>
              <span className="text-sm text-text-main hidden lg:block">{profile?.full_name}</span>
            </NavLink>
          </div>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-40 bg-brand-yellow border-b border-brand-yellow safe-top shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <NavLink to="/app" className="flex items-center">
            <img src="/nityamani-logo-rounded.png" alt="Nityamani" className="h-8 w-auto object-contain rounded-sm" />
          </NavLink>
          <div className="flex items-center gap-1.5">


            <NavLink to="/app/notifications" className="btn-icon btn-ghost relative">
              <Bell className="w-5 h-5 text-brand-blue" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm animate-pulse-soft">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </NavLink>
            <button className="btn-icon btn-ghost" onClick={() => setMenuOpen(p => !p)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {/* Mobile slide-down menu */}
        {menuOpen && (
          <div className="bg-white border-b border-surface-border px-4 py-3 space-y-1 animate-slide-up">
            <a href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-brand-blue text-white font-semibold hover:bg-brand-red transition-colors"
              onClick={() => setMenuOpen(false)}>
              <ShieldCheck className="w-4 h-4 text-brand-yellow" />
              <span className="text-sm">Admin Dashboard</span>
            </a>
            <NavLink to="/app/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-bg"
              onClick={() => setMenuOpen(false)}>
              <User className="w-4 h-4 text-text-muted" />
              <span className="text-sm text-text-main">Profile — {profile?.full_name}</span>
            </NavLink>
            <button onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 w-full text-left">
              <LogOut className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600">Sign Out</span>
            </button>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-surface-border safe-bottom z-40 shadow-sm">
        <div className="flex items-center justify-around py-2">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.exact}
              className={({ isActive }) => cn(
                'relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg min-w-[48px] transition-colors',
                isActive ? 'text-brand-red' : 'text-text-muted hover:text-brand-blue'
              )}>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.hasBadge && cartCount > 0 && (
                <span className="absolute top-1 right-2 bg-red-600 text-white text-[9px] font-bold px-1 py-0.5 rounded-full leading-none">
                  {cartCount}
                </span>
              )}
            </NavLink>
          ))}
          <NavLink to="/app/profile"
            className={({ isActive }) => cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg min-w-[48px] transition-colors',
              isActive ? 'text-brand-red' : 'text-text-muted hover:text-brand-blue'
            )}>
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Profile</span>
          </NavLink>
        </div>
      </nav>

      <div className="bottom-nav-spacer" />
    </div>
  )
}
