import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Send, CheckCircle, Clock, Plus, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatINR, formatDate, cn } from '@/lib/utils'
import type { Quotation, Order } from '@/lib/types'
import toast from 'react-hot-toast'

export default function AdminQuotationsPage() {
  const queryClient = useQueryClient()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [freightPaise, setFreightPaise] = useState<number>(0)
  const [discountPaise, setDiscountPaise] = useState<number>(0)
  const [notes, setNotes] = useState('')

  // Fetch orders that need quotations or have quotations
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['admin-orders-for-quotes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, customer:profiles(*), items:order_items(*)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data as Order[]) ?? []
    },
  })

  // Fetch all existing quotations
  const { data: quotations = [] } = useQuery<Quotation[]>({
    queryKey: ['admin-quotations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data as Quotation[]) ?? []
    },
  })

  const publishQuote = useMutation({
    mutationFn: async (order: Order) => {
      const goodsTotal = order.items?.reduce((sum, it) => sum + (it.total_paise || 0), 0) ?? 0
      const grandTotal = Math.max(0, goodsTotal + freightPaise - discountPaise)
      const quoteNumber = `QT-${Date.now().toString().slice(-6)}`

      const { error } = await supabase.from('quotations').insert({
        order_id: order.id,
        version: 1,
        status: 'published',
        quotation_number: quoteNumber,
        goods_total_paise: goodsTotal,
        freight_paise: freightPaise,
        discount_paise: discountPaise,
        tax_paise: 0,
        grand_total_paise: grandTotal,
        is_freight_confirmed: true,
        notes_to_customer: notes,
        issued_at: new Date().toISOString(),
      })
      if (error) throw error

      // Also update order fulfilment status to awaiting_payment and confirmed_total_paise
      await supabase
        .from('orders')
        .update({
          fulfilment_status: 'awaiting_payment',
          confirmed_total_paise: grandTotal,
          outstanding_paise: grandTotal,
        })
        .eq('id', order.id)
    },
    onSuccess: () => {
      toast.success('Quotation published to customer!')
      queryClient.invalidateQueries({ queryKey: ['admin-quotations'] })
      queryClient.invalidateQueries({ queryKey: ['admin-orders-for-quotes'] })
      setSelectedOrder(null)
      setFreightPaise(0)
      setDiscountPaise(0)
      setNotes('')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Wholesale Quotations</h1>
        <p className="text-sm text-text-light">
          Prepare final freight pricing and send official quotes to buyers
        </p>
      </div>

      {/* Orders requiring quotation */}
      <div className="bg-text-main border border-text-main rounded-2xl p-5 shadow-xl">
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-red" /> Pending Orders for Quotation
        </h2>

        {isLoading ? (
          <p className="text-sm text-text-muted py-4">Loading orders...</p>
        ) : orders.filter(o => o.fulfilment_status === 'requested' || o.fulfilment_status === 'under_review').length === 0 ? (
          <p className="text-xs text-text-muted py-3">No orders currently waiting for quotations.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders
              .filter(o => o.fulfilment_status === 'requested' || o.fulfilment_status === 'under_review')
              .map(order => {
                const goodsTotal = order.items?.reduce((s, it) => s + (it.total_paise || 0), 0) ?? 0
                return (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl bg-text-main/80 border border-text-main flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-brand-pink font-semibold">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="badge badge-brand-yellow text-[10px] capitalize">
                          {order.fulfilment_status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white mt-1">
                        {order.customer?.full_name || 'Wholesale Buyer'}
                      </p>
                      <p className="text-xs text-text-light">
                        {order.items?.length || 0} line item(s) • Subtotal: {formatINR(goodsTotal)}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedOrder(order)
                        setFreightPaise(0)
                        setDiscountPaise(0)
                      }}
                      className="btn-primary text-xs py-2 flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Create & Publish Quote
                    </button>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {/* Active Quotations History */}
      <div className="bg-text-main border border-text-main rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-text-main flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-red" /> Issued Quotations
          </h2>
          <span className="text-xs text-text-muted">{quotations.length} records</span>
        </div>

        {quotations.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-sm">
            No quotations issued yet. When you generate a quote for a buyer order, it will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-text-main/60 border-b border-text-main text-text-light text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">Quote #</th>
                  <th className="px-6 py-3">Goods</th>
                  <th className="px-6 py-3">Freight</th>
                  <th className="px-6 py-3">Grand Total</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-text-main text-text-light">
                {quotations.map(q => (
                  <tr key={q.id} className="hover:bg-text-main/40 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-xs text-brand-pink font-semibold">
                      {q.quotation_number}
                    </td>
                    <td className="px-6 py-3.5 text-xs">{formatINR(q.goods_total_paise)}</td>
                    <td className="px-6 py-3.5 text-xs">
                      {q.freight_paise ? formatINR(q.freight_paise) : 'Free'}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-bold text-white">
                      {formatINR(q.grand_total_paise)}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={cn(
                          'badge text-[10px] capitalize',
                          q.status === 'published' ? 'badge-blue' : 'badge-green'
                        )}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-text-muted">
                      {formatDate(q.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quote Creation Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative w-full max-w-lg bg-text-main rounded-2xl border border-text-main overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-text-main pb-3">
              <h2 className="text-lg font-display font-semibold text-white">Generate Quotation</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-text-light hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-text-main rounded-xl space-y-1 text-xs">
              <p className="text-text-light">
                Customer: <span className="text-white font-medium">{selectedOrder.customer?.full_name}</span>
              </p>
              <p className="text-text-light">
                Goods Subtotal:{' '}
                <span className="text-white font-semibold">
                  {formatINR(selectedOrder.items?.reduce((s, it) => s + (it.total_paise || 0), 0) ?? 0)}
                </span>
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-light mb-1">
                  Freight / Courier Charges (in Paise) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={freightPaise}
                  onChange={e => setFreightPaise(Number(e.target.value))}
                  placeholder="e.g. 25000 for ₹250"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-text-muted bg-text-main text-white focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
                <p className="text-[11px] text-text-muted mt-1">
                  Current preview: {formatINR(freightPaise)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-light mb-1">
                  Wholesale Discount (in Paise)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={discountPaise}
                  onChange={e => setDiscountPaise(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-text-muted bg-text-main text-white focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-light mb-1">
                  Notes for Buyer (dispatch timeline, courier info)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Dispatched via DTDC Air. Delivery in 3-4 working days."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-text-muted bg-text-main text-white focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
              </div>

              <div className="p-3 bg-brand-950/60 border border-brand-blue/40 rounded-xl flex items-center justify-between">
                <span className="text-xs text-text-light font-medium">Grand Total to Buyer:</span>
                <span className="text-base font-bold text-brand-pink">
                  {formatINR(
                    Math.max(
                      0,
                      (selectedOrder.items?.reduce((s, it) => s + (it.total_paise || 0), 0) ?? 0) +
                        freightPaise -
                        discountPaise
                    )
                  )}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="btn-ghost flex-1 text-text-light border border-text-muted hover:border-text-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => publishQuote.mutate(selectedOrder)}
                disabled={publishQuote.isPending}
                className="btn-primary flex-1"
              >
                {publishQuote.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Publishing…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" /> Publish to Buyer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
