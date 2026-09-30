import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, ShoppingCart, ArrowRight, Package, Plus, Minus, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatINR } from '@/lib/utils'
import { useAuth } from '@/features/auth/AuthContext'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'

export default function CartPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [renderError, setRenderError] = useState<Error | null>(null)

  const { data: cartItems = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['cart', user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        const { data: cart, error: cartErr } = await supabase
          .from('carts')
          .select('id')
          .eq('customer_id', user!.id)
          .maybeSingle()

        if (cartErr) throw cartErr
        if (!cart) return []

        const { data: items, error: itemsErr } = await supabase
          .from('cart_items')
          .select('*, product:products(id, name, sku, price_paise, selling_unit, available, moq, order_increment, images:product_images(url, is_primary))')
          .eq('cart_id', cart.id)

        if (itemsErr) throw itemsErr
        return items ?? []
      } catch (err) {
        console.error("Cart Fetch Error:", err)
        throw err
      }
    },
  })

  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from('cart_items').delete().eq('id', itemId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Removed from cart')
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['cart-count'] })
    },
    onError: (err) => {
      console.error(err)
      toast.error('Failed to remove item')
    },
  })

  const updateQuantity = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string, quantity: number }) => {
      const { error } = await supabase.from('cart_items').update({ quantity }).eq('id', itemId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['cart-count'] })
    },
    onError: (err) => {
      console.error(err)
      toast.error('Failed to update quantity')
    },
  })

  const submitOrder = useMutation({
    mutationFn: async () => {
      if (!user || !cartItems || cartItems.length === 0) throw new Error('Cart is empty')
      
      const { data: bProfile } = await supabase.from('business_profiles').select('*').eq('profile_id', user.id).maybeSingle()
      
      const { data: newOrder, error: orderError } = await supabase.from('orders').insert({
        customer_id: user.id,
        fulfilment_status: 'requested',
        payment_status: 'unpaid',
        billing_address_snapshot: bProfile ?? {},
        shipping_address_snapshot: bProfile ?? {},
      }).select().single()
      
      if (orderError) throw orderError

      const orderItems = cartItems.map((item: any) => {
        const product = item.product || {}
        return {
          order_id: newOrder.id,
          product_id: item.product_id,
          product_name_snapshot: product.name ?? 'Unknown Product',
          sku_snapshot: product.sku ?? 'UNKNOWN',
          unit_snapshot: product.selling_unit ?? 'piece',
          quantity: item.quantity,
          unit_price_paise: product.price_paise ?? 0,
          total_paise: (product.price_paise ?? 0) * item.quantity,
        }
      })
      
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
      if (itemsError) throw itemsError

      await supabase.from('cart_items').delete().eq('cart_id', cartItems[0].cart_id)
      return newOrder.id
    },
    onSuccess: () => {
      toast.success('Order requested successfully!')
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['cart-count'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      navigate('/app/orders')
    },
    onError: (err: any) => {
      console.error(err)
      toast.error('Failed to submit order: ' + err.message)
    }
  })

  // Prevent crashing the whole page if a render error happens during mapping
  try {
    if (renderError) {
      throw renderError;
    }

    if (isError) {
      return (
        <div className="page-container py-20 text-center animate-fade-in">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-display font-semibold text-text-main mb-2">Unable to load your cart</h2>
          <p className="text-text-light text-sm mb-6">{(error as Error)?.message || 'An unknown error occurred.'}</p>
          <button onClick={() => refetch()} className="btn-primary">Retry</button>
        </div>
      )
    }

    if (isLoading) return (
      <div className="page-container py-8 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton h-32 rounded-xl" />
        ))}
      </div>
    )

    if (!cartItems || cartItems.length === 0) return (
      <div className="page-container py-20 text-center animate-fade-in">
        <ShoppingCart className="w-16 h-16 text-text-light mx-auto mb-4" />
        <h2 className="text-xl font-display font-semibold text-text-main mb-2">Your cart is empty</h2>
        <p className="text-text-light text-sm mb-6">Browse our catalogue and add products to get started.</p>
        <Link to="/app/products" className="btn-primary">Browse Products</Link>
      </div>
    )

    const grandTotal = cartItems.reduce((sum: number, item: any) => {
      const price = item?.product?.price_paise ?? 0
      const qty = item?.quantity ?? 0
      return sum + (price * qty)
    }, 0)

    return (
      <div className="page-container py-6 animate-fade-in">
        <h1 className="section-heading mb-6 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-brand-red" />
          Cart ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})
        </h1>

        <div className="space-y-3 mb-6">
          {cartItems.map((item: any) => {
            const product = item.product || {}
            // Safely parse images which might be an array or undefined
            const images = Array.isArray(product.images) ? product.images : []
            const primaryImg = images.find((i: any) => i.is_primary) ?? images[0]
            const priceChanged = item.price_paise_snapshot && product.price_paise && item.price_paise_snapshot !== product.price_paise

            return (
              <div key={item.id} className="card p-4 flex gap-4 items-start border-surface-border">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-surface-bg flex-shrink-0 overflow-hidden border border-surface-border shadow-sm">
                  <img 
                    src={primaryImg?.url || "https://images.unsplash.com/photo-1515082161172-2f3b9c8c9735?q=80&w=200&auto=format&fit=crop"} 
                    alt={product.name || "Product"} 
                    className="w-full h-full object-cover" 
                    onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1515082161172-2f3b9c8c9735?q=80&w=200&auto=format&fit=crop" }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-brand-blue/60 font-bold uppercase tracking-wider">{product.sku || 'UNKNOWN'}</p>
                  <Link to={`/app/product/${product.id}`}
                    className="text-sm md:text-base font-semibold text-text-main hover:text-brand-red line-clamp-2 leading-snug">
                    {product.name || 'Unavailable Product'}
                  </Link>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center bg-surface-bg rounded-lg border border-surface-border">
                      <button className="btn-icon w-7 h-7 text-text-muted hover:text-brand-red disabled:opacity-50"
                        onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: item.quantity - (product.order_increment || 1) })}
                        disabled={item.quantity <= (product.moq || 1) || updateQuantity.isPending}>
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-8 text-center">{item.quantity}</span>
                      <button className="btn-icon w-7 h-7 text-text-muted hover:text-brand-blue disabled:opacity-50"
                        onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: item.quantity + (product.order_increment || 1) })}
                        disabled={item.quantity >= (product.available || 999999) || updateQuantity.isPending}>
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-xs text-text-light">{product.selling_unit || 'unit'}</span>
                  </div>
                  {priceChanged && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      ⚠️ Price updated to {formatINR(product.price_paise)}
                    </p>
                  )}
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <p className="font-bold text-brand-red text-sm">
                    {formatINR((product.price_paise || 0) * item.quantity)}
                  </p>
                  <button className="btn-ghost btn-sm text-red-500 hover:bg-red-50 px-2"
                    onClick={() => removeItem.mutate(item.id)}
                    disabled={removeItem.isPending || submitOrder.isPending}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Order summary */}
        <div className="card p-5 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-text-muted">Subtotal ({cartItems.length} items)</span>
            <span className="font-semibold">{formatINR(grandTotal)}</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-text-muted">Delivery charges</span>
            <span className="text-sm text-amber-600 font-medium">To be confirmed</span>
          </div>
          <div className="divider-brand-yellow" />
          <div className="flex justify-between items-center">
            <span className="font-semibold text-text-main">Items Total</span>
            <span className="text-xl font-bold text-brand-red">{formatINR(grandTotal)}</span>
          </div>
          <p className="text-xs text-text-light mt-2">
            * Final total including freight will be confirmed by our team.
          </p>
        </div>

        <button 
          onClick={() => submitOrder.mutate()} 
          disabled={submitOrder.isPending || cartItems.length === 0}
          className="btn-primary w-full btn-lg">
          {submitOrder.isPending ? <span className="nm-spinner" /> : <>Request Order <ArrowRight className="w-4 h-4" /></>}
        </button>
        <div className="mt-3 text-center">
           <Link to="/app/products" className="text-sm font-semibold text-brand-blue hover:text-brand-red underline">
             Continue Shopping
           </Link>
        </div>

        <p className="text-xs text-text-light text-center mt-3">
          <Package className="w-3 h-3 inline mr-1" />
          Our team will contact you to confirm delivery and payment.
        </p>
      </div>
    )
  } catch (err: any) {
    console.error("Cart render crash:", err)
    return (
      <div className="page-container py-20 text-center animate-fade-in">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-display font-semibold text-text-main mb-2">Something went wrong</h2>
        <p className="text-text-light text-sm mb-6">The cart interface crashed unexpectedly.</p>
        <button onClick={() => window.location.reload()} className="btn-primary">Reload Page</button>
      </div>
    )
  }
}
