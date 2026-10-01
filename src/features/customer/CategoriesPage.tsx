import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Gem, Triangle, Flame, Flower2, Sparkles, CircleDot } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/lib/types'

function getCategoryIcon(name: string) {
  const n = name.toLowerCase()
  if (n.includes('mala') || n.includes('beads')) return <CircleDot className="w-10 h-10" strokeWidth={1.5} />
  if (n.includes('rudraksha')) return <Flower2 className="w-10 h-10" strokeWidth={1.5} />
  if (n.includes('crystal') || n.includes('bracelet')) return <Gem className="w-10 h-10" strokeWidth={1.5} />
  if (n.includes('pyramid') || n.includes('tumble')) return <Triangle className="w-10 h-10" strokeWidth={1.5} />
  if (n.includes('pooja') || n.includes('spiritual')) return <Flame className="w-10 h-10" strokeWidth={1.5} />
  return <Sparkles className="w-10 h-10" strokeWidth={1.5} />
}

export default function CustomerCategoriesPage() {
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['customer-all-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })

  // Fetch real product counts per category
  const { data: productCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ['customer-category-product-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category_id')
        .eq('is_published', true)
        .eq('is_archived', false)
      
      if (error) throw error
      
      const counts: Record<string, number> = {}
      data?.forEach(p => {
        counts[p.category_id] = (counts[p.category_id] || 0) + 1
      })
      return counts
    }
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 space-y-12 animate-fade-in">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-3xl md:text-5xl font-display font-bold text-brand-blue tracking-tight">
          Explore Product Categories
        </h1>
        <p className="text-base md:text-lg text-text-muted leading-relaxed">
          Discover Nityamani's wholesale collection of authentic beads, Rudraksha, crystals and spiritual products.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface-card rounded-2xl p-8 border border-surface-border shadow-sm flex flex-col items-center text-center space-y-4 relative overflow-hidden">
              <div className="w-24 h-24 rounded-full bg-surface-border/50 animate-pulse" />
              <div className="w-3/4 h-6 bg-surface-border/50 rounded animate-pulse mt-2" />
              <div className="w-full h-4 bg-surface-border/50 rounded animate-pulse" />
              <div className="w-2/3 h-4 bg-surface-border/50 rounded animate-pulse" />
              <div className="w-full mt-6 h-12 bg-surface-border/50 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/app/products?category=${cat.id}`}
              className="bg-surface-card group flex flex-col rounded-2xl border border-brand-yellow/30 shadow-card hover:shadow-brand hover:-translate-y-1 transition-all duration-300 overflow-hidden relative h-full"
            >
              {/* Decorative top gradient */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-brand-yellow via-brand-pink to-brand-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="p-8 flex flex-col h-full items-center text-center">
                {/* Icon Circle */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-brand-yellow rounded-full blur-xl opacity-10 group-hover:opacity-30 transition-opacity duration-300" />
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-brand-yellow/10 to-brand-pink/5 flex items-center justify-center text-brand-red ring-1 ring-brand-yellow/20 group-hover:scale-110 group-hover:ring-brand-pink/40 transition-all duration-500 ease-out shadow-sm">
                    {getCategoryIcon(cat.name)}
                  </div>
                </div>

                <h3 className="text-xl font-display font-bold text-brand-blue mb-3 group-hover:text-brand-red transition-colors">
                  {cat.name}
                </h3>
                
                {cat.description && (
                  <p className="text-sm text-text-muted line-clamp-3 leading-relaxed mb-6 flex-grow">
                    {cat.description}
                  </p>
                )}

                {/* Footer area */}
                <div className="mt-auto w-full pt-6 border-t border-surface-border/60 flex items-center justify-between">
                  <div className="text-sm font-medium text-text-light">
                    {productCounts[cat.id] !== undefined ? (
                      <span className="bg-surface-bg px-3 py-1 rounded-full text-xs font-semibold text-brand-blue border border-surface-border group-hover:bg-brand-yellow/10 group-hover:border-brand-yellow/30 transition-colors">
                        {productCounts[cat.id]} {productCounts[cat.id] === 1 ? 'Product' : 'Products'}
                      </span>
                    ) : (
                      <span className="opacity-0">0 Products</span>
                    )}
                  </div>
                  <div className="flex items-center text-sm font-bold text-brand-red group-hover:translate-x-2 transition-transform duration-300">
                    <span className="mr-2">Explore</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
