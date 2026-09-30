import { Link } from 'react-router-dom'
import { Search, Globe, Apple, Smartphone, Star } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-surface-bg text-text-main overflow-x-hidden">
      
      {/* Branded Header */}
      <header className="sticky top-0 z-40 bg-brand-yellow border-b border-surface-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/nm-icon.svg" alt="Nityamani" className="h-10 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/app" className="font-semibold text-brand-blue hover:text-brand-red hidden sm:flex">Cart</Link>
            <Link to="/auth" className="font-semibold text-brand-blue hover:text-brand-red hidden sm:flex">Login</Link>
            <Link to="/auth" className="btn-primary btn-sm bg-brand-red hover:bg-brand-pink text-white">
              Create Account
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-12 pb-24 px-6 overflow-hidden bg-brand-yellow/10">
        <div className="relative max-w-4xl mx-auto text-center flex flex-col items-center">
          
          <img src="/nm-icon.svg" alt="Nityamani Logo" className="w-32 h-32 mb-6 object-contain" />
          
          <h1 className="text-6xl sm:text-7xl font-bold mb-4 text-brand-blue tracking-tight leading-tight uppercase font-display">
            NITYAMANI
          </h1>
          <h2 className="text-3xl sm:text-4xl font-semibold mb-6 text-brand-red tracking-tight">
            Wholesale Mani, Bracelets & Rudraksha
          </h2>
          <p className="text-xl text-text-main mb-10 font-medium max-w-2xl mx-auto leading-relaxed">
            Browse products, check available stock and request a quotation seamlessly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto">
            <Link to="/app" className="btn-primary btn-lg w-full sm:w-auto text-lg shadow-brand hover:shadow-xl bg-brand-red hover:bg-brand-pink text-white">
              Browse Products
            </Link>
            <Link to="/auth" className="btn-secondary btn-lg w-full sm:w-auto text-lg bg-white text-brand-blue border-brand-blue hover:bg-surface-bg">
              Login to View Prices
            </Link>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-24 px-6 bg-white border-y border-surface-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-brand-blue mb-4">How Ordering Works</h2>
          <p className="text-text-muted mb-16 max-w-lg mx-auto">A simple, transparent process tailored for wholesale buyers.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-brand-yellow/20 rounded-full flex items-center justify-center mb-6">
                <Search className="w-8 h-8 text-brand-blue" />
              </div>
              <h3 className="text-xl font-bold text-text-main mb-2">1. Choose Products</h3>
              <p className="text-text-muted text-sm">Browse our live inventory and add wholesale packs to your cart.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-brand-pink/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl">📋</span>
              </div>
              <h3 className="text-xl font-bold text-text-main mb-2">2. Request Quotation</h3>
              <p className="text-text-muted text-sm">Submit your cart. We verify availability and generate a formal quotation.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-brand-blue/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl">✅</span>
              </div>
              <h3 className="text-xl font-bold text-text-main mb-2">3. Receive Confirmation</h3>
              <p className="text-text-muted text-sm">Make offline payment and we dispatch your confirmed order.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Download / Install */}
      <section id="download" className="py-24 px-6 bg-surface-bg">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-brand-blue mb-12">Get the App</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* Android */}
            <div className="bg-white rounded-2xl p-6 border border-surface-border shadow-sm hover:shadow-card transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-text-main">Android App</p>
                  <p className="text-text-muted text-sm">APK download</p>
                </div>
              </div>
              <div className="bg-surface-bg rounded-xl p-4 text-center border border-surface-border">
                <p className="text-text-muted text-sm">🔧 Signed APK coming soon</p>
                <p className="text-text-main font-medium text-sm mt-2">Use the Web App meanwhile</p>
              </div>
            </div>

            {/* iPhone / PWA */}
            <div className="bg-white rounded-2xl p-6 border border-surface-border shadow-sm hover:shadow-card transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Apple className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-text-main">iPhone / iPad</p>
                  <p className="text-text-muted text-sm">Install as App</p>
                </div>
              </div>
              <ol className="text-sm text-text-muted space-y-2 list-none">
                <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-surface-border flex items-center justify-center text-xs font-bold text-text-main">1</span> Open in <strong className="text-text-main">Safari</strong></li>
                <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-surface-border flex items-center justify-center text-xs font-bold text-text-main">2</span> Tap the <strong className="text-text-main">Share</strong> button</li>
                <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-surface-border flex items-center justify-center text-xs font-bold text-text-main">3</span> Tap <strong className="text-text-main">"Add to Home Screen"</strong></li>
              </ol>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link to="/app" className="btn-outline btn-lg">
              <Globe className="w-5 h-5 mr-2" />
              Open Web App Instead
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-border py-12 px-6 text-center bg-white">
        <p className="text-text-muted text-sm mb-4">
          © {new Date().getFullYear()} Nityamani. Wholesale only — not for retail.
        </p>
        <div className="flex justify-center gap-4 text-sm text-brand-red">
          <a href="#" className="hover:underline">Privacy Policy</a>
          <a href="#" className="hover:underline">Terms of Service</a>
          <a href="#" className="hover:underline">Contact Us</a>
        </div>
      </footer>
    </div>
  )
}
