import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { Package, ArrowLeft, Clock, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatINR, formatDate, formatOrderId } from '@/lib/utils'
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
        .select('*, items:order_items(*)')
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

      {/* Items */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-text-main mb-4 border-b border-surface-border pb-2">Order Items</h2>
        <div className="space-y-4">
          {order.items?.map(item => (
            <div key={item.id} className="flex justify-between items-start gap-4">
              <div>
                <p className="text-sm font-medium text-text-main">{item.product_name_snapshot}</p>
                <p className="text-xs text-text-light mt-0.5">SKU: {item.sku_snapshot} · Qty: {item.quantity} {item.unit_snapshot}</p>
              </div>
              <p className="text-sm font-bold text-text-main">
                {formatINR(item.total_paise)}
              </p>
            </div>
          ))}
        </div>
        
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
          <div className="bg-surface-bg p-3 rounded-lg border border-surface-border">
            <p className="text-xs text-text-muted mb-1 font-semibold">Billing Address</p>
            <p className="text-sm text-text-main">
              {(order.billing_address_snapshot as any)?.business_name}<br/>
              {(order.billing_address_snapshot as any)?.billing_address || order.billing_address_snapshot?.line1}<br/>
              {order.billing_address_snapshot?.city}, {order.billing_address_snapshot?.state} - {order.billing_address_snapshot?.pin_code}
            </p>
          </div>
          <div className="bg-surface-bg p-3 rounded-lg border border-surface-border">
            <p className="text-xs text-text-muted mb-1 font-semibold">Shipping Address</p>
            <p className="text-sm text-text-main">
              {(order.shipping_address_snapshot as any)?.business_name}<br/>
              {(order.shipping_address_snapshot as any)?.billing_address || order.shipping_address_snapshot?.line1}<br/>
              {order.shipping_address_snapshot?.city}, {order.shipping_address_snapshot?.state} - {order.shipping_address_snapshot?.pin_code}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
