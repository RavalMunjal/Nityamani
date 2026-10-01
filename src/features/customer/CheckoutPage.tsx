import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { supabase } from '@/lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, CheckCircle2, ShieldCheck, Truck, CreditCard } from 'lucide-react'
import { formatINR, cn, FALLBACK_IMAGE } from '@/lib/utils'
import toast from 'react-hot-toast'

const checkoutSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit Indian mobile number required'),
  address_line_1: z.string().min(5, 'Address line 1 is required'),
  address_line_2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pin_code: z.string().regex(/^\d{6}$/, 'Valid 6-digit PIN code required'),
  payment_method: z.enum(['cash', 'bank_transfer', 'upi']),
  save_address: z.boolean().optional(),
  notes: z.string().optional(),
})

type CheckoutForm = z.infer<typeof checkoutSchema>

function Field({ label, error, children, required }: { label: string; error?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-text-main mb-1.5">
        {label} {required && <span className="text-brand-red">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-brand-red mt-1">{error}</p>}
    </div>
  )
}

export default function CheckoutPage() {
  const { user, profile, businessProfile, refreshProfile } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null)

  const { data: cartItems = [], isLoading: cartLoading } = useQuery({
    queryKey: ['cart', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: cart } = await supabase.from('carts').select('id').eq('customer_id', user!.id).maybeSingle()
      if (!cart) return []
      const { data: items } = await supabase
        .from('cart_items')
        .select('*, product:products(id, name, sku, price_paise, selling_unit, available, moq, images:product_images(url, is_primary))')
        .eq('cart_id', cart.id)
      return items ?? []
    },
  })

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      address_line_1: businessProfile?.billing_address || '',
      address_line_2: '',
      landmark: '',
      city: businessProfile?.city || '',
      state: businessProfile?.state || '',
      pin_code: businessProfile?.pin_code || '',
      payment_method: undefined as any,
      save_address: true,
      notes: '',
    }
  })

  // Prefill when profile loads
  useEffect(() => {
    if (profile) {
      if (!form.getValues('full_name')) form.setValue('full_name', profile.full_name)
      if (!form.getValues('phone')) form.setValue('phone', profile.phone)
    }
    if (businessProfile) {
      if (!form.getValues('address_line_1')) form.setValue('address_line_1', businessProfile.billing_address)
      if (!form.getValues('city')) form.setValue('city', businessProfile.city)
      if (!form.getValues('state')) form.setValue('state', businessProfile.state)
      if (!form.getValues('pin_code')) form.setValue('pin_code', businessProfile.pin_code)
    }
  }, [profile, businessProfile, form])

  const submitOrder = useMutation({
    mutationFn: async (data: CheckoutForm) => {
      if (!user) throw new Error('Not authenticated')
      if (cartItems.length === 0) throw new Error('Cart is empty')

      // Validate frontend MOQs just in case (backend also does this)
      for (const item of cartItems) {
        if (item.quantity < (item.product?.moq || 1)) {
          throw new Error(`Quantity for ${item.product?.name} is below MOQ of ${item.product?.moq}`)
        }
      }

      const shippingAddress = {
        address_line_1: data.address_line_1,
        address_line_2: data.address_line_2,
        landmark: data.landmark,
        city: data.city,
        state: data.state,
        pin_code: data.pin_code,
        country: 'India'
      }

      // Secure order creation via RPC
      const { data: orderId, error: rpcError } = await supabase.rpc('create_wholesale_order', {
        p_customer_id: user.id,
        p_shipping_address: shippingAddress,
        p_billing_address: shippingAddress,
        p_payment_method: data.payment_method,
        p_notes: data.notes || null
      })

      if (rpcError) throw rpcError

      // Save phone/address if requested
      if (data.save_address) {
        if (profile?.phone !== data.phone) {
          await supabase.from('profiles').update({ phone: data.phone }).eq('id', user.id)
        }
        if (businessProfile) {
          await supabase.from('business_profiles').update({
            billing_address: data.address_line_1,
            city: data.city,
            state: data.state,
            pin_code: data.pin_code
          }).eq('profile_id', user.id)
        }
        refreshProfile()
      }

      // Notify Admin
      const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin')
      if (admins) {
        const notifications = admins.map(a => ({
          profile_id: a.id,
          title: 'New Wholesale Order',
          message: `New order from ${data.full_name} (${data.payment_method.toUpperCase()})`,
          link_url: `/admin/orders/${orderId}`,
          type: 'order'
        }))
        await supabase.from('notifications').insert(notifications)
      }

      return orderId
    },
    onSuccess: (orderId) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['cart-count'] })
      setOrderSuccessId(orderId)
    },
    onError: (err: any) => {
      console.error(err)
      toast.error('Failed to submit order: ' + err.message)
    }
  })

  if (cartLoading) {
    return <div className="page-container py-20 flex justify-center"><div className="nm-spinner scale-150" /></div>
  }

  if (orderSuccessId) {
    return (
      <div className="page-container py-20 max-w-lg mx-auto text-center animate-fade-in">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-display font-bold text-text-main mb-2">Wholesale Order Submitted</h1>
        <p className="text-text-muted mb-6">Your order request has been sent to Nityamani securely.</p>
        
        <div className="bg-surface-bg border border-surface-border rounded-xl p-6 mb-8 text-left">
          <p className="text-sm text-text-muted mb-1">Order Reference</p>
          <p className="font-mono font-semibold text-lg">{orderSuccessId.split('-')[0].toUpperCase()}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to={`/app/orders`} className="btn-outline">View Order History</Link>
          <Link to="/app/products" className="btn-primary">Continue Shopping</Link>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="page-container py-20 text-center">
        <h2 className="text-xl font-bold mb-4">Your cart is empty</h2>
        <Link to="/app/products" className="btn-primary">Browse Products</Link>
      </div>
    )
  }

  const grandTotal = cartItems.reduce((sum: number, item: any) => {
    return sum + ((item.product?.price_paise || 0) * item.quantity)
  }, 0)

  return (
    <div className="page-container py-8 max-w-6xl mx-auto">
      <Link to="/app/cart" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-brand-red font-medium mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Cart
      </Link>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* LEFT COLUMN - FORM */}
        <div className="flex-1 space-y-6">
          <form id="checkout-form" onSubmit={form.handleSubmit((d) => submitOrder.mutate(d))} className="space-y-6">
            
            {/* CONTACT DETAILS */}
            <div className="card p-6 border-brand-yellow/30 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <ShieldCheck className="w-32 h-32" />
              </div>
              <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2 relative z-10">
                <span className="w-6 h-6 rounded-full bg-brand-yellow text-brand-navy flex items-center justify-center text-xs font-bold">1</span>
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                <Field label="Full Name" required error={form.formState.errors.full_name?.message}>
                  <input {...form.register('full_name')} className={cn('field-input', form.formState.errors.full_name && 'border-red-500')} />
                </Field>
                <Field label="Mobile Number" required error={form.formState.errors.phone?.message}>
                  <input {...form.register('phone')} type="tel" maxLength={10} className={cn('field-input', form.formState.errors.phone && 'border-red-500')} />
                </Field>
                <Field label="Email Address">
                  <input value={profile?.email || ''} readOnly className="field-input bg-gray-50 text-gray-500 cursor-not-allowed" />
                </Field>
              </div>
            </div>

            {/* DELIVERY DETAILS */}
            <div className="card p-6 border-brand-yellow/30 shadow-sm">
              <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-yellow text-brand-navy flex items-center justify-center text-xs font-bold">2</span>
                Delivery Address
              </h2>
              <div className="space-y-4">
                <Field label="Address Line 1" required error={form.formState.errors.address_line_1?.message}>
                  <input {...form.register('address_line_1')} placeholder="Shop No, Building, Street" className={cn('field-input', form.formState.errors.address_line_1 && 'border-red-500')} />
                </Field>
                <Field label="Address Line 2 (Optional)" error={form.formState.errors.address_line_2?.message}>
                  <input {...form.register('address_line_2')} placeholder="Area, Sector" className="field-input" />
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Landmark (Optional)" error={form.formState.errors.landmark?.message}>
                    <input {...form.register('landmark')} className="field-input" />
                  </Field>
                  <Field label="PIN Code" required error={form.formState.errors.pin_code?.message}>
                    <input {...form.register('pin_code')} type="tel" maxLength={6} className={cn('field-input', form.formState.errors.pin_code && 'border-red-500')} />
                  </Field>
                  <Field label="City" required error={form.formState.errors.city?.message}>
                    <input {...form.register('city')} className={cn('field-input', form.formState.errors.city && 'border-red-500')} />
                  </Field>
                  <Field label="State" required error={form.formState.errors.state?.message}>
                    <input {...form.register('state')} className={cn('field-input', form.formState.errors.state && 'border-red-500')} />
                  </Field>
                </div>
                <Field label="Country">
                  <input value="India" readOnly className="field-input bg-gray-50 text-gray-500 cursor-not-allowed" />
                </Field>

                <label className="flex items-center gap-2 cursor-pointer mt-2 text-sm text-text-main font-medium">
                  <input type="checkbox" {...form.register('save_address')} className="rounded border-gray-300 text-brand-red focus:ring-brand-red w-4 h-4" />
                  Save this address to my profile securely
                </label>
              </div>
            </div>

            {/* PAYMENT METHOD */}
            <div className="card p-6 border-brand-yellow/30 shadow-sm">
              <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-yellow text-brand-navy flex items-center justify-center text-xs font-bold">3</span>
                Payment Method
              </h2>
              {form.formState.errors.payment_method && (
                <p className="text-sm text-brand-red mb-3 font-medium">{form.formState.errors.payment_method.message}</p>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'upi', label: 'UPI / QR', icon: <CreditCard className="w-5 h-5 mb-1" /> },
                  { id: 'bank_transfer', label: 'Bank Transfer', icon: <ShieldCheck className="w-5 h-5 mb-1" /> },
                  { id: 'cash', label: 'Pay on Confirmation', icon: <Truck className="w-5 h-5 mb-1" /> }
                ].map((method) => (
                  <label key={method.id} className={cn(
                    "relative flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition-all",
                    form.watch('payment_method') === method.id 
                      ? "border-brand-red bg-brand-red/5 text-brand-red ring-1 ring-brand-red shadow-sm" 
                      : "border-surface-border bg-white text-text-muted hover:border-brand-blue/50 hover:bg-surface-bg"
                  )}>
                    <input type="radio" value={method.id} {...form.register('payment_method')} className="sr-only" />
                    {method.icon}
                    <span className="text-sm font-semibold text-center leading-tight">{method.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-text-light mt-4 bg-brand-yellow/10 p-3 rounded-lg">
                <strong>Note:</strong> Your order will be placed in 'Requested' status. Our team will verify stock and contact you for actual payment processing. No instant deduction will occur.
              </p>
            </div>
            
            <div className="card p-6 border-surface-border">
               <Field label="Order Notes (Optional)" error={form.formState.errors.notes?.message}>
                 <textarea {...form.register('notes')} className="field-input min-h-24 resize-none" placeholder="Any special instructions for delivery or packaging..." />
               </Field>
            </div>

          </form>
        </div>

        {/* RIGHT COLUMN - STICKY SUMMARY */}
        <div className="w-full lg:w-[400px]">
          <div className="sticky top-24 card p-6 shadow-md border-surface-border">
            <h2 className="text-lg font-display font-semibold mb-4 border-b border-surface-border pb-3">Order Summary</h2>
            
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar mb-4">
              {cartItems.map((item: any) => {
                const product = item.product || {}
                const images = Array.isArray(product.images) ? product.images : []
                const primaryImg = images.find((i: any) => i.is_primary) ?? images[0]

                return (
                  <div key={item.id} className="flex gap-3 text-sm">
                    <div className="w-16 h-16 rounded-md bg-surface-bg flex-shrink-0 border border-surface-border overflow-hidden">
                       <img 
                          src={primaryImg?.url || FALLBACK_IMAGE} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                       />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-main line-clamp-2 leading-tight mb-1">{product.name}</p>
                      <p className="text-xs text-text-muted mb-1">SKU: {product.sku}</p>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-text-muted">{formatINR(product.price_paise)} × {item.quantity} {product.selling_unit}</span>
                        <span className="font-bold text-brand-navy">{formatINR((product.price_paise || 0) * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="divider-surface-border" />
            
            <div className="space-y-2 text-sm text-text-main mb-4">
              <div className="flex justify-between">
                <span className="text-text-muted">Total Items</span>
                <span className="font-medium">{cartItems.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Subtotal</span>
                <span className="font-medium">{formatINR(grandTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Delivery Charges</span>
                <span className="text-amber-600 font-medium">At Actuals</span>
              </div>
            </div>

            <div className="divider-surface-border" />

            <div className="flex justify-between items-center mb-6">
              <span className="font-display font-bold text-lg text-text-main">Grand Total</span>
              <span className="font-bold text-xl text-brand-red">{formatINR(grandTotal)}</span>
            </div>

            <button 
              type="submit" 
              form="checkout-form"
              disabled={submitOrder.isPending}
              className="btn-primary w-full btn-lg relative overflow-hidden group">
              {submitOrder.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="nm-spinner border-white" /> Submitting...
                </span>
              ) : (
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <ShieldCheck className="w-5 h-5" /> Confirm Wholesale Order
                </span>
              )}
            </button>
            <p className="text-[11px] text-center text-text-muted mt-3">
              By placing this order, you agree to Nityamani's wholesale terms and conditions. Secure transaction.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
