import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Package,
  Search,
  CheckCircle,
  Clock,
  MapPin,
  Building,
  Phone,
  Mail,
  X,
  Eye,
  ChevronRight,
  Filter,
  CreditCard,
} from 'lucide-react'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate, formatOrderId, formatINR, cn, FALLBACK_IMAGE } from '@/lib/utils'
import type { OrderFulfilmentStatus, Order } from '@/lib/types'
import toast from 'react-hot-toast'

const STATUSES: { value: OrderFulfilmentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Orders' },
  { value: 'requested', label: 'New / Requested' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'processing', label: 'Processing' },
  { value: 'dispatched', label: 'Dispatched / Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const STATUS_COLORS: Record<string, string> = {
  requested: 'badge-brand-yellow',
  under_review: 'badge-blue',
  processing: 'badge-blue',
  ready: 'badge-green',
  dispatched: 'badge-purple',
  delivered: 'badge-green',
  cancelled: 'badge-red',
  expired: 'badge-gray',
}

export default function AdminOrdersPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<OrderFulfilmentStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: async () => {
      let q = supabase
        .from('orders')
        .select('*, profiles(full_name, email, phone), items:order_items(*, product:products(images:product_images(url, is_primary))), payment:payments(payment_method, status)')
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') q = q.eq('fulfilment_status', statusFilter)

      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderFulfilmentStatus }) => {
      const { error } = await supabase
        .from('orders')
        .update({
          fulfilment_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })
      if (selectedOrder && selectedOrder.id === vars.id) {
        setSelectedOrder((prev: any) => ({ ...prev, fulfilment_status: vars.status }))
      }
      toast.success('Order status updated!')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const filtered = orders.filter((o: any) => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      o.id.toLowerCase().includes(term) ||
      o.profiles?.full_name?.toLowerCase().includes(term) ||
      o.profiles?.email?.toLowerCase().includes(term) ||
      o.profiles?.phone?.toLowerCase().includes(term)
    )
  })

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-brand-blue flex items-center gap-2">
            <Package className="w-6 h-6 text-brand-red" />
            Wholesale Orders
          </h1>
          <p className="text-text-muted text-sm mt-0.5">
            {filtered.length} order{filtered.length !== 1 ? 's' : ''} recorded in database
          </p>
        </div>
      </div>

      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors',
                statusFilter === s.value
                  ? 'bg-brand-red/20 text-brand-pink border border-brand-red/40'
                  : 'text-text-muted hover:text-brand-blue border border-surface-border'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-surface-border text-xs text-text-main placeholder-text-muted focus:ring-1 focus:ring-brand-red"
            placeholder="Search by buyer, phone, email, order ID…"
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl bg-white" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div className="card bg-white border-surface-border p-16 text-center">
          <Package className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-brand-blue font-medium text-base">No orders found</p>
          <p className="text-text-muted text-xs mt-1">
            {search ? 'Try clearing your search query' : 'New buyer orders will appear here automatically.'}
          </p>
        </div>
      )}

      {/* Orders List */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((order: any) => {
            const orderTotalPaise =
              order.confirmed_total_paise ||
              order.items?.reduce((sum: number, it: any) => sum + (it.total_paise || 0), 0) ||
              0

            return (
              <div
                key={order.id}
                className="card bg-white border-surface-border p-5 hover:border-surface-border transition-all duration-200 shadow-lg"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Left: Order Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-brand-red/20 text-brand-pink flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-brand-blue text-sm">
                          {formatOrderId(order.id)}
                        </span>
                        <span
                          className={cn(
                            'badge text-[10px] font-semibold uppercase',
                            STATUS_COLORS[order.fulfilment_status] ?? 'badge-gray'
                          )}
                        >
                          {order.fulfilment_status?.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap">
                        <span className="text-brand-blue font-medium">
                          {order.profiles?.full_name || 'Valued Customer'}
                        </span>
                        <span>·</span>
                        <span>{order.profiles?.email}</span>
                        <span>·</span>
                        <span>{formatDate(order.created_at)}</span>
                      </div>

                      <p className="text-xs text-text-muted mt-1">
                        {order.items?.length || 0} product item{order.items?.length !== 1 ? 's' : ''}{' '}
                        ordered
                      </p>
                      {order.payment?.[0] && (
                        <p className="text-xs font-semibold text-brand-navy mt-1 inline-flex items-center gap-1 bg-brand-yellow/20 px-2 py-0.5 rounded-md">
                          <CreditCard className="w-3 h-3" /> 
                          {order.payment[0].payment_method.toUpperCase().replace('_', ' ')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Total & Action Controls */}
                  <div className="flex items-center gap-4 ml-auto">
                    <div className="text-right">
                      <p className="text-[11px] text-text-muted">Order Total</p>
                      <p className="text-base font-bold text-brand-pink">
                        {formatINR(orderTotalPaise)}
                      </p>
                    </div>

                    {/* Quick Status Select */}
                    <select
                      value={order.fulfilment_status}
                      onChange={(e) =>
                        updateStatus.mutate({
                          id: order.id,
                          status: e.target.value as OrderFulfilmentStatus,
                        })
                      }
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-surface-border text-brand-blue focus:ring-1 focus:ring-brand-red"
                    >
                      <option value="requested">New / Requested</option>
                      <option value="under_review">Under Review</option>
                      <option value="processing">Processing</option>
                      <option value="dispatched">Dispatched</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="btn-outline btn-sm flex items-center gap-1.5 text-xs text-brand-blue"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Order Details Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-surface-border max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-surface-border flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-brand-blue flex items-center gap-2">
                  <span>Order {formatOrderId(selectedOrder.id)}</span>
                  <span
                    className={cn(
                      'badge text-[10px] uppercase',
                      STATUS_COLORS[selectedOrder.fulfilment_status] ?? 'badge-gray'
                    )}
                  >
                    {selectedOrder.fulfilment_status?.replace(/_/g, ' ')}
                  </span>
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Placed on {formatDate(selectedOrder.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-text-muted hover:text-brand-blue p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* Customer Profile & Delivery Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface-bg border border-surface-border space-y-2">
                  <p className="font-semibold text-brand-blue flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-brand-pink" /> Buyer Information
                  </p>
                  <p className="text-text-muted font-medium">
                    {selectedOrder.profiles?.full_name || 'Customer'}
                  </p>
                  <p className="text-text-muted">{selectedOrder.profiles?.email}</p>
                  {selectedOrder.profiles?.phone && (
                    <p className="text-text-muted flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {selectedOrder.profiles.phone}
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-surface-bg border border-surface-border space-y-2">
                  <p className="font-semibold text-brand-blue flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Delivery Details
                  </p>
                  <p className="text-text-muted">
                    {selectedOrder.shipping_address_snapshot?.recipient_name ||
                      selectedOrder.billing_address_snapshot?.recipient_name ||
                      selectedOrder.profiles?.full_name}
                  </p>
                  <p className="text-text-muted">
                    {selectedOrder.shipping_address_snapshot?.line1 ||
                      selectedOrder.billing_address_snapshot?.billing_address ||
                      selectedOrder.billing_address_snapshot?.line1 ||
                      'Surat Central Depot delivery'}
                  </p>
                  <p className="text-text-muted">
                    {(selectedOrder.shipping_address_snapshot?.city ||
                      selectedOrder.billing_address_snapshot?.city) &&
                      `${selectedOrder.shipping_address_snapshot?.city || selectedOrder.billing_address_snapshot?.city}, ${
                        selectedOrder.shipping_address_snapshot?.state ||
                        selectedOrder.billing_address_snapshot?.state ||
                        ''
                      } ${
                        selectedOrder.shipping_address_snapshot?.pin_code ||
                        selectedOrder.billing_address_snapshot?.pin_code ||
                        ''
                      }`}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-surface-bg border border-surface-border space-y-2">
                  <p className="font-semibold text-brand-blue flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-brand-blue" /> Payment Details
                  </p>
                  <p className="text-text-muted capitalize">
                    Method: {selectedOrder.payment?.[0]?.payment_method?.replace('_', ' ') || 'Unknown'}
                  </p>
                  <p className="text-text-muted capitalize">
                    Status: {selectedOrder.payment?.[0]?.status || selectedOrder.payment_status}
                  </p>
                </div>
              </div>

              {/* Order Items Table with Captured Price */}
              <div className="space-y-3">
                <p className="font-semibold text-brand-blue">
                  Order Items ({selectedOrder.items?.length || 0})
                </p>

                <div className="divide-y divide-text-main/70 border border-surface-border rounded-xl overflow-hidden bg-surface-bg/50">
                  {selectedOrder.items?.map((item: any) => {
                    const product = item.product || {}
                    const images = Array.isArray(product.images) ? product.images : []
                    const primaryImg = images.find((i: any) => i.is_primary) ?? images[0]

                    return (
                      <div
                        key={item.id}
                        className="p-3.5 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-md bg-white flex-shrink-0 border border-surface-border overflow-hidden">
                            <img 
                              src={primaryImg?.url || FALLBACK_IMAGE} 
                              alt={item.product_name_snapshot} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-brand-blue text-sm line-clamp-1">
                              {item.product_name_snapshot}
                            </p>
                            <p className="text-text-muted text-[11px] mt-0.5">
                              SKU: {item.sku_snapshot} · Unit: {item.unit_snapshot} · Qty: {item.quantity}
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-text-muted">
                            {formatINR(item.unit_price_paise)} each
                          </p>
                          <p className="text-sm font-bold text-brand-pink">
                            {formatINR(item.total_paise)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Totals Summary */}
              <div className="p-4 rounded-xl bg-brand-red/10 border border-brand-red/30 flex items-center justify-between">
                <div>
                  <span className="text-xs text-text-muted">Total Confirmed Wholesale Value</span>
                  <p className="text-xs text-text-muted">Historical price captured at checkout</p>
                </div>
                <span className="text-xl font-bold text-brand-pink">
                  {formatINR(
                    selectedOrder.confirmed_total_paise ||
                      selectedOrder.items?.reduce(
                        (sum: number, it: any) => sum + (it.total_paise || 0),
                        0
                      ) ||
                      0
                  )}
                </span>
              </div>

              {/* Status Update Control in Modal */}
              <div className="pt-2 border-t border-surface-border flex items-center justify-between">
                <span className="font-medium text-text-muted">Update Order Status:</span>
                <div className="flex gap-2">
                  {['under_review', 'processing', 'dispatched', 'delivered'].map((st) => (
                    <button
                      key={st}
                      onClick={() =>
                        updateStatus.mutate({
                          id: selectedOrder.id,
                          status: st as OrderFulfilmentStatus,
                        })
                      }
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-text-muted border border-surface-border text-brand-blue capitalize transition-colors"
                    >
                      → {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
