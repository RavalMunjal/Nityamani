import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Layers } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/lib/types'

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

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-display font-bold text-text-main">Product Categories</h1>
        <p className="text-sm text-text-muted">
          Browse our wholesale catalogue by sacred stone and craft specialty
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="skeleton h-6 w-1/2" />
              <div className="skeleton h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/app/products?category=${cat.id}`}
              className="card-hover p-6 flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-xl bg-brand-yellow flex items-center justify-center text-brand-red mb-3 group-hover:scale-110 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-text-main group-hover:text-brand-red transition-colors">
                  {cat.name}
                </h3>
                {cat.description && (
                  <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-surface-border flex items-center justify-between text-xs font-semibold text-brand-red group-hover:translate-x-1 transition-transform">
                <span>View Products</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
