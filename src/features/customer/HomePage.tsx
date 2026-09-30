import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ChevronRight, Sparkles, TrendingUp, ShieldCheck, Truck, HeadphonesIcon, BadgeCheck, ShoppingBag, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatINR } from '@/lib/utils'
import type { Product, Category, Banner } from '@/lib/types'

// ── Fallbacks ─────────────────────────────────────────────────────────────
const defaultProductImage = "https://images.unsplash.com/photo-1515082161172-2f3b9c8c9735?q=80&w=400&auto=format&fit=crop"
const defaultCatImage = "https://images.unsplash.com/photo-1596773228919-61250269f88c?q=80&w=400&auto=format&fit=crop"

// ── Skeleton ───────────────────────────────────────────────────────────────
function ProductSkeleton() {
  return (
    <div className="card p-0 overflow-hidden border-surface-border">
      <div className="skeleton h-48 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-3 w-3/4" />
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-6 w-1/3 mt-2" />
      </div>
    </div>
  )
}

// ── Product Card ───────────────────────────────────────────────────────────
function ProductCard({ product }: { product: Product }) {
  const primaryImage = product.images?.find((i: any) => i.is_primary) ?? product.images?.[0]
  
  return (
    <Link to={`/app/product/${product.id}`} className="card-hover flex flex-col border border-surface-border group bg-white">
      <div className="relative h-48 bg-surface-bg overflow-hidden">
        <img 
          src={primaryImage?.url || defaultProductImage} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          onError={(e) => { e.currentTarget.src = defaultProductImage }}
        />
        {product.available <= 10 && product.available > 0 && (
          <div className="absolute top-2 right-2">
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wide">Low Stock</span>
          </div>
        )}
        {product.available === 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded uppercase shadow-md tracking-wider">Out of Stock</span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[10px] text-brand-blue/60 font-bold uppercase tracking-wider mb-1">{product.sku}</p>
        <h3 className="text-sm font-semibold text-text-main line-clamp-2 leading-snug group-hover:text-brand-red transition-colors mb-1">{product.name}</h3>
        <p className="text-xs text-text-muted mb-3">Unit: {product.selling_unit}</p>
        
        <div className="mt-auto flex items-end justify-between">
          <div>
            <p className="text-xs text-text-light mb-0.5 tracking-wide uppercase">Wholesale Price</p>
            <span className="text-lg font-bold text-brand-red">{formatINR(product.price_paise)}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-text-muted bg-surface-bg px-2 py-1 rounded font-medium border border-surface-border">MOQ: {product.moq}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Home Page ──────────────────────────────────────────────────────────────
export default function HomePage() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').eq('is_active', true).order('display_order')
      return data ?? []
    },
  })

  const { data: featured = [], isLoading: featuredLoading } = useQuery<Product[]>({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*, images:product_images(*)')
        .eq('is_published', true)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(8)
      return data ?? []
    },
  })

  const { data: searchResults = [], isLoading: searchLoading } = useQuery<Product[]>({
    queryKey: ['product-search', search],
    enabled: search.length >= 2,
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*, images:product_images(*)')
        .eq('is_published', true)
        .eq('is_archived', false)
        .or(`name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`)
        .limit(20)
      return data ?? []
    },
  })

  const showSearch = search.length >= 2
  const displayProducts = showSearch ? searchResults : featured
  const isLoading = showSearch ? searchLoading : featuredLoading

  return (
    <div className="animate-fade-in pb-12">
      {/* ── Search Bar ── */}
      <div className="sticky top-0 md:top-16 z-30 bg-white/90 backdrop-blur-md px-4 py-3 border-b border-surface-border shadow-sm">
        <div className="page-container flex justify-center">
          <div className="relative w-full max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search wholesale malas, rudraksha, crystals, SKU..."
              className="w-full pl-11 pr-4 py-3 bg-surface-bg border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-pink focus:bg-white transition-all text-sm font-medium shadow-inner"
            />
          </div>
        </div>
      </div>

      {showSearch ? (
        <div className="page-container py-8">
          <h2 className="section-heading mb-6 flex items-center gap-2">
            <Search size={22} className="text-brand-red" /> Search Results for "{search}"
          </h2>
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array(4).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          )}
          {!isLoading && displayProducts.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border border-surface-border mt-4 shadow-sm">
              <Search className="w-12 h-12 text-text-light mx-auto mb-4" />
              <p className="text-lg font-bold text-text-main">No products found</p>
              <p className="text-text-muted mt-2">Try searching for a different stone, mala, or SKU.</p>
            </div>
          )}
          {!isLoading && displayProducts.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {displayProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* ── Hero Banner ── */}
          <div className="relative bg-brand-blue">
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-1606312619070-d48b4c652a52?q=80&w=1920&auto=format&fit=crop" 
                alt="Nityamani Wholesale" 
                className="w-full h-full object-cover opacity-30 mix-blend-overlay"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-blue via-brand-blue/80 to-transparent" />
            </div>
            <div className="relative page-container py-20 md:py-32 flex flex-col items-center text-center">
              <span className="text-brand-yellow font-bold tracking-widest text-sm uppercase mb-4 drop-shadow-sm">Direct Source • Pan India Supply</span>
              <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 leading-tight max-w-4xl drop-shadow-md">
                India's Premium Wholesale <br className="hidden md:block"/> 
                <span className="text-brand-yellow">Spiritual & Gemstone</span> Marketplace
              </h1>
              <p className="text-lg md:text-xl text-blue-100 max-w-2xl mb-10 drop-shadow">
                Supplying authentic Rudraksha, Crystal Malas, and Vastu products to temples, jewellers, and spiritual resellers at unbeatable B2B prices.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => navigate('/app/products')} className="btn bg-brand-yellow text-brand-blue hover:bg-yellow-400 btn-lg shadow-xl font-bold">
                  Browse Products <ArrowRight className="w-5 h-5 ml-1" />
                </button>
                <button onClick={() => navigate('/app/categories')} className="btn bg-white/10 text-white border border-white/20 hover:bg-white/20 btn-lg backdrop-blur-sm">
                  View Categories
                </button>
              </div>
            </div>
          </div>

          {/* ── Trust USP Strip ── */}
          <div className="bg-white border-b border-surface-border">
            <div className="page-container py-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex flex-col items-center text-center gap-2 p-2">
                  <div className="w-10 h-10 rounded-full bg-brand-yellow/20 flex items-center justify-center text-brand-red mb-1">
                    <BadgeCheck className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-text-main text-sm">Authentic Products</h4>
                  <p className="text-xs text-text-muted">100% genuine sourcing</p>
                </div>
                <div className="flex flex-col items-center text-center gap-2 p-2">
                  <div className="w-10 h-10 rounded-full bg-brand-yellow/20 flex items-center justify-center text-brand-red mb-1">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-text-main text-sm">Wholesale Pricing</h4>
                  <p className="text-xs text-text-muted">Unbeatable B2B margins</p>
                </div>
                <div className="flex flex-col items-center text-center gap-2 p-2">
                  <div className="w-10 h-10 rounded-full bg-brand-yellow/20 flex items-center justify-center text-brand-red mb-1">
                    <Truck className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-text-main text-sm">Pan-India Delivery</h4>
                  <p className="text-xs text-text-muted">Fast & secure shipping</p>
                </div>
                <div className="flex flex-col items-center text-center gap-2 p-2">
                  <div className="w-10 h-10 rounded-full bg-brand-yellow/20 flex items-center justify-center text-brand-red mb-1">
                    <HeadphonesIcon className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-text-main text-sm">Dedicated Support</h4>
                  <p className="text-xs text-text-muted">Assistance for your business</p>
                </div>
              </div>
            </div>
          </div>

          <div className="page-container py-12 md:py-16 space-y-16">
            {/* ── Categories ── */}
            {categories.length > 0 && (
              <section>
                <div className="flex items-end justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-display font-bold text-text-main">Shop by Category</h2>
                    <p className="text-text-muted mt-2">Explore our extensive range of spiritual collections.</p>
                  </div>
                  <Link to="/app/categories" className="hidden sm:flex btn-outline bg-white">
                    View All Categories
                  </Link>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {categories.slice(0, 4).map(cat => (
                    <Link key={cat.id} to={`/app/products?category=${cat.id}`} className="group block h-40 md:h-56 relative rounded-2xl overflow-hidden shadow-sm">
                      <img 
                        src={cat.image_url || defaultCatImage} 
                        alt={cat.name} 
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        onError={(e) => { e.currentTarget.src = defaultCatImage }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-blue/90 via-brand-blue/40 to-transparent group-hover:from-brand-blue transition-colors duration-300" />
                      <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
                        <h3 className="text-white font-bold text-lg md:text-xl drop-shadow-md">{cat.name}</h3>
                        <p className="text-brand-yellow text-xs font-bold uppercase tracking-wider mt-1 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                          Explore →
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="mt-6 sm:hidden">
                  <Link to="/app/categories" className="btn-outline w-full justify-center bg-white">
                    View All Categories
                  </Link>
                </div>
              </section>
            )}

            {/* ── New Arrivals ── */}
            <section>
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-display font-bold text-text-main flex items-center gap-3">
                    <Sparkles className="w-8 h-8 text-brand-red" /> New Arrivals
                  </h2>
                  <p className="text-text-muted mt-2">Latest additions to our wholesale catalogue.</p>
                </div>
                <Link to="/app/products" className="hidden sm:flex btn-outline bg-white">
                  Browse All Products
                </Link>
              </div>

              {isLoading && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {Array(4).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
                </div>
              )}

              {!isLoading && displayProducts.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {displayProducts.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
              )}
            </section>

            {/* ── Bottom CTA ── */}
            <section className="bg-gradient-to-br from-brand-red to-brand-pink rounded-3xl p-8 md:p-12 text-center text-white shadow-xl relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand-yellow opacity-20 rounded-full blur-3xl" />
              
              <div className="relative z-10 max-w-2xl mx-auto">
                <ShoppingBag className="w-16 h-16 mx-auto mb-6 opacity-90" />
                <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Ready to stock up?</h2>
                <p className="text-red-100 text-lg mb-8">
                  Get the best wholesale rates for your retail business. Minimum order quantities apply for B2B pricing.
                </p>
                <Link to="/app/products" className="btn bg-white text-brand-red hover:bg-brand-yellow hover:text-brand-blue btn-lg shadow-lg font-bold">
                  Start Shopping Now
                </Link>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  )
}
