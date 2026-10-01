import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { Package, ArrowLeft, Clock, MapPin, CreditCard } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatINR, formatDate, formatOrderId, FALLBACK_IMAGE } from '@/lib/utils'
import { useAuth } from '@/features/auth/AuthContext'
import type { Order } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['orders', id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*, product:products(images:product_images(url, is_primary))), payment:payments(payment_method, status)')
        .eq('id', id!)
        .eq('customer_id', user!.id)
        .single()
      if (error) throw error
      return data as Order
    },
  })

  if (isLoading) return (
    <div className="page-container py-8 space-y-4">
      <div className="skeleton h-8 w-1/3 rounded-xl mb-6" />
      {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
    </div>
  )

  if (!order) return (
    <div className="page-container py-20 text-center">
      <Package className="w-16 h-16 text-text-light mx-auto mb-4" />
      <h2 className="text-xl font-display font-semibold text-text-main mb-2">Order not found</h2>
      <Link to="/app/orders" className="btn-primary mt-4">Back to Orders</Link>
    </div>
  )

  return (
    <div className="page-container py-6 animate-fade-in">
      <Link to="/app/orders" className="text-sm font-medium text-text-muted hover:text-brand-red flex items-center gap-1 mb-6 w-max">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-display font-bold text-text-main">
          {formatOrderId(order.id)}
        </h1>
        <span className="badge badge-brand-yellow font-medium">
          {order.fulfilment_status}
        </span>
      </div>
      
      <p className="text-sm text-text-muted flex items-center gap-1 mb-8">
        <Clock className="w-4 h-4" />
        Requested on {formatDate(order.created_at)}
      </p>

      {/* Payment Details */}
      {(order as any).payment?.[0] && (
        <div className="card p-5 mb-6 bg-brand-yellow/5 border border-brand-yellow/30">
          <h2 className="font-semibold text-text-main mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brand-navy" />
            Payment Method
          </h2>
          <p className="text-sm text-brand-navy font-semibold uppercase">
            {(order as any).payment[0].payment_method.replace('_', ' ')}
            <span className="ml-2 text-xs font-normal text-text-muted capitalize">
              ({(order as any).payment[0].status})
            </span>
          </p>
        </div>
      )}

      {/* Items */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-text-main mb-4 border-b border-surface-border pb-2">Order Items</h2>
          {order.items?.map((item: any) => {
            const product = item.product || {}
            const images = Array.isArray(product.images) ? product.images : []
            const primaryImg = images.find((i: any) => i.is_primary) ?? images[0]

            return (
              <div key={item.id} className="flex justify-between items-start gap-4">
                <div className="flex gap-4 items-center">
                  <div className="w-14 h-14 rounded-lg bg-surface-bg flex-shrink-0 border border-surface-border overflow-hidden">
                    <img 
                      src={primaryImg?.url || FALLBACK_IMAGE} 
                      alt={item.product_name_snapshot} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-main">{item.product_name_snapshot}</p>
                    <p className="text-xs text-text-light mt-0.5">SKU: {item.sku_snapshot} · Qty: {item.quantity} {item.unit_snapshot}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-text-main">
                  {formatINR(item.total_paise)}
                </p>
              </div>
            )
          })}
        
        <div className="divider-brand-yellow my-4" />
        
        <div className="flex justify-between items-center font-bold text-text-main">
          <span>Items Total</span>
          <span className="text-brand-red">{formatINR(order.items?.reduce((acc, curr) => acc + curr.total_paise, 0) || 0)}</span>
        </div>
      </div>

      {/* Addresses */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-text-main mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-brand-red" />
          Delivery Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-surface-bg p-4 rounded-lg border border-surface-border">
            <p className="text-xs text-brand-blue mb-1 font-semibold uppercase tracking-wide">Delivery Address</p>
            <p className="text-sm text-text-main leading-relaxed">
              {(order.shipping_address_snapshot as any)?.recipient_name || (order.billing_address_snapshot as any)?.recipient_name || 'Customer'}<br/>
              {(order.shipping_address_snapshot as any)?.address_line_1 || (order.shipping_address_snapshot as any)?.billing_address || (order.shipping_address_snapshot as any)?.line1}<br/>
              {(order.shipping_address_snapshot as any)?.address_line_2 && <>{(order.shipping_address_snapshot as any).address_line_2}<br/></>}
              {order.shipping_address_snapshot?.city}, {order.shipping_address_snapshot?.state} - {order.shipping_address_snapshot?.pin_code}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
