import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Check, X, Layers, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/types'
import toast from 'react-hot-toast'

const categorySchema = z.object({
  name: z.string().min(2, 'Name required'),
  slug: z.string().min(2, 'Slug required'),
  description: z.string().optional(),
  image_url: z.string().optional(),
  display_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
})
type CategoryForm = z.infer<typeof categorySchema>

const INPUT =
  'w-full px-3 py-2 text-sm rounded-lg border border-text-muted bg-text-main text-white placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-brand-red'

function CategoryModal({
  category,
  onClose,
}: {
  category?: Category
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const isEdit = !!category

  const form = useForm<any>({
    resolver: zodResolver(categorySchema),
    defaultValues: category
      ? {
          name: category.name,
          slug: category.slug,
          description: category.description ?? '',
          image_url: category.image_url ?? '',
          display_order: category.display_order,
          is_active: category.is_active,
        }
      : {
          display_order: 0,
          is_active: true,
        },
  })

  const save = useMutation({
    mutationFn: async (data: CategoryForm) => {
      const payload = {
        ...data,
        slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      }

      if (isEdit) {
        const { error } = await supabase.from('categories').update(payload).eq('id', category.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('categories').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Category updated!' : 'Category created!')
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories-admin'] })
      queryClient.invalidateQueries({ queryKey: ['categories-catalog'] })
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const { errors } = form.formState

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-text-main rounded-2xl border border-text-main overflow-hidden shadow-2xl">
        <div className="bg-text-main border-b border-text-main px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-display font-semibold text-white">
            {isEdit ? 'Edit Category' : 'Add New Category'}
          </h2>
          <button onClick={onClose} className="text-text-light hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={form.handleSubmit((d: any) => save.mutate(d))} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-light mb-1">Category Name *</label>
            <input
              className={INPUT}
              placeholder="e.g. Mani Beads & Malas"
              {...form.register('name', {
                onChange: (e) => {
                  if (!isEdit) {
                    form.setValue(
                      'slug',
                      e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                    )
                  }
                },
              })}
            />
            {errors.name && <p className="text-xs text-red-400 mt-0.5">{errors.name.message as string}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-text-light mb-1">URL Slug *</label>
            <input className={INPUT} placeholder="mani-beads-malas" {...form.register('slug')} />
            {errors.slug && <p className="text-xs text-red-400 mt-0.5">{errors.slug.message as string}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-text-light mb-1">Description</label>
            <textarea
              rows={2}
              className={INPUT}
              placeholder="Short description for wholesale buyers..."
              {...form.register('description')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-light mb-1">Category Image URL</label>
            <input
              type="url"
              className={INPUT}
              placeholder="https://images.unsplash.com/..."
              {...form.register('image_url')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-light mb-1">Display Order</label>
            <input type="number" className={INPUT} {...form.register('display_order')} />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="cat_active"
              className="w-4 h-4 accent-brand-red"
              {...form.register('is_active')}
            />
            <label htmlFor="cat_active" className="text-sm text-text-light cursor-pointer">
              Active (visible to wholesale buyers)
            </label>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1 text-text-light border border-text-muted hover:border-text-muted"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={save.isPending}>
              {save.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving…
                </>
              ) : isEdit ? (
                'Save Changes'
              ) : (
                'Create Category'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient()
  const [modal, setModal] = useState<{ open: boolean; category?: Category }>({ open: false })

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('categories')
        .update({ is_active })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories-catalog'] })
      toast.success('Category status updated')
    },
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Categories</h1>
          <p className="text-sm text-text-light">
            Manage wholesale product groupings and catalogue hierarchy
          </p>
        </div>
        <button
          onClick={() => setModal({ open: true })}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-text-main border border-text-main rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-8 text-center text-text-muted">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-text-light">
            <Layers className="w-10 h-10 mx-auto mb-3 text-text-muted" />
            <p className="font-semibold text-white">No categories found</p>
            <p className="text-xs text-text-muted mt-1">
              Add your first category or run the SQL seed file in Supabase.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-text-main/80 border-b border-text-main text-text-light text-xs uppercase">
                <tr>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Slug</th>
                  <th className="px-6 py-3.5 text-center">Order</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-text-main text-text-light">
                {categories.map(cat => (
                  <tr key={cat.id} className="hover:bg-text-main/40 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-white">{cat.name}</p>
                        {cat.description && (
                          <p className="text-xs text-text-muted line-clamp-1">{cat.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-text-light">{cat.slug}</td>
                    <td className="px-6 py-4 text-center text-xs">{cat.display_order}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleActive.mutate({ id: cat.id, is_active: !cat.is_active })}
                        className={cn(
                          'badge text-[11px] cursor-pointer transition-all',
                          cat.is_active ? 'badge-green' : 'badge-charcoal'
                        )}
                      >
                        {cat.is_active ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setModal({ open: true, category: cat })}
                        className="p-2 text-text-light hover:text-white hover:bg-text-main rounded-lg transition-colors"
                        title="Edit category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal.open && (
        <CategoryModal
          category={modal.category}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  )
}
