import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Package, ChevronRight, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatINR, formatDate, formatOrderId } from '@/lib/utils'
import { useAuth } from '@/features/auth/AuthContext'
import type { Order, OrderFulfilmentStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const statusConfig: Record<OrderFulfilmentStatus, { label: string; color: string }> = {
  requested:       { label: 'Requested',      color: 'badge-gray' },
  under_review:    { label: 'Under Review',   color: 'badge-blue' },
  awaiting_payment:{ label: 'Awaiting Payment', color: 'badge-brand-yellow' },
  processing:      { label: 'Processing',     color: 'badge-blue' },
  ready:           { label: 'Ready',          color: 'badge-green' },
  dispatched:      { label: 'Dispatched',     color: 'badge-purple' },
  delivered:       { label: 'Delivered',      color: 'badge-green' },
  cancelled:       { label: 'Cancelled',      color: 'badge-red' },
  expired:         { label: 'Expired',        color: 'badge-gray' },
}

export default function OrdersPage() {
  const { user } = useAuth()

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['orders', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(id, product_name_snapshot, quantity, unit_price_paise, total_paise)')
        .eq('customer_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  if (isLoading) return (
    <div className="page-container py-8 space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
    </div>
  )

  if (orders.length === 0) return (
    <div className="page-container py-20 text-center">
      <Package className="w-16 h-16 text-text-light mx-auto mb-4" />
      <h2 className="text-xl font-display font-semibold text-text-main mb-2">No orders yet</h2>
      <p className="text-text-light text-sm mb-6">Your order history will appear here.</p>
      <Link to="/app" className="btn-primary">Start Shopping</Link>
    </div>
  )

  return (
    <div className="page-container py-6 animate-fade-in">
      <h1 className="section-heading mb-6 flex items-center gap-2">
        <Package className="w-5 h-5 text-brand-red" />
        My Orders
      </h1>

      <div className="space-y-3">
        {orders.map(order => {
          const status = statusConfig[order.fulfilment_status] ?? { label: order.fulfilment_status, color: 'badge-gray' }
          return (
            <Link key={order.id} to={`/app/orders/${order.id}`}
              className="card-hover flex gap-4 p-4 items-center">
              <div className="w-10 h-10 rounded-xl bg-brand-yellow flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-brand-red" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-text-main">
                    {formatOrderId(order.id)}
                  </span>
                  <span className={cn('badge', status.color)}>{status.label}</span>
                </div>
                <p className="text-xs text-text-light mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(order.created_at)}
                  {order.items?.length > 0 && ` · ${order.items.length} item${order.items.length !== 1 ? 's' : ''}`}
                </p>
                {order.confirmed_total_paise && (
                  <p className="text-sm font-bold text-brand-red mt-0.5">
                    {formatINR(order.confirmed_total_paise)}
                  </p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-text-light flex-shrink-0" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
