import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ShoppingCart,
  Package,
  Minus,
  Plus,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  Sparkles,
  Info,
  HeartHandshake,
  Scroll,
} from 'lucide-react'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatINR } from '@/lib/utils'
import { useAuth } from '@/features/auth/AuthContext'
import type { Product } from '@/lib/types'
import { parseProductDetails } from '@/lib/productDetails'
import toast from 'react-hot-toast'

const DEFAULT_IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1515082161172-2f3b9c8c9735?q=80&w=800&auto=format&fit=crop'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [qty, setQty] = useState<number | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, images:product_images(*), category:categories(name, slug)')
        .eq('id', id)
        .eq('is_published', true)
        .single()
      if (error) throw error
      return data
    },
  })

  const addToCart = useMutation({
    mutationFn: async (quantity: number) => {
      if (!user) throw new Error('Please sign in to add to cart')

      // Get or create cart
      let cartId: string
      const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('customer_id', user.id)
        .maybeSingle()

      if (cart) {
        cartId = cart.id
      } else {
        const { data: newCart, error } = await supabase
          .from('carts')
          .insert({ customer_id: user.id })
          .select('id')
          .single()
        if (error) throw error
        cartId = newCart.id
      }

      // Upsert cart item correctly
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cartId)
        .eq('product_id', id)
        .maybeSingle()

      if (existingItem) {
        const { error } = await supabase
          .from('cart_items')
          .update({
            quantity: existingItem.quantity + quantity,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingItem.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('cart_items').insert({
          cart_id: cartId,
          product_id: id,
          quantity,
          price_paise_snapshot: product?.price_paise,
        })
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success('Added to cart!')
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['cart-count', user?.id] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (isLoading) {
    return (
      <div className="page-container py-8 space-y-6">
        <div className="skeleton h-8 w-32 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="skeleton h-96 w-full rounded-2xl" />
          <div className="space-y-4">
            <div className="skeleton h-8 w-3/4 rounded-xl" />
            <div className="skeleton h-20 w-full rounded-2xl" />
            <div className="skeleton h-40 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="page-container py-20 text-center">
        <AlertCircle className="w-12 h-12 text-brand-red mx-auto mb-3" />
        <h2 className="text-xl font-display font-bold text-text-main">Product not found</h2>
        <p className="text-text-muted text-sm mt-1">This product may have been archived or unpublished.</p>
        <Link to="/app" className="btn-primary mt-6 inline-flex">
          ← Back to Catalogue
        </Link>
      </div>
    )
  }

  const sortedImages = [...(product.images ?? [])].sort(
    (a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)
  )
  const currentQty = qty ?? product.moq
  const details = parseProductDetails(product.description)

  // Validate quantity
  const validateQty = (q: number) => {
    if (q < product.moq) return `Minimum order quantity is ${product.moq} ${product.selling_unit}s`
    if ((q - product.moq) % product.order_increment !== 0)
      return `Order must be in steps of ${product.order_increment} above MOQ`
    if (q > product.available) return `Only ${product.available} available in stock`
    return null
  }
  const qtyError = validateQty(currentQty)

  const adjustQty = (delta: number) => {
    const newQty = currentQty + delta
    if (newQty >= product.moq && newQty <= product.available) {
      setQty(newQty)
    }
  }

  const handleAddToCart = () => {
    if (qtyError) {
      toast.error(qtyError)
      return
    }
    addToCart.mutate(currentQty)
  }

  return (
    <div className="animate-fade-in pb-16">
      {/* Top back navigation */}
      <div className="page-container pt-4">
        <button
          onClick={() => navigate(-1)}
          className="btn-ghost btn-sm flex items-center gap-1.5 mb-4 text-text-muted hover:text-brand-blue"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </button>
      </div>

      <div className="page-container space-y-10">
        {/* Main Product Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Images Column */}
          <div className="lg:col-span-6 space-y-3">
            <div className="rounded-3xl overflow-hidden bg-white h-80 sm:h-[420px] relative border border-surface-border shadow-sm flex items-center justify-center p-2">
              <img
                src={
                  sortedImages.length > 0
                    ? sortedImages[selectedImage]?.url || DEFAULT_IMAGE_FALLBACK
                    : DEFAULT_IMAGE_FALLBACK
                }
                alt={product.name}
                className="w-full h-full object-contain rounded-2xl transition-transform duration-500 hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_IMAGE_FALLBACK
                }}
              />
              <span className="absolute top-4 left-4 bg-brand-yellow text-brand-blue text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                Direct Wholesale
              </span>
            </div>

            {/* Thumbnail Carousel */}
            {sortedImages.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                {sortedImages.map((img, i) => (
                  <button
                    key={img.id || i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all p-0.5 bg-white ${
                      i === selectedImage
                        ? 'border-brand-red shadow-sm'
                        : 'border-surface-border opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_IMAGE_FALLBACK
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Buying & Quick Info Column */}
          <div className="lg:col-span-6 space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="badge badge-gray text-xs font-mono">{product.sku}</span>
                {product.category && (
                  <span className="badge badge-brand-yellow text-xs font-semibold text-brand-blue">
                    {product.category.name}
                  </span>
                )}
                {details.origin && (
                  <span className="badge badge-blue text-xs">Origin: {details.origin}</span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-display font-bold text-text-main leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Price Box */}
            <div className="card p-5 bg-gradient-to-r from-brand-yellow/20 via-surface-bg to-white border border-brand-yellow/40 rounded-2xl space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-brand-red">
                  {formatINR(product.price_paise)}
                </span>
                <span className="text-sm font-semibold text-text-muted">
                  / {product.selling_unit}
                </span>
              </div>
              <p className="text-xs text-text-muted">
                Wholesale rate · Integer paise billing with zero hidden markups
                {product.pack_contents && (
                  <span className="font-semibold text-text-main">
                    {' '}
                    (Standard bunch contains {product.pack_contents} pcs)
                  </span>
                )}
              </p>
            </div>

            {/* Wholesale Parameters Pill Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-3 text-center bg-white border border-surface-border rounded-xl">
                <p
                  className={`text-base font-bold ${
                    product.available > 0 ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {product.available > 0 ? `${product.available}` : 'Out of Stock'}
                </p>
                <p className="text-[10px] text-text-light uppercase tracking-wider font-semibold">
                  Available Stock
                </p>
              </div>

              <div className="card p-3 text-center bg-white border border-surface-border rounded-xl">
                <p className="text-base font-bold text-brand-blue">
                  {product.moq} {product.selling_unit}s
                </p>
                <p className="text-[10px] text-text-light uppercase tracking-wider font-semibold">
                  Minimum Order (MOQ)
                </p>
              </div>

              <div className="card p-3 text-center bg-white border border-surface-border rounded-xl">
                <p className="text-base font-bold text-text-main">+{product.order_increment}</p>
                <p className="text-[10px] text-text-light uppercase tracking-wider font-semibold">
                  Order Step
                </p>
              </div>
            </div>

            {/* Quantity Selector & Add to Cart */}
            {product.available > 0 ? (
              <div className="card p-5 bg-white border border-surface-border rounded-2xl space-y-4 shadow-sm">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-text-main mb-2">
                    <span>Order Quantity ({product.selling_unit}s)</span>
                    <span className="text-text-muted">
                      Multiples of {product.order_increment} above MOQ ({product.moq})
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      className="btn-icon btn-secondary rounded-xl h-11 w-11 flex items-center justify-center border border-surface-border hover:bg-surface-border"
                      onClick={() => adjustQty(-product.order_increment)}
                      disabled={currentQty <= product.moq}
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <input
                      type="number"
                      value={currentQty}
                      onChange={(e) => setQty(Number(e.target.value))}
                      className="field-input text-center w-28 font-bold text-lg rounded-xl h-11"
                      min={product.moq}
                      step={product.order_increment}
                    />

                    <button
                      className="btn-icon btn-secondary rounded-xl h-11 w-11 flex items-center justify-center border border-surface-border hover:bg-surface-border"
                      onClick={() => adjustQty(product.order_increment)}
                      disabled={currentQty >= product.available}
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    <div className="ml-auto text-right">
                      <p className="text-[11px] text-text-muted">Line Total</p>
                      <p className="text-lg font-bold text-brand-red">
                        {formatINR(product.price_paise * currentQty)}
                      </p>
                    </div>
                  </div>
                </div>

                {qtyError ? (
                  <p className="text-xs text-red-500 flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {qtyError}
                  </p>
                ) : (
                  <p className="text-xs text-emerald-600 flex items-center gap-1.5 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" /> Ready to order {currentQty}{' '}
                    {product.selling_unit}s
                  </p>
                )}

                <button
                  className="btn-primary w-full btn-lg flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                  onClick={handleAddToCart}
                  disabled={!!qtyError || addToCart.isPending}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {addToCart.isPending ? 'Adding to Cart…' : `Add ${currentQty} to Cart`}
                </button>
              </div>
            ) : (
              <div className="card p-6 text-center bg-surface-bg border border-surface-border rounded-2xl space-y-2">
                <Package className="w-10 h-10 text-text-light mx-auto" />
                <h3 className="font-semibold text-text-main text-base">Currently Out of Stock</h3>
                <p className="text-xs text-text-muted max-w-xs mx-auto">
                  New consignment is arriving shortly. Contact our Surat desk for bulk advance
                  reservations.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Structured Product Information Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
          {/* Left: About, Uses, Suitable For */}
          <div className="lg:col-span-7 space-y-6">
            {/* ABOUT THIS PRODUCT */}
            <div className="card p-6 bg-white border border-surface-border rounded-2xl space-y-3">
              <h2 className="text-lg font-display font-bold text-text-main flex items-center gap-2 border-b border-surface-border pb-2">
                <Info className="w-5 h-5 text-brand-red" />
                About This Product
              </h2>
              <p className="text-sm text-text-main leading-relaxed whitespace-pre-line">
                {details.about || details.summary || product.description}
              </p>
            </div>

            {/* TRADITIONAL / COMMON USE (FACTUAL / BELIEF SEPARATION) */}
            {details.traditional_use && (
              <div className="card p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-amber-500/20 pb-2">
                  <h2 className="text-lg font-display font-bold text-amber-900 flex items-center gap-2">
                    <Scroll className="w-5 h-5 text-amber-700" />
                    Traditional & Cultural Significance
                  </h2>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                    Traditional Heritage
                  </span>
                </div>

                <p className="text-sm text-amber-950 leading-relaxed whitespace-pre-line">
                  {details.traditional_use}
                </p>

                <p className="text-[11px] text-amber-800/80 italic pt-1 border-t border-amber-500/10">
                  Note: Statements reflect centuries-old cultural customs, spiritual traditions, and
                  traditional lore. Described for authentic cultural appreciation, not as medical or
                  guaranteed supernatural claims.
                </p>
              </div>
            )}

            {/* SUITABLE FOR */}
            {details.suitable_for && (
              <div className="card p-6 bg-white border border-surface-border rounded-2xl space-y-3">
                <h2 className="text-lg font-display font-bold text-text-main flex items-center gap-2 border-b border-surface-border pb-2">
                  <HeartHandshake className="w-5 h-5 text-brand-red" />
                  Recommended Buyers & Suitable For
                </h2>
                <p className="text-sm text-text-main leading-relaxed whitespace-pre-line">
                  {details.suitable_for}
                </p>
              </div>
            )}

            {/* CARE INSTRUCTIONS */}
            {details.care_instructions && (
              <div className="card p-6 bg-white border border-surface-border rounded-2xl space-y-3">
                <h2 className="text-lg font-display font-bold text-text-main flex items-center gap-2 border-b border-surface-border pb-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Care & Handling Instructions
                </h2>
                <p className="text-sm text-text-main leading-relaxed whitespace-pre-line">
                  {details.care_instructions}
                </p>
              </div>
            )}
          </div>

          {/* Right: Technical Spec Sheet & Wholesale Specs */}
          <div className="lg:col-span-5 space-y-6">
            {/* SPECIFICATIONS TABLE */}
            <div className="card p-6 bg-white border border-surface-border rounded-2xl space-y-4">
              <h2 className="text-lg font-display font-bold text-text-main flex items-center gap-2 border-b border-surface-border pb-2">
                <Sparkles className="w-5 h-5 text-brand-red" />
                Product Specifications
              </h2>

              <dl className="divide-y divide-surface-border text-sm">
                <div className="py-2.5 flex justify-between">
                  <dt className="text-text-muted font-medium">SKU Code</dt>
                  <dd className="font-mono font-semibold text-text-main">{product.sku}</dd>
                </div>

                {details.material && (
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-text-muted font-medium">Material / Stone</dt>
                    <dd className="font-semibold text-text-main text-right">{details.material}</dd>
                  </div>
                )}

                {details.type_variety && (
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-text-muted font-medium">Type / Variety</dt>
                    <dd className="font-semibold text-text-main text-right">{details.type_variety}</dd>
                  </div>
                )}

                {details.origin && (
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-text-muted font-medium">Origin</dt>
                    <dd className="font-semibold text-text-main">{details.origin}</dd>
                  </div>
                )}

                {details.bead_size && (
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-text-muted font-medium">Bead Size / Dimension</dt>
                    <dd className="font-semibold text-text-main">{details.bead_size}</dd>
                  </div>
                )}

                {details.mukhi && (
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-text-muted font-medium">Mukhi</dt>
                    <dd className="font-semibold text-brand-red">{details.mukhi}</dd>
                  </div>
                )}

                {details.colour && (
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-text-muted font-medium">Natural Colour</dt>
                    <dd className="font-semibold text-text-main">{details.colour}</dd>
                  </div>
                )}

                {details.grade && (
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-text-muted font-medium">Quality / Grade</dt>
                    <dd className="font-semibold text-text-main">{details.grade}</dd>
                  </div>
                )}

                {details.certification && (
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-text-muted font-medium">Certification</dt>
                    <dd className="font-semibold text-emerald-600">{details.certification}</dd>
                  </div>
                )}

                <div className="py-2.5 flex justify-between">
                  <dt className="text-text-muted font-medium">Selling Unit</dt>
                  <dd className="font-semibold text-text-main capitalize">{product.selling_unit}</dd>
                </div>
              </dl>
            </div>

            {/* WHOLESALE & LOGISTICS INFORMATION */}
            <div className="card p-6 bg-surface-bg border border-surface-border rounded-2xl space-y-3">
              <h2 className="text-base font-bold text-text-main flex items-center gap-2">
                <Package className="w-4 h-4 text-brand-red" />
                Wholesale Logistics & Dispatch
              </h2>

              <p className="text-xs text-text-muted leading-relaxed">
                {details.wholesale_notes ||
                  'Packed securely in sealed wholesale lots. Dispatched via express surface or air courier directly from Surat depot with complete GST e-way documentation.'}
              </p>

              <div className="pt-2 text-xs space-y-1.5 border-t border-surface-border text-text-main font-medium">
                <p>✓ Minimum Order Quantity: {product.moq} {product.selling_unit}s</p>
                <p>✓ B2B Tax Invoice with GSTIN provided</p>
                <p>✓ Direct manufacturer & importer supply rates</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
