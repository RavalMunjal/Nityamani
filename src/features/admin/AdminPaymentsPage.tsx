import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCard, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatINR, formatDate, cn } from '@/lib/utils'
import type { Payment, Order } from '@/lib/types'
import toast from 'react-hot-toast'

export default function AdminPaymentsPage() {
  const queryClient = useQueryClient()

  // Fetch payments
  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data as Payment[]) ?? []
    },
  })

  // Fetch orders with pending payments
  const { data: unpaidOrders = [] } = useQuery<Order[]>({
    queryKey: ['admin-unpaid-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, customer:profiles(*)')
        .in('payment_status', ['unpaid', 'partially_paid'])
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data as Order[]) ?? []
    },
  })

  const markOrderPaid = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          fulfilment_status: 'processing',
          outstanding_paise: 0,
        })
        .eq('id', orderId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Payment verified! Order moved to processing.')
      queryClient.invalidateQueries({ queryKey: ['admin-unpaid-orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Payment Verification</h1>
        <p className="text-sm text-text-light">
          Verify NEFT, RTGS & UPI manual payment proofs against wholesale invoices
        </p>
      </div>

      {/* Orders awaiting verification */}
      <div className="bg-text-main border border-text-main rounded-2xl p-5 shadow-xl">
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-red" /> Awaiting Payment Confirmation ({unpaidOrders.length})
        </h2>

        {isLoading ? (
          <p className="text-sm text-text-muted py-4">Loading unpaid orders...</p>
        ) : unpaidOrders.length === 0 ? (
          <p className="text-xs text-text-muted py-4">All active orders have been paid in full.</p>
        ) : (
          <div className="divide-y divide-text-main">
            {unpaidOrders.map(order => (
              <div
                key={order.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-brand-pink font-semibold">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="badge badge-brand-yellow text-[10px] capitalize">
                      {order.payment_status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white mt-1">
                    {order.customer?.full_name || 'Buyer'}
                  </p>
                  <p className="text-xs text-text-light">
                    Payable: {formatINR(order.confirmed_total_paise || order.outstanding_paise)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => markOrderPaid.mutate(order.id)}
                    disabled={markOrderPaid.isPending}
                    className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mark as Paid (Verified)
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment log */}
      <div className="bg-text-main border border-text-main rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-text-main flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brand-red" /> Payment Proof Log
          </h2>
          <span className="text-xs text-text-muted">{payments.length} transactions</span>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-sm">
            No bank transfers or payment slips logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-text-main/60 border-b border-text-main text-text-light text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">Order ID</th>
                  <th className="px-6 py-3">Method</th>
                  <th className="px-6 py-3">Reference / UTR</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-text-main text-text-light">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-text-main/40 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-xs text-brand-pink">
                      #{p.order_id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-3.5 text-xs capitalize">{p.payment_method}</td>
                    <td className="px-6 py-3.5 font-mono text-xs text-text-light">
                      {p.reference_number || 'N/A'}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-bold text-white">
                      {formatINR(p.amount_paise)}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={cn(
                          'badge text-[10px] capitalize',
                          p.status === 'verified'
                            ? 'badge-green'
                            : p.status === 'rejected'
                            ? 'badge-red'
                            : 'badge-brand-yellow'
                        )}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-text-muted">
                      {formatDate(p.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
