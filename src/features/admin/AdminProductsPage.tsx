import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Edit2,
  Eye,
  EyeOff,
  Archive,
  Upload,
  X,
  Loader2,
  Trash2,
  ExternalLink,
  Package,
  Layers,
  Sparkles,
  FileText,
  Check,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { formatINR, cn } from '@/lib/utils'
import type { Product, Category } from '@/lib/types'
import { parseProductDetails, serializeProductDetails } from '@/lib/productDetails'
import { broadcastNewProductNotification } from '@/lib/notifications'
import toast from 'react-hot-toast'

// ── Schema ─────────────────────────────────────────────────────────────────
const productSchema = z.object({
  name: z.string().min(2, 'Name required'),
  sku: z.string().min(2, 'SKU required'),
  category_id: z.string().min(1, 'Category required'),
  selling_unit: z.string().min(1, 'Selling unit required'),
  pack_contents: z.coerce.number().nullable().optional(),
  price_inr: z.coerce.number().min(0.01, 'Price in ₹ is required'),
  moq: z.coerce.number().min(1, 'MOQ required').int(),
  order_increment: z.coerce.number().min(1, 'Step required').int(),
  on_hand: z.coerce.number().min(0).int(),
  low_stock_threshold: z.coerce.number().min(0).int(),
  is_published: z.boolean().default(false),

  // Stone & Specifications
  material: z.string().optional(),
  type_variety: z.string().optional(),
  origin: z.string().optional(),
  bead_size: z.string().optional(),
  mukhi: z.string().optional(),
  colour: z.string().optional(),
  grade: z.string().optional(),
  certification: z.string().optional(),

  // Content Descriptions
  summary: z.string().optional(),
  about: z.string().optional(),
  traditional_use: z.string().optional(),
  suitable_for: z.string().optional(),
  care_instructions: z.string().optional(),
  wholesale_notes: z.string().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

// ── Field helper ───────────────────────────────────────────────────────────
function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string
  error?: any
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-light mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
      {hint && !error && <p className="text-xs text-text-muted mt-0.5">{hint}</p>}
    </div>
  )
}

const INPUT =
  'w-full px-3 py-2 text-sm rounded-lg border border-text-muted bg-text-main text-white placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-brand-red'
const ERR_INPUT = 'border-red-500 focus:ring-red-500'

const DEFAULT_IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1515082161172-2f3b9c8c9735?q=80&w=400&auto=format&fit=crop'

