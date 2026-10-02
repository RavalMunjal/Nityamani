import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/features/auth/AuthContext'
import LandingPage from '@/features/landing/LandingPage'
import AuthPage from '@/features/auth/AuthPage'
import CustomerLayout from '@/features/customer/CustomerLayout'
import HomePage from '@/features/customer/HomePage'
import ProductDetailPage from '@/features/customer/ProductDetailPage'
import CartPage from '@/features/customer/CartPage'
import CheckoutPage from '@/features/customer/CheckoutPage'
import OrdersPage from '@/features/customer/OrdersPage'
import OrderDetailPage from '@/features/customer/OrderDetailPage'
import AdminLayout from '@/features/admin/AdminLayout'
import AdminLoginPage from '@/features/admin/AdminLoginPage'
import AdminDashboard from '@/features/admin/AdminDashboard'
import AdminProductsPage from '@/features/admin/AdminProductsPage'
import AdminCustomersPage from '@/features/admin/AdminCustomersPage'
import AdminOrdersPage from '@/features/admin/AdminOrdersPage'
import AdminCategoriesPage from '@/features/admin/AdminCategoriesPage'
import AdminQuotationsPage from '@/features/admin/AdminQuotationsPage'
import AdminPaymentsPage from '@/features/admin/AdminPaymentsPage'
import AdminNotificationsPage from '@/features/admin/AdminNotificationsPage'
import AdminSettingsPage from '@/features/admin/AdminSettingsPage'
import CustomerProductsPage from '@/features/customer/ProductsPage'
import CustomerCategoriesPage from '@/features/customer/CategoriesPage'
import CustomerProfilePage from '@/features/customer/ProfilePage'
import CustomerVideosPage from '@/features/customer/VideosPage'
import CustomerNotificationsPage from '@/features/customer/NotificationsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

import { type ReactNode } from 'react'

// ── Route guards ───────────────────────────────────────────────────────────
function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading, profile, status } = useAuth()
  if (isLoading || status === 'AUTHENTICATED_PROFILE_LOADING') return <LoadingScreen />
  if (!user) return <Navigate to="/auth" replace />
  if (!profile) return <Navigate to="/auth" replace /> // safety net
  if (profile.status === 'blocked') return <BlockedScreen />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isLoading, isAdmin, status } = useAuth()
  if (isLoading || status === 'AUTHENTICATED_PROFILE_LOADING') return <LoadingScreen />
  if (!user) return <Navigate to="/admin/login" replace />
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-brand-red mb-2">Access Denied</h1>
        <p className="text-text-muted mb-4">This account is not authorized for Admin access.</p>
        <button className="btn-primary" onClick={() => window.location.href = '/'}>Return Home</button>
      </div>
    )
  }
  return <>{children}</>
}

function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { user, isLoading, status, isAdmin } = useAuth()
  if (isLoading || status === 'AUTHENTICATED_PROFILE_LOADING') return <LoadingScreen />
  if (user) {
    if (isAdmin) return <Navigate to="/admin" replace />
    return <Navigate to="/app" replace />
  }
  return <>{children}</>
}

function RedirectIfAuthedAdmin({ children }: { children: ReactNode }) {
  const { user, isLoading, isAdmin, status } = useAuth()
  if (isLoading || status === 'AUTHENTICATED_PROFILE_LOADING') return <LoadingScreen />
  if (user) {
    if (isAdmin) return <Navigate to="/admin" replace />
    // If a non-admin tries to log in via admin login, deny them!
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-brand-red mb-2">Access Denied</h1>
        <p className="text-text-muted mb-4">This account is not authorized for Admin access.</p>
        <p className="text-sm text-text-light mb-8">Please use the customer login.</p>
        <button className="btn-primary" onClick={() => window.location.href = '/auth'}>Go to Customer Login</button>
      </div>
    )
  }
  return <>{children}</>
}

// ── Placeholder pages ──────────────────────────────────────────────────────
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="text-5xl mb-4">🚧</div>
      <h2 className="text-xl font-display font-semibold text-white mb-2">{title}</h2>
      <p className="text-text-light text-sm">This section is coming soon.</p>
    </div>
  )
}

// ── Loading / status screens ───────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-surface-bg gap-4">
      <img src="/nityamani-logo-rounded.png" alt="Nityamani" className="w-56 h-auto object-contain animate-pulse-soft rounded-lg drop-shadow-lg" />
      <div className="nm-spinner scale-125" />
    </div>
  )
}

function BlockedScreen() {
  const { signOut } = useAuth()
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-surface-bg text-center px-6">
      <div className="text-5xl mb-4">🔒</div>
      <h2 className="text-xl font-semibold text-text-main mb-2">Account Blocked</h2>
      <p className="text-text-muted text-sm mb-6">
        Your account has been blocked. Please contact Nityamani support for assistance.
      </p>
      <button onClick={signOut} className="btn-outline">Sign Out</button>
    </div>
  )
}

