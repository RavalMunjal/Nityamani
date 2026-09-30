import { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatINR, cn } from '@/lib/utils'
import type { Product, Category } from '@/lib/types'

export default function CustomerProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryFilter = searchParams.get('category') ?? 'all'
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc'>('name')

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories-catalog'],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      return data ?? []
    },
  })

  // Fetch products
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products-catalog', categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, images:product_images(*)')
        .eq('is_published', true)
        .eq('is_archived', false)

      if (categoryFilter !== 'all') {
        query = query.eq('category_id', categoryFilter)
      }

      const { data, error } = await query
      if (error) throw error
      return (data as Product[]) ?? []
    },
  })

  // Filter & Sort
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      if (!searchTerm) return true
      const term = searchTerm.toLowerCase()
      return (
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term))
      )
    })

    if (sortBy === 'price_asc') {
      result = [...result].sort((a, b) => a.price_paise - b.price_paise)
    } else if (sortBy === 'price_desc') {
      result = [...result].sort((a, b) => b.price_paise - a.price_paise)
    } else {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    }

    return result
  }, [products, searchTerm, sortBy])

  // Fallback beautiful crystal/bead image for products without an image
  const defaultProductImage = "https://images.unsplash.com/photo-1515082161172-2f3b9c8c9735?q=80&w=400&auto=format&fit=crop"

  return (
    <div className="page-container py-8 animate-fade-in space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-text-main mb-2">Wholesale Catalogue</h1>
        <p className="text-sm text-text-muted">Live inventory, verified wholesale pricing in paise</p>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
          <input
            type="text"
            placeholder="Search beads, crystals, rudraksha or SKU..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-surface-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink shadow-sm"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-[200px]">
            <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light pointer-events-none" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-surface-border rounded-xl text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-brand-pink shadow-sm appearance-none"
            >
              <option value="name">Sort: Name (A-Z)</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
        <button
          onClick={() => setSearchParams({})}
          className={cn(
            'snap-start px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shadow-sm',
            categoryFilter === 'all'
              ? 'bg-brand-red text-white'
              : 'bg-white text-text-muted border border-surface-border hover:bg-surface-border hover:text-text-main'
          )}
        >
          All Categories
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSearchParams({ category: cat.id })}
            className={cn(
              'snap-start px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shadow-sm',
              categoryFilter === cat.id
                ? 'bg-brand-red text-white'
                : 'bg-white text-text-muted border border-surface-border hover:bg-surface-border hover:text-text-main'
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-0 overflow-hidden border-surface-border">
              <div className="skeleton h-48 w-full rounded-none" />
              <div className="p-4 space-y-3">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
                <div className="skeleton h-6 w-1/3 mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-surface-border shadow-sm">
          <Search className="w-12 h-12 text-text-light mx-auto mb-4" />
          <h3 className="text-lg font-bold text-text-main">No products found</h3>
          <p className="text-text-muted max-w-sm mx-auto mt-2">
            Try adjusting your search keywords or selecting another category filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredProducts.map(p => {
            const primaryImg = p.images?.find((img: any) => img.is_primary) ?? p.images?.[0]
            const isLowStock = p.available <= p.low_stock_threshold && p.available > 0
            const isOutOfStock = p.available <= 0

            return (
              <Link
                key={p.id}
                to={`/app/product/${p.id}`}
                className="card-hover flex flex-col border border-surface-border group bg-white"
              >
                <div className="relative h-48 bg-surface-bg overflow-hidden">
                  <img
                    src={primaryImg?.url || defaultProductImage}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.currentTarget.src = defaultProductImage }}
                  />

                  {isOutOfStock ? (
                    <span className="absolute top-2 right-2 bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded uppercase shadow-sm tracking-wide">
                      Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="absolute top-2 right-2 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wide">
                      Low Stock
                    </span>
                  ) : null}
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <p className="text-[10px] text-brand-blue/60 font-bold uppercase tracking-wider mb-1">{p.sku}</p>
                  <h3 className="text-sm font-semibold text-text-main line-clamp-2 leading-snug group-hover:text-brand-red transition-colors mb-1">{p.name}</h3>
                  <p className="text-xs text-text-muted mb-3">Unit: {p.selling_unit} {p.pack_contents ? `(Pack of ${p.pack_contents})` : ''}</p>
                  
                  <div className="mt-auto flex items-end justify-between">
                    <div>
                      <p className="text-xs text-text-light mb-0.5 tracking-wide uppercase">Wholesale Price</p>
                      <span className="text-lg font-bold text-brand-red">{formatINR(p.price_paise)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-text-muted bg-surface-bg px-2 py-1 rounded font-medium border border-surface-border">MOQ: {p.moq}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
