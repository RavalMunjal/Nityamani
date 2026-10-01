import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, User, Clock, Mail, Phone, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useState } from 'react'
import type { Profile, AccountStatus } from '@/lib/types'

export default function AdminCustomersPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<AccountStatus | 'all'>('all')

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['admin-customers', statusFilter],
    queryFn: async () => {
      let q = supabase
        .from('profiles')
        .select('*, business_profiles(*)')
        .eq('role', 'customer')
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') q = q.eq('status', statusFilter)

      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AccountStatus }) => {
      const { error } = await supabase.from('profiles').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })
      toast.success('Customer status updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-brand-blue">Customers</h1>
          <p className="text-text-muted text-sm mt-0.5">{customers.length} result{customers.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {(['all', 'pending', 'active', 'blocked'] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-colors',
              statusFilter === s
                ? 'bg-brand-red/20 text-brand-pink border border-brand-red/30'
                : 'text-text-muted hover:text-brand-blue border border-surface-border')}>
            {s}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="skeleton h-28 rounded-xl bg-white" />)}
        </div>
      )}

      {!isLoading && customers.length === 0 && (
        <div className="text-center py-20 text-text-muted">No customers found</div>
      )}

      <div className="space-y-3">
        {customers.map((customer: any) => {
          const biz = customer.business_profiles?.[0]
          return (
            <div key={customer.id} className="card bg-white border-surface-border p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-red/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-brand-pink">
                      {customer.full_name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-brand-blue text-sm">{customer.full_name}</p>
                    {biz && <p className="text-xs text-brand-pink font-medium">{biz.business_name}</p>}
                    <div className="flex flex-wrap gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <Mail className="w-3 h-3" />{customer.email}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <Phone className="w-3 h-3" />{customer.phone}
                      </span>
                      {biz && (
                        <span className="flex items-center gap-1 text-xs text-text-muted">
                          <MapPin className="w-3 h-3" />{biz.city}, {biz.state}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <Clock className="w-3 h-3" />Joined {formatDate(customer.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn('badge text-[10px]',
                    customer.status === 'active' ? 'badge-green' :
                    customer.status === 'pending' ? 'badge-brand-yellow' : 'badge-red')}>
                    {customer.status}
                  </span>
                  {customer.status === 'pending' && (
                    <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-medium hover:bg-emerald-500/30 transition-colors"
                      onClick={() => updateStatus.mutate({ id: customer.id, status: 'active' })}>
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                  )}
                  {customer.status === 'active' && (
                    <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 text-xs font-medium hover:bg-red-500/30 transition-colors"
                      onClick={() => {
                        if (confirm('Block this customer? They will not be able to access the app.')) {
                          updateStatus.mutate({ id: customer.id, status: 'blocked' })
                        }
                      }}>
                      <XCircle className="w-3.5 h-3.5" /> Block
                    </button>
                  )}
                  {customer.status === 'blocked' && (
                    <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-medium hover:bg-emerald-500/30 transition-colors"
                      onClick={() => updateStatus.mutate({ id: customer.id, status: 'active' })}>
                      <CheckCircle className="w-3.5 h-3.5" /> Unblock
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
