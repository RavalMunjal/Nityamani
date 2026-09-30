import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, FolderOpen, Users, ClipboardList,
  FileText, CreditCard, Receipt, Truck, Bell, Settings,
  LogOut, Gem, ChevronRight, Menu, X, Store
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
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-text-main">
        <div className="flex items-center gap-2.5">
          <img src="/nm-icon.svg" alt="Nityamani" className="h-8 w-auto object-contain" />
          <div>
            <p className="font-display font-semibold text-white text-sm">Nityamani</p>
            <p className="text-text-light text-[10px]">Admin Panel</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-text-light hover:text-white md:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Quick toggle to Customer Store */}
      <div className="px-3 pt-3">
        <NavLink
          to="/app"
          onClick={onClose}
          className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-brand-yellow bg-brand-yellow/10 border border-brand-yellow/30 hover:bg-brand-yellow/20 transition-all shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-brand-yellow" />
            <span>View Customer Store</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-brand-yellow/70" />
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navGroups.map(group => (
          <div key={group.label} className="mb-5">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest px-3 mb-1.5">
              {group.label}
            </p>
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={(item as any).exact}
                onClick={onClose}
                className={({ isActive }) => cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all mb-0.5',
                  isActive
                    ? 'bg-brand-red/20 text-brand-pink border border-brand-red/20'
                    : 'text-text-light hover:text-white hover:bg-text-main'
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User info */}
      <div className="border-t border-text-main p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-brand-red/30 flex items-center justify-center">
            <span className="text-xs font-bold text-brand-pink">
              {profile?.full_name?.[0]?.toUpperCase() ?? 'A'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile?.full_name ?? 'Admin'}</p>
            <p className="text-[10px] text-text-light truncate">{profile?.email}</p>
          </div>
        </div>
        <button onClick={handleSignOut}
          className="flex items-center gap-2 text-sm text-text-light hover:text-red-400 transition-colors w-full px-2 py-1.5 rounded-lg hover:bg-red-500/10">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-dvh bg-text-main overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-text-main border-r border-text-main flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-text-main/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-text-main border-r border-text-main h-full z-10">
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-brand-yellow border-b border-brand-yellow safe-top shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="text-brand-blue hover:text-brand-red">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/nm-icon.svg" alt="Nityamani" className="h-6 w-auto object-contain" />
            <span className="text-sm font-semibold text-brand-blue font-display">Admin</span>
          </div>
          <NavLink to="/app" className="text-xs font-bold text-brand-blue bg-white/90 px-2.5 py-1 rounded-md border border-brand-blue/20 hover:bg-white flex items-center gap-1 shadow-sm">
            <Store className="w-3.5 h-3.5" />
            <span>Store</span>
          </NavLink>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-surface-bg">
          {children}
        </main>
      </div>
    </div>
  )
}
