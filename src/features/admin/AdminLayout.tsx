import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, FolderOpen, Users, ClipboardList,
  FileText, CreditCard, Bell, Settings, LogOut, ChevronRight,
  Menu, X, Store, CheckCircle
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/lib/utils'

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { to: '/admin/products', label: 'Products', icon: Package },
      { to: '/admin/categories', label: 'Categories', icon: FolderOpen },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
      { to: '/admin/notifications', label: 'Notifications', icon: Bell },
      { to: '/admin/quotations', label: 'Quotations', icon: FileText },
      { to: '/admin/payments', label: 'Payments', icon: CreditCard },
    ],
  },
  {
    label: 'Customers',
    items: [
      { to: '/admin/customers', label: 'Customers', icon: Users },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
]

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-surface-border">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-surface-border bg-white">
        <div className="flex items-center gap-3">
          <img src="/nityamani-logo-rounded.png" alt="Nityamani" className="h-8 w-auto object-contain rounded drop-shadow-sm" />
          <span className="text-brand-blue font-bold text-[10px] uppercase tracking-widest bg-brand-yellow/20 px-2 py-0.5 rounded shadow-sm border border-brand-yellow/30">Admin</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-text-muted hover:text-brand-blue md:hidden transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Quick toggle to Customer Store */}
      <div className="px-4 pt-5 pb-3">
        <a
          href="/app"
          onClick={onClose}
          className="flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold text-brand-blue bg-surface-bg border border-surface-border hover:border-brand-blue/20 hover:bg-white transition-all shadow-sm group"
        >
          <div className="flex items-center gap-2.5">
            <Store className="w-4 h-4 text-brand-blue group-hover:text-brand-pink transition-colors" />
            <span>View Customer Store</span>
          </div>
          <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-brand-blue transition-colors" />
        </a>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-4 scrollbar-hide">
        {navGroups.map(group => (
          <div key={group.label} className="mb-6">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-3 mb-2">
              {group.label}
            </p>
            <div className="flex flex-col gap-1">
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={(item as any).exact}
                  onClick={onClose}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group',
                    isActive
                      ? 'bg-brand-pink/10 text-brand-pink'
                      : 'text-text-muted hover:text-brand-blue hover:bg-surface-bg'
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                        isActive ? "bg-white shadow-sm text-brand-pink" : "bg-transparent text-text-muted group-hover:text-brand-blue group-hover:bg-white group-hover:shadow-sm"
                      )}>
                        <item.icon className="w-4.5 h-4.5" />
                      </div>
                      <span>{item.label}</span>
                      {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-pink shadow-[0_0_8px_rgba(229,36,107,0.5)]"></span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User info */}
      <div className="border-t border-surface-border p-4 bg-surface-bg/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-9 h-9 rounded-full bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center shadow-sm">
            <span className="text-sm font-bold text-brand-pink">
              {profile?.full_name?.[0]?.toUpperCase() ?? 'A'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-brand-blue truncate">{profile?.full_name ?? 'Admin User'}</p>
            <p className="text-[10px] font-medium text-text-muted truncate flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Verified Admin
            </p>
          </div>
        </div>
        <button onClick={handleSignOut}
          className="flex items-center gap-2.5 text-sm font-semibold text-text-muted hover:text-brand-red transition-colors w-full px-4 py-2.5 rounded-xl border border-transparent hover:border-brand-red/20 hover:bg-brand-red/5">
          <LogOut className="w-4.5 h-4.5" />
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { profile } = useAuth()

  return (
    <div className="flex h-dvh bg-surface-bg font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[260px] flex-shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-brand-blue/40 backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-[280px] bg-white h-full z-10 shadow-2xl">
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-surface-border shadow-[0_4px_24px_rgba(0,0,0,0.02)] h-16 sm:h-[72px] flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-text-muted hover:text-brand-blue rounded-lg hover:bg-surface-bg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="hidden sm:block">
              <h1 className="text-sm font-extrabold text-brand-blue flex items-center gap-2">
                Good morning, {profile?.full_name?.split(' ')[0] || 'Admin'} 👋
              </h1>
              <p className="text-[11px] font-semibold text-text-muted tracking-wide mt-0.5">NITYAMANI WHOLESALE DASHBOARD</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <button className="p-2 text-text-muted hover:text-brand-blue rounded-full hover:bg-surface-bg transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-pink border-2 border-white"></span>
            </button>
            <div className="h-6 w-px bg-surface-border hidden sm:block"></div>
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-brand-blue group-hover:text-brand-pink transition-colors">{profile?.full_name || 'Admin User'}</p>
                <p className="text-[10px] font-semibold text-text-muted">Administrator</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center text-brand-pink font-bold shadow-sm transition-transform group-hover:scale-105">
                {profile?.full_name?.[0]?.toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto w-full scrollbar-hide">
          <div className="min-h-full p-4 sm:p-8 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