// ── App Router ─────────────────────────────────────────────────────────────
function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={
        <RedirectIfAuthed><AuthPage /></RedirectIfAuthed>
      } />

      {/* Customer app */}
      <Route path="/app" element={
        <RequireAuth>
          <CustomerLayout>
            <HomePage />
          </CustomerLayout>
        </RequireAuth>
      } />
      <Route path="/app/product/:id" element={
        <RequireAuth>
          <CustomerLayout>
            <ProductDetailPage />
          </CustomerLayout>
        </RequireAuth>
      } />
      <Route path="/app/cart" element={
        <RequireAuth>
          <CustomerLayout>
            <CartPage />
          </CustomerLayout>
        </RequireAuth>
      } />
      <Route path="/app/checkout" element={
        <RequireAuth>
          <CustomerLayout>
            <CheckoutPage />
          </CustomerLayout>
        </RequireAuth>
      } />
      <Route path="/app/orders" element={
        <RequireAuth>
          <CustomerLayout>
            <OrdersPage />
          </CustomerLayout>
        </RequireAuth>
      } />
      <Route path="/app/orders/:id" element={
        <RequireAuth>
          <CustomerLayout>
            <OrderDetailPage />
          </CustomerLayout>
        </RequireAuth>
      } />
      <Route path="/app/categories" element={
        <RequireAuth>
          <CustomerLayout>
            <CustomerCategoriesPage />
          </CustomerLayout>
        </RequireAuth>
      } />
      <Route path="/app/videos" element={
        <RequireAuth>
          <CustomerLayout>
            <CustomerVideosPage />
          </CustomerLayout>
        </RequireAuth>
      } />
      <Route path="/app/notifications" element={
        <RequireAuth>
          <CustomerLayout>
            <CustomerNotificationsPage />
          </CustomerLayout>
        </RequireAuth>
      } />
      <Route path="/app/profile" element={
        <RequireAuth>
          <CustomerLayout>
            <CustomerProfilePage />
          </CustomerLayout>
        </RequireAuth>
      } />
      <Route path="/app/products" element={
        <RequireAuth>
          <CustomerLayout>
            <CustomerProductsPage />
          </CustomerLayout>
        </RequireAuth>
      } />

      {/* Admin panel */}
      <Route path="/admin/login" element={
        <RedirectIfAuthedAdmin>
          <AdminLoginPage />
        </RedirectIfAuthedAdmin>
      } />
      <Route path="/admin" element={
        <RequireAdmin>
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        </RequireAdmin>
      } />
      <Route path="/admin/products" element={
        <RequireAdmin>
          <AdminLayout>
            <AdminProductsPage />
          </AdminLayout>
        </RequireAdmin>
      } />
      <Route path="/admin/customers" element={
        <RequireAdmin>
          <AdminLayout>
            <AdminCustomersPage />
          </AdminLayout>
        </RequireAdmin>
      } />
      <Route path="/admin/orders" element={
        <RequireAdmin>
          <AdminLayout>
            <AdminOrdersPage />
          </AdminLayout>
        </RequireAdmin>
      } />
      <Route path="/admin/categories" element={
        <RequireAdmin>
          <AdminLayout>
            <AdminCategoriesPage />
          </AdminLayout>
        </RequireAdmin>
      } />
      <Route path="/admin/quotations" element={
        <RequireAdmin>
          <AdminLayout>
            <AdminQuotationsPage />
          </AdminLayout>
        </RequireAdmin>
      } />
      <Route path="/admin/payments" element={
        <RequireAdmin>
          <AdminLayout>
            <AdminPaymentsPage />
          </AdminLayout>
        </RequireAdmin>
      } />
      <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
      <Route path="/admin/notifications" element={
        <RequireAdmin>
          <AdminLayout>
            <AdminNotificationsPage />
          </AdminLayout>
        </RequireAdmin>
      } />
      <Route path="/admin/settings" element={
        <RequireAdmin>
          <AdminLayout>
            <AdminSettingsPage />
          </AdminLayout>
        </RequireAdmin>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useEffect } from 'react'

function CapacitorHardwareBackButton() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (window.location.pathname === '/app' || window.location.pathname === '/' || !canGoBack) {
        CapacitorApp.exitApp();
      } else {
        window.history.back();
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, []);

  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CapacitorHardwareBackButton />
        <AuthProvider>
          <AppRouter />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#FFFFFF',
                color: '#172B42',
                border: '1px solid #E8E4DA',
                borderRadius: '12px',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(23,43,66,0.08)',
              },
              success: { iconTheme: { primary: '#C91D58', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