// ── Product Form Modal ─────────────────────────────────────────────────────
function ProductModal({ product, onClose }: { product?: Product; onClose: () => void }) {
  const queryClient = useQueryClient()
  const isEdit = !!product
  const [activeTab, setActiveTab] = useState<'basic' | 'images' | 'specs' | 'content'>('basic')
  const [images, setImages] = useState<Array<{ url: string; is_primary: boolean }>>(
    product?.images && product.images.length > 0
      ? product.images.map((img) => ({ url: img.url, is_primary: !!img.is_primary }))
      : []
  )
  const [newImageUrl, setNewImageUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories-admin'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').order('name')
      return data ?? []
    },
  })

  const details = parseProductDetails(product?.description)

  const form = useForm<any>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          sku: product.sku,
          category_id: product.category_id,
          selling_unit: product.selling_unit,
          pack_contents: product.pack_contents ?? undefined,
          price_inr: product.price_paise / 100,
          moq: product.moq,
          order_increment: product.order_increment,
          on_hand: product.on_hand,
          low_stock_threshold: product.low_stock_threshold,
          is_published: product.is_published,

          material: details.material || '',
          type_variety: details.type_variety || '',
          origin: details.origin || '',
          bead_size: details.bead_size || '',
          mukhi: details.mukhi || '',
          colour: details.colour || '',
          grade: details.grade || '',
          certification: details.certification || '',

          summary: details.summary || '',
          about: details.about || '',
          traditional_use: details.traditional_use || '',
          suitable_for: details.suitable_for || '',
          care_instructions: details.care_instructions || '',
          wholesale_notes: details.wholesale_notes || '',
        }
      : {
          selling_unit: 'piece',
          price_inr: 100,
          moq: 1,
          order_increment: 1,
          on_hand: 50,
          low_stock_threshold: 10,
          is_published: true,
          traditional_use: 'Traditionally associated with focus, meditation and spiritual harmony.',
          suitable_for: 'Wholesale resellers, Pooja shops, Temple counters & Japa meditation.',
          care_instructions: 'Keep away from moisture, perfumes and harsh cleaners. Store in a soft cloth pouch.',
          wholesale_notes: 'Individually bagged with wholesale lot number. Master cartons available for bulk orders.',
        },
  })

  // Handle image file upload to Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setIsUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: true })

      if (error) throw error

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path)

      const url = publicUrlData.publicUrl
      setImages((prev) => [...prev, { url, is_primary: prev.length === 0 }])
      toast.success('Image uploaded successfully!')
    } catch (err: any) {
      console.warn('Storage upload note:', err.message)
      toast.error(`Upload failed: ${err.message}. You can also paste an image URL directly.`)
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const addImageUrl = () => {
    if (!newImageUrl.trim()) return
    setImages((prev) => [...prev, { url: newImageUrl.trim(), is_primary: prev.length === 0 }])
    setNewImageUrl('')
  }

  const removeImage = (index: number) => {
    setImages((prev) => {
      const updated = prev.filter((_, i) => i !== index)
      if (updated.length > 0 && !updated.some((img) => img.is_primary)) {
        updated[0].is_primary = true
      }
      return updated
    })
  }

  const setPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        is_primary: i === index,
      }))
    )
  }

  const save = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const serializedDescription = serializeProductDetails({
        summary: data.summary || data.name,
        about: data.about || data.summary || data.name,
        traditional_use: data.traditional_use || '',
        suitable_for: data.suitable_for || '',
        material: data.material || '',
        type_variety: data.type_variety || '',
        origin: data.origin || '',
        bead_size: data.bead_size || '',
        mukhi: data.mukhi || '',
        colour: data.colour || '',
        grade: data.grade || '',
        certification: data.certification || '',
        care_instructions: data.care_instructions || '',
        wholesale_notes: data.wholesale_notes || '',
      })

      const pricePaise = Math.round(Number(data.price_inr) * 100)

      const payload = {
        name: data.name,
        sku: data.sku,
        slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category_id: data.category_id,
        selling_unit: data.selling_unit,
        pack_contents: data.pack_contents ? Number(data.pack_contents) : null,
        price_paise: pricePaise,
        moq: Number(data.moq),
        order_increment: Number(data.order_increment),
        on_hand: Number(data.on_hand),
        available: Number(data.on_hand) - (product?.reserved ?? 0),
        reserved: product?.reserved ?? 0,
        low_stock_threshold: Number(data.low_stock_threshold),
        is_published: !!data.is_published,
        description: serializedDescription,
        updated_at: new Date().toISOString(),
      }

      let productId = product?.id

      if (isEdit && productId) {
        const { error } = await supabase.from('products').update(payload).eq('id', productId)
        if (error) throw error
      } else {
        const { data: newProd, error } = await supabase
          .from('products')
          .insert(payload)
          .select('id, name')
          .single()
        if (error) throw error
        productId = newProd.id

        // Broadcast notification if published upon creation
        if (payload.is_published && productId) {
          broadcastNewProductNotification({ id: productId, name: payload.name })
        }
      }

      // Sync product images
      if (productId) {
        // Delete old image references
        await supabase.from('product_images').delete().eq('product_id', productId)

        // Insert updated images
        if (images.length > 0) {
          const imageRows = images.map((img, idx) => ({
            product_id: productId,
            url: img.url,
            is_primary: img.is_primary,
            display_order: idx,
            alt_text: data.name,
          }))
          const { error: imgErr } = await supabase.from('product_images').insert(imageRows)
          if (imgErr) console.warn('Failed saving image records:', imgErr.message)
        }
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Product updated!' : 'Product created!')
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['products-catalog'] })
      queryClient.invalidateQueries({ queryKey: ['featured-products'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const { errors } = form.formState

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-3xl bg-text-main rounded-t-3xl sm:rounded-2xl border border-text-main max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="sticky top-0 bg-text-main border-b border-text-main px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-display font-semibold text-white">
              {isEdit ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p className="text-xs text-text-light">
              Fill in wholesale inventory details, materials, and buyer information
            </p>
          </div>
          <button onClick={onClose} className="text-text-light hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-text-main px-6 bg-text-main/80 overflow-x-auto">
          {[
            { id: 'basic', label: '1. Basic Info', icon: Package },
            { id: 'images', label: '2. Product Images', icon: Upload },
            { id: 'specs', label: '3. Stone & Specs', icon: Sparkles },
            { id: 'content', label: '4. Content & Uses', icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors',
                activeTab === tab.id
                  ? 'border-brand-red text-white bg-brand-red/10'
                  : 'border-transparent text-text-light hover:text-white'
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form
          onSubmit={form.handleSubmit((d: any) => save.mutate(d))}
          className="p-6 space-y-6 overflow-y-auto flex-1"
        >
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Product Name *" error={errors.name?.message}>
                  <input
                    className={cn(INPUT, errors.name && ERR_INPUT)}
                    placeholder="e.g. 7 Mukhi Natural Nepali Rudraksha Mala"
                    {...form.register('name')}
                  />
                </Field>
                <Field label="SKU / Item Code *" error={errors.sku?.message}>
                  <input
                    className={cn(INPUT, errors.sku && ERR_INPUT)}
                    placeholder="e.g. NM-RUD-7M-108"
                    {...form.register('sku')}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Category *" error={errors.category_id?.message}>
                  <select
                    className={cn(INPUT, errors.category_id && ERR_INPUT)}
                    {...form.register('category_id')}
                  >
                    <option value="">Select category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Selling Unit *"
                  error={errors.selling_unit?.message}
                  hint="e.g. piece, bead, bracelet, bunch, packet"
                >
                  <input
                    className={cn(INPUT, errors.selling_unit && ERR_INPUT)}
                    placeholder="piece"
                    {...form.register('selling_unit')}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Field
                  label="Wholesale Price (₹) *"
                  error={errors.price_inr?.message}
                  hint="Unit price in Rupees"
                >
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className={cn(INPUT, errors.price_inr && ERR_INPUT)}
                    placeholder="350.00"
                    {...form.register('price_inr')}
                  />
                </Field>
                <Field label="MOQ (Minimum Order) *" error={errors.moq?.message}>
                  <input
                    type="number"
                    min="1"
                    className={cn(INPUT, errors.moq && ERR_INPUT)}
                    placeholder="10"
                    {...form.register('moq')}
                  />
                </Field>
                <Field label="Order Step / Increment *" error={errors.order_increment?.message}>
                  <input
                    type="number"
                    min="1"
                    className={cn(INPUT, errors.order_increment && ERR_INPUT)}
                    placeholder="5"
                    {...form.register('order_increment')}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Field label="On Hand Stock *" error={errors.on_hand?.message}>
                  <input
                    type="number"
                    min="0"
                    className={cn(INPUT, errors.on_hand && ERR_INPUT)}
                    placeholder="250"
                    {...form.register('on_hand')}
                  />
                </Field>
                <Field label="Low Stock Alert Threshold">
                  <input
                    type="number"
                    min="0"
                    className={INPUT}
                    placeholder="10"
                    {...form.register('low_stock_threshold')}
                  />
                </Field>
                <Field label="Pack Contents (Optional)" hint="e.g. 50 for bunch of 50">
                  <input
                    type="number"
                    className={INPUT}
                    placeholder="1"
                    {...form.register('pack_contents')}
                  />
                </Field>
              </div>

              <div className="flex items-center gap-3 pt-3 p-3 rounded-xl bg-text-main/50 border border-text-main">
                <input
                  type="checkbox"
                  id="is_published"
                  className="w-4 h-4 accent-brand-red cursor-pointer"
                  {...form.register('is_published')}
                />
                <label htmlFor="is_published" className="text-sm text-text-light cursor-pointer">
                  Publish to Live Catalogue (visible to all customer accounts immediately)
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCT IMAGES */}
          {activeTab === 'images' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Upload Real Product Images</h3>
                <p className="text-xs text-text-light">
                  Images save to the official Supabase storage bucket and sync with all customer accounts.
                </p>
              </div>

              {/* Upload Drop Area */}
              <div className="border-2 border-dashed border-text-muted hover:border-brand-red rounded-2xl p-6 text-center bg-text-main/40 transition-colors">
                <input
                  type="file"
                  id="image_upload"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <label
                  htmlFor="image_upload"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <div className="w-12 h-12 rounded-xl bg-brand-red/20 text-brand-pink flex items-center justify-center">
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {isUploading ? 'Uploading to Supabase Storage…' : 'Click to select image from your device'}
                  </p>
                  <p className="text-xs text-text-muted">PNG, JPG, or WEBP (Max 5MB)</p>
                </label>
              </div>

              {/* Or Add Image via URL */}
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Or paste direct image URL (https://...)"
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-text-muted bg-text-main text-white placeholder-text-muted focus:ring-1 focus:ring-brand-red"
                />
                <button
                  type="button"
                  onClick={addImageUrl}
                  className="btn-outline btn-sm text-xs whitespace-nowrap"
                >
                  Add URL
                </button>
              </div>

              {/* Current Images List */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-text-light uppercase tracking-wider">
                  Product Images ({images.length})
                </p>

                {images.length === 0 ? (
                  <div className="p-4 rounded-xl border border-text-main bg-text-main/50 text-center">
                    <p className="text-xs text-text-muted">
                      No images added yet. (Will use high-resolution authentic gemstone fallback if omitted)
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'relative rounded-xl overflow-hidden border-2 bg-black/40 group aspect-square flex flex-col justify-between p-1.5',
                          img.is_primary ? 'border-brand-red' : 'border-text-main'
                        )}
                      >
                        <img
                          src={img.url}
                          alt="Product"
                          className="absolute inset-0 w-full h-full object-cover -z-10"
                        />
                        <div className="flex justify-between items-center z-10">
                          {img.is_primary ? (
                            <span className="bg-brand-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                              Primary
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(idx)}
                              className="bg-black/70 hover:bg-brand-red text-white text-[10px] px-2 py-0.5 rounded-full shadow backdrop-blur-sm transition-colors"
                            >
                              Set Primary
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="bg-red-600/90 text-white p-1 rounded-full hover:bg-red-700 shadow transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: STONE & SPECIFICATIONS */}
          {activeTab === 'specs' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Mala, Rudraksha & Gemstone Specifications
                </h3>
                <p className="text-xs text-text-light">
                  Category-specific fields. Displayed accurately in product details.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Stone / Material Name" hint="e.g. Nepali Rudraksha, Pure Sphatik Quartz">
                  <input
                    className={INPUT}
                    placeholder="Nepali Rudraksha"
                    {...form.register('material')}
                  />
                </Field>
                <Field label="Type / Variety" hint="e.g. 108 Mani Mala, Stretch Bracelet, Raw Tumble">
                  <input
                    className={INPUT}
                    placeholder="108 Beads Japa Mala"
                    {...form.register('type_variety')}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Origin / Source" hint="e.g. Nepal, Indonesia, Brazil, Peru, Surat">
                  <input className={INPUT} placeholder="Nepal" {...form.register('origin')} />
                </Field>
                <Field label="Bead Size / Dimension" hint="e.g. 7mm, 8mm, 10mm, 70mm">
                  <input className={INPUT} placeholder="8mm" {...form.register('bead_size')} />
                </Field>
                <Field label="Mukhi (Rudraksha only)" hint="e.g. 5 Mukhi, 7 Mukhi, Gauri Shankar">
                  <input className={INPUT} placeholder="7 Mukhi" {...form.register('mukhi')} />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Natural Colour" hint="e.g. Dark Brown, Golden Metallic, Clear White">
                  <input className={INPUT} placeholder="Natural Dark Brown" {...form.register('colour')} />
                </Field>
                <Field label="Quality / Grade" hint="e.g. AAA Selected, Natural Unheated">
                  <input className={INPUT} placeholder="AAA Grade" {...form.register('grade')} />
                </Field>
                <Field label="Certification Info" hint="e.g. Laboratory Tested & Certified">
                  <input
                    className={INPUT}
                    placeholder="Certified Authentic"
                    {...form.register('certification')}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* TAB 4: CONTENT & USES */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Product Content & Wholesale Information
                </h3>
                <p className="text-xs text-text-light">
                  Important: For spiritual items, describe traditional cultural beliefs with appropriate
                  phrasing ("Traditionally associated with...", "Commonly used for...").
                </p>
              </div>

              <Field label="Short Summary / What is this Product?">
                <textarea
                  rows={2}
                  className={INPUT}
                  placeholder="Authentic natural 7 Mukhi Nepali Rudraksha beads strung with traditional red cotton knotting..."
                  {...form.register('summary')}
                />
              </Field>

              <Field label="Traditional / Cultural Beliefs & Common Use">
                <textarea
                  rows={2}
                  className={INPUT}
                  placeholder="Traditionally associated with prosperity and peace of mind in Vedic tradition. Commonly used for daily mantra chanting and spiritual remembrance."
                  {...form.register('traditional_use')}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Recommended / Suitable For">
                  <textarea
                    rows={2}
                    className={INPUT}
                    placeholder="Temple gift counters, Japa meditation practitioners, Spiritual jewelers, Wholesale re-packers."
                    {...form.register('suitable_for')}
                  />
                </Field>
                <Field label="Care & Storage Instructions">
                  <textarea
                    rows={2}
                    className={INPUT}
                    placeholder="Keep away from water, chemical soaps and sprays. Store in a soft cotton pouch when not in use."
                    {...form.register('care_instructions')}
                  />
                </Field>
              </div>

              <Field label="Wholesale & Bulk Ordering Notes">
                <textarea
                  rows={2}
                  className={INPUT}
                  placeholder="Individually tagged with SKU barcode. Multi-pack carton discounts available for orders over 100 pcs."
                  {...form.register('wholesale_notes')}
                />
              </Field>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-text-main flex items-center justify-between gap-3 sticky bottom-0 bg-text-main">
            <div className="flex items-center gap-2">
              {activeTab !== 'basic' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'content') setActiveTab('specs')
                    else if (activeTab === 'specs') setActiveTab('images')
                    else if (activeTab === 'images') setActiveTab('basic')
                  }}
                  className="btn-outline btn-sm text-xs"
                >
                  ← Back
                </button>
              )}
              {activeTab !== 'content' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'basic') setActiveTab('images')
                    else if (activeTab === 'images') setActiveTab('specs')
                    else if (activeTab === 'specs') setActiveTab('content')
                  }}
                  className="btn-outline btn-sm text-xs"
                >
                  Next Step →
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost btn-sm text-text-light hover:text-white"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary btn-sm" disabled={save.isPending}>
                {save.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                  </>
                ) : isEdit ? (
                  'Save Changes'
                ) : (
                  'Create Product'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Products Admin Page ────────────────────────────────────────────────────
export default function AdminProductsPage() {
  const queryClient = useQueryClient()
  const [modal, setModal] = useState<{ open: boolean; product?: Product }>({ open: false })
  const [filter, setFilter] = useState<'all' | 'published' | 'unpublished' | 'archived'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['admin-products', filter],
    queryFn: async () => {
      let q = supabase
        .from('products')
        .select('*, images:product_images(*), category:categories(name)')

      if (filter === 'published') q = q.eq('is_published', true).eq('is_archived', false)
      if (filter === 'unpublished') q = q.eq('is_published', false).eq('is_archived', false)
      if (filter === 'archived') q = q.eq('is_archived', true)
      if (filter === 'all') q = q.eq('is_archived', false)

      const { data, error } = await q.order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  const togglePublish = useMutation({
    mutationFn: async ({ id, is_published, name }: { id: string; is_published: boolean; name: string }) => {
      const nextState = !is_published
      const { error } = await supabase
        .from('products')
        .update({ is_published: nextState, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error

      if (nextState) {
        broadcastNewProductNotification({ id, name })
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['products-catalog'] })
      toast.success(vars.is_published ? 'Product unpublished' : 'Product published & notified to buyers!')
    },
  })

  const archiveProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .update({ is_archived: true, is_published: false })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['products-catalog'] })
      toast.success('Product archived')
    },
  })

  const filtered = products.filter((p) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      p.name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      (p.category as any)?.name?.toLowerCase().includes(term)
    )
  })

  return (
    <div className="p-4 md:p-6 animate-fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-brand-red" />
            Wholesale Products
          </h1>
          <p className="text-text-light text-sm mt-0.5">
            {filtered.length} product{filtered.length !== 1 ? 's' : ''} in catalogue
          </p>
        </div>
        <button
          onClick={() => setModal({ open: true })}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['all', 'published', 'unpublished', 'archived'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors',
                filter === f
                  ? 'bg-brand-red/20 text-brand-pink border border-brand-red/30'
                  : 'text-text-light hover:text-white border border-text-main'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by name, SKU, category…"
          className="px-3 py-1.5 rounded-lg text-xs bg-text-main border border-text-muted text-white placeholder-text-muted focus:ring-1 focus:ring-brand-red"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-20 rounded-xl bg-text-main" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div className="card bg-text-main border-text-main p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-red/20 text-brand-pink flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <p className="text-white font-medium text-base">No products found</p>
          <p className="text-text-light text-xs mt-1">
            {searchTerm ? 'Try a different search keyword' : 'Create your first product in the catalogue'}
          </p>
          <button
            onClick={() => setModal({ open: true })}
            className="btn-primary mt-4 mx-auto flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      )}

      {/* Products Table */}
      {!isLoading && filtered.length > 0 && (
        <div className="card bg-text-main border-text-main overflow-hidden shadow-xl">
          <div className="table-container border-0 overflow-x-auto">
            <table className="nm-table w-full">
              <thead>
                <tr className="border-b border-text-main/80 text-left">
                  <th className="text-text-light py-3 px-4">Product</th>
                  <th className="text-text-light py-3 px-4 hidden sm:table-cell">SKU</th>
                  <th className="text-text-light py-3 px-4 hidden md:table-cell">Category</th>
                  <th className="text-text-light py-3 px-4">Wholesale Price</th>
                  <th className="text-text-light py-3 px-4 hidden sm:table-cell">Stock / MOQ</th>
                  <th className="text-text-light py-3 px-4">Status</th>
                  <th className="text-text-light py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-text-main/60">
                {filtered.map((p) => {
                  const sortedImages = [...(p.images ?? [])].sort(
                    (a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)
                  )
                  const primaryImage = sortedImages[0]?.url || DEFAULT_IMAGE_FALLBACK

                  return (
                    <tr key={p.id} className="hover:bg-text-main/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-black/40 overflow-hidden flex-shrink-0 border border-text-main">
                            <img
                              src={primaryImage}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = DEFAULT_IMAGE_FALLBACK
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate max-w-[200px]">
                              {p.name}
                            </p>
                            <p className="text-xs text-text-muted capitalize">
                              per {p.selling_unit}
                              {p.pack_contents ? ` (${p.pack_contents} pcs)` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <span className="text-xs font-mono text-text-light">{p.sku}</span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="text-xs text-text-light">
                          {(p.category as any)?.name ?? '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-bold text-brand-pink">
                          {formatINR(p.price_paise)}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <div>
                          <span
                            className={cn(
                              'text-xs font-bold',
                              p.available <= (p.low_stock_threshold || 10)
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            )}
                          >
                            {p.available} {p.selling_unit}s avail
                          </span>
                          <p className="text-[11px] text-text-muted">MOQ: {p.moq}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            'badge text-[10px] font-semibold',
                            p.is_published ? 'badge-green' : 'badge-gray'
                          )}
                        >
                          {p.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Live preview in new tab */}
                          <a
                            href={`/app/product/${p.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-icon btn-ghost text-text-light hover:text-white btn-sm"
                            title="Preview Customer View"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {/* Edit button */}
                          <button
                            className="btn-icon btn-ghost text-text-light hover:text-white btn-sm"
                            onClick={() => setModal({ open: true, product: p })}
                            title="Edit Product & Specs"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Publish */}
                          <button
                            className="btn-icon btn-ghost text-text-light hover:text-white btn-sm"
                            onClick={() =>
                              togglePublish.mutate({
                                id: p.id,
                                is_published: p.is_published,
                                name: p.name,
                              })
                            }
                            title={p.is_published ? 'Unpublish' : 'Publish to Buyers'}
                          >
                            {p.is_published ? (
                              <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <Eye className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                          </button>

                          {/* Archive */}
                          <button
                            className="btn-icon btn-ghost text-text-light hover:text-red-400 btn-sm"
                            onClick={() => {
                              if (confirm(`Archive "${p.name}"? It will be removed from customer catalogue.`)) {
                                archiveProduct.mutate(p.id)
                              }
                            }}
                            title="Archive"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal.open && (
        <ProductModal product={modal.product} onClose={() => setModal({ open: false })} />
      )}
    </div>
  )
}
