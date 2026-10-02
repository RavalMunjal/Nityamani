import { Link } from 'react-router-dom'
import {
  Search,
  Globe,
  Apple,
  Smartphone,
  ShieldCheck,
  Package,
  Sparkles,
  ArrowRight,
  Truck,
  FileCheck,
  CheckCircle2,
  Lock,
  Layers
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-surface-bg text-text-main overflow-x-hidden flex flex-col font-sans">
      
      {/* ─── Top Wholesale Announcement Bar ─────────────────────── */}
      <div className="bg-brand-blue text-white text-xs sm:text-sm py-2 px-4 text-center font-medium border-b border-brand-blue/30 tracking-wide">
        <span className="inline-flex items-center gap-2 justify-center flex-wrap">
          <span className="bg-brand-yellow text-brand-blue text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">B2B Wholesale</span>
          <span>India&apos;s Direct Sourcing Hub for Sacred Mani, Gemstone Bracelets &amp; Rudraksha</span>
          <span className="hidden md:inline text-white/50">|</span>
          <span className="hidden md:inline text-brand-yellow font-semibold">Verified GST Invoicing &amp; Fast Dispatch</span>
        </span>
      </div>

      {/* ─── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-brand-yellow border-b border-brand-yellow/80 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Brand Logo - Correct Original Aspect Ratio */}
          <Link to="/" className="flex items-center transition-transform hover:scale-[1.01] focus:outline-none">
            <img
              src="/nityamani-logo-rounded.png"
              alt="Nityamani — Spiritual Gems World"
              className="h-10 sm:h-11 md:h-12 w-auto object-contain drop-shadow-sm rounded-lg"
              loading="eager"
            />
          </Link>

          {/* Header Public Actions: ONLY Login and Create Account */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/auth?mode=login"
              className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm text-brand-blue hover:text-brand-red hover:bg-white/40 transition-all duration-200"
            >
              Login
            </Link>
            <Link
              to="/auth?mode=register"
              className="inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-brand-red hover:bg-brand-pink shadow-md hover:shadow-lg transition-all duration-200 transform active:scale-95 whitespace-nowrap"
            >
              Create Account
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero Section ───────────────────────────────────────── */}
      <section className="relative pt-8 sm:pt-12 md:pt-16 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-brand-yellow/25 via-surface-bg to-white border-b border-surface-border">
        {/* Ambient brand color aura */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-brand-yellow/30 blur-3xl rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-brand-pink/5 blur-3xl rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-brand-blue/5 blur-3xl rounded-full pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          
          {/* Subtle B2B Trust Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-brand-blue/20 text-brand-blue text-xs sm:text-sm font-semibold shadow-xs mb-6 sm:mb-8 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-brand-red" />
            <span>Direct Manufacturer &amp; Importer Supply</span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-red"></span>
            <span className="text-text-muted hidden xs:inline">Strictly Wholesale</span>
          </div>

          {/* ORIGINAL NITYAMANI LOGO SHOWCASE (No duplicate oversized text, NO WHITE BORDER) */}
          <div className="w-full max-w-[340px] sm:max-w-[460px] md:max-w-[540px] mx-auto mb-8 sm:mb-10 transition-transform duration-300 hover:scale-[1.02]">
            <img
              src="/nityamani-logo-rounded.png"
              alt="Nityamani — Spiritual Gems World of A Standard Navratna & Rudraksha"
              className="w-full h-auto object-contain block mx-auto drop-shadow-xl"
            />
          </div>

          {/* Required Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-brand-blue tracking-tight leading-[1.18] mb-5 sm:mb-6">
            Wholesale Mani, Bracelets &amp; Rudraksha
          </h1>

          {/* Refined Supporting Presentation */}
          <p className="text-base sm:text-lg md:text-xl text-text-muted font-normal max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 px-2">
            Supplying India&apos;s leading temple stores, jewelers, spiritual practitioners, and resellers. Access certified natural gemstones, genuine Nepali &amp; Indonesian Rudraksha, and master-crafted prayer malas at direct factory rates.
          </p>

          {/* Strong Primary & Secondary CTAs */}
          <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-5 justify-center items-center w-full max-w-md sm:max-w-none">
            <Link
              to="/app"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl font-bold text-base sm:text-lg text-white bg-brand-red hover:bg-brand-pink shadow-brand hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Browse Products</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              to="/auth?mode=login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-base sm:text-lg text-brand-blue bg-white border-2 border-brand-blue hover:bg-brand-blue hover:text-white transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 shadow-sm hover:shadow-md"
            >
              <Lock className="w-4 h-4" />
              <span>Login to View Prices</span>
            </Link>
          </div>

          {/* Value Proof Bar */}
          <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 w-full pt-8 border-t border-surface-border/80">
            <div className="flex items-center justify-center sm:justify-start gap-3 p-3 rounded-xl bg-white/60 border border-surface-border/60">
              <div className="w-9 h-9 rounded-lg bg-brand-yellow/30 flex items-center justify-center text-brand-blue shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-xs text-text-main">100% Certified Genuine</p>
                <p className="text-[11px] text-text-muted">Lab-tested stones &amp; authentic beads</p>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3 p-3 rounded-xl bg-white/60 border border-surface-border/60">
              <div className="w-9 h-9 rounded-lg bg-brand-pink/15 flex items-center justify-center text-brand-red shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-xs text-text-main">Direct Factory Wholesale</p>
                <p className="text-[11px] text-text-muted">Strict bulk pricing with no middlemen</p>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3 p-3 rounded-xl bg-white/60 border border-surface-border/60">
              <div className="w-9 h-9 rounded-lg bg-brand-blue/10 flex items-center justify-center text-brand-blue shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-xs text-text-main">Pan-India Insured Dispatch</p>
                <p className="text-[11px] text-text-muted">Safe express delivery with live tracking</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── Wholesale Product Categories Preview ───────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white border-b border-surface-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-red mb-1">Our Wholesale Catalog</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-blue">Core Product Collections</h2>
            </div>
            <Link
              to="/app"
              className="inline-flex items-center gap-1.5 font-bold text-sm text-brand-blue hover:text-brand-red transition-colors"
            >
              <span>Explore All Wholesale Categories</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <Link
              to="/app?category=mani"
              className="group p-5 rounded-2xl bg-surface-bg border border-surface-border hover:border-brand-yellow hover:shadow-md transition-all duration-200 flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-brand-yellow/30 text-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                📿
              </div>
              <h3 className="font-bold text-text-main text-sm sm:text-base mb-1">Mani Beads &amp; Malas</h3>
              <p className="text-xs text-text-muted">Sandalwood, Tulsi, Sphatik &amp; Karungali strands</p>
            </Link>

            <Link
              to="/app?category=bracelets"
              className="group p-5 rounded-2xl bg-surface-bg border border-surface-border hover:border-brand-yellow hover:shadow-md transition-all duration-200 flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-brand-pink/15 text-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                ✨
              </div>
              <h3 className="font-bold text-text-main text-sm sm:text-base mb-1">Gemstone Bracelets</h3>
              <p className="text-xs text-text-muted">Tiger Eye, Amethyst, Pyrite, Green Aventurine &amp; more</p>
            </Link>

            <Link
              to="/app?category=rudraksha"
              className="group p-5 rounded-2xl bg-surface-bg border border-surface-border hover:border-brand-yellow hover:shadow-md transition-all duration-200 flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-brand-yellow/30 text-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                🕉️
              </div>
              <h3 className="font-bold text-text-main text-sm sm:text-base mb-1">Authentic Rudraksha</h3>
              <p className="text-xs text-text-muted">1 to 14 Mukhi beads, collector beads &amp; Gauri Shankar</p>
            </Link>

            <Link
              to="/app?category=crystals"
              className="group p-5 rounded-2xl bg-surface-bg border border-surface-border hover:border-brand-yellow hover:shadow-md transition-all duration-200 flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-brand-blue/10 text-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                🔮
              </div>
              <h3 className="font-bold text-text-main text-sm sm:text-base mb-1">Pyramids &amp; Tumbles</h3>
              <p className="text-xs text-text-muted">Reiki grids, energy tumbles, orgone &amp; raw crystals</p>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── How Ordering Works ─────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-surface-bg border-b border-surface-border">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-blue/5 text-brand-blue text-xs font-bold uppercase tracking-wider mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>Transparent B2B Workflow</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-brand-blue mb-4">
            How Wholesale Ordering Works
          </h2>
          <p className="text-text-muted text-sm sm:text-base mb-12 sm:mb-16 max-w-xl mx-auto">
            Designed specifically for wholesale merchants, temple trusts, and bulk buyers across India.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left">
            
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-surface-border shadow-xs hover:shadow-md transition-all duration-200 relative">
              <span className="absolute top-5 right-5 text-4xl font-extrabold text-brand-yellow/40">01</span>
              <div className="w-12 h-12 bg-brand-yellow/30 rounded-xl flex items-center justify-center mb-5 text-brand-blue">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-brand-blue mb-2">1. Browse Live Catalog</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Log in to check live wholesale pack quantities, minimum order thresholds (MOQ), and specification details.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-surface-border shadow-xs hover:shadow-md transition-all duration-200 relative">
              <span className="absolute top-5 right-5 text-4xl font-extrabold text-brand-pink/25">02</span>
              <div className="w-12 h-12 bg-brand-pink/15 rounded-xl flex items-center justify-center mb-5 text-brand-red">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-brand-blue mb-2">2. Submit Quotation</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Add required items to your wholesale order. We verify live warehouse stock and generate your formal quotation.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-surface-border shadow-xs hover:shadow-md transition-all duration-200 relative">
              <span className="absolute top-5 right-5 text-4xl font-extrabold text-brand-blue/20">03</span>
              <div className="w-12 h-12 bg-brand-blue/10 rounded-xl flex items-center justify-center mb-5 text-brand-blue">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-brand-blue mb-2">3. Confirm &amp; Dispatch</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Pay directly through verified NEFT/RTGS/UPI. We securely pack with tamper-proof seal and dispatch same day.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ─── PWA & Mobile Install ───────────────────────────────── */}
      <section id="download" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white border-b border-surface-border">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-blue mb-3">Install Nityamani on Your Phone</h2>
            <p className="text-text-muted text-sm sm:text-base">Fast 1-click access to wholesale stock and quotation status.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">

            {/* Android */}
            <div className="bg-surface-bg rounded-2xl p-6 border border-surface-border shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center text-green-700">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-text-main text-sm sm:text-base">Android Device</p>
                    <p className="text-text-muted text-xs">Native App</p>
                  </div>
                </div>
                <p className="text-xs text-text-muted leading-relaxed mb-4">
                  Download the official Nityamani Android application for the best mobile experience.
                </p>
                <a
                  href={import.meta.env.VITE_ANDROID_APK_URL || '/nityamani-v1.0.0.apk'}
                  onClick={(e) => {
                    // It will download automatically
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm transition-colors mb-4"
                >
                  Download Android App
                </a>
              </div>
              <div className="pt-3 border-t border-surface-border flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-green-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Full-screen Native App</span>
                </div>
                <p className="text-[10px] text-text-muted">
                  Alternatively: Open in Chrome and tap &quot;Add to Home Screen&quot; for the web app.
                </p>
              </div>
            </div>

            {/* iPhone / iPad */}
            <div className="bg-surface-bg rounded-2xl p-6 border border-surface-border shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-brand-blue">
                    <Apple className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-text-main text-sm sm:text-base">iPhone &amp; iPad</p>
                    <p className="text-text-muted text-xs">iOS Safari Web App</p>
                  </div>
                </div>
                <ol className="text-xs text-text-muted space-y-1.5 list-none mb-4">
                  <li className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-brand-blue text-white flex items-center justify-center text-[10px] font-bold">1</span> Open in <strong>Safari</strong></li>
                  <li className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-brand-blue text-white flex items-center justify-center text-[10px] font-bold">2</span> Tap the <strong>Share</strong> button (↑)</li>
                  <li className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-brand-blue text-white flex items-center justify-center text-[10px] font-bold">3</span> Tap <strong>&quot;Add to Home Screen&quot;</strong></li>
                </ol>
              </div>
              <div className="pt-3 border-t border-surface-border flex items-center gap-2 text-xs font-semibold text-brand-blue">
                <CheckCircle2 className="w-4 h-4" />
                <span>Full-screen iOS Native Experience</span>
              </div>
            </div>

          </div>

          <div className="text-center mt-10">
            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-brand-blue/30 text-brand-blue hover:bg-brand-blue hover:text-white font-bold text-sm transition-all shadow-xs"
            >
              <Globe className="w-4 h-4" />
              <span>Continue Using Web Browser</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-surface-border bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          
          <div className="flex flex-col items-center md:items-start gap-2">
            <img
              src="/nityamani-logo-rounded.png"
              alt="Nityamani"
              className="h-9 w-auto object-contain"
            />
            <p className="text-xs text-text-muted max-w-sm">
              Wholesale manufacturer &amp; direct supplier of Mani, Rudraksha, and Certified Gemstones. Strictly wholesale B2B — not for retail.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs font-medium text-text-muted">
            <Link to="/app" className="hover:text-brand-red transition-colors">Catalog</Link>
            <Link to="/auth?mode=login" className="hover:text-brand-red transition-colors">Wholesale Login</Link>
            <Link to="/auth?mode=register" className="hover:text-brand-red transition-colors">Register Firm</Link>
            <a href="/admin/login" className="hover:text-brand-blue font-semibold transition-colors">Admin Portal</a>
          </div>

          <div className="text-xs text-text-muted">
            <p>© {new Date().getFullYear()} Nityamani. All rights reserved.</p>
          </div>

        </div>
      </footer>

    </div>
  )
}
