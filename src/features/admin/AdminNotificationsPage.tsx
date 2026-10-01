import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Send, CheckCircle, Package, Tag, AlertCircle, Megaphone, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { broadcastAdminAnnouncement } from '@/lib/notifications'
import toast from 'react-hot-toast'
import type { Product } from '@/lib/types'

export default function AdminNotificationsPage() {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState<'general' | 'product' | 'price' | 'stock'>('product')
  const [selectedProductId, setSelectedProductId] = useState('')

  // Fetch products for linking
  const { data: products = [] } = useQuery<Array<{ id: string; name: string; sku: string }>>({
    queryKey: ['admin-products-selector'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, sku')
        .eq('is_published', true)
        .order('name')
      return data ?? []
    },
  })

  // Fetch recent notifications sent across the system
  const { data: recentNotifications = [], isLoading } = useQuery({
    queryKey: ['admin-notifications-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(25)
      if (error) throw error

      // Deduplicate by title & created_at (minute) to show unique broadcasts
      const uniqueMap = new Map<string, any>()
      for (const item of (data || [])) {
        const key = `${item.title}-${item.created_at?.slice(0, 16)}`
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, item)
        }
      }
      return Array.from(uniqueMap.values())
    },
  })

  const sendBroadcast = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error('Notification title is required')
      if (!message.trim()) throw new Error('Notification message is required')

      const linkUrl = selectedProductId ? `/app/product/${selectedProductId}` : '/app'
      const res = await broadcastAdminAnnouncement({
        title,
        message,
        type,
        linkUrl,
      })
      return res
    },
    onSuccess: (data) => {
      toast.success(`Announcement broadcasted to ${data.count} customer accounts!`)
      setTitle('')
      setMessage('')
      setSelectedProductId('')
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-history'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in max-w-5xl">
      <div>
        <h1 className="text-2xl font-display font-semibold text-brand-blue flex items-center gap-2">
          <Bell className="w-6 h-6 text-brand-red" />
          Customer Notifications & Broadcasts
        </h1>
        <p className="text-text-muted text-sm mt-0.5">
          Push new product arrivals, rate revisions, stock alerts and wholesale notices to all buyer accounts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Broadcast Form */}
        <div className="lg:col-span-3 card bg-white border-surface-border p-5 space-y-4">
          <h2 className="text-base font-semibold text-brand-blue flex items-center gap-2 border-b border-surface-border pb-3">
            <Megaphone className="w-4 h-4 text-brand-pink" />
            Send New Broadcast Notification
          </h2>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendBroadcast.mutate()
            }}
            className="space-y-4"
          >
            {/* Notification Type */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Announcement Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: 'product', label: 'New Arrival', icon: Package },
                  { value: 'price', label: 'Price Update', icon: Tag },
                  { value: 'stock', label: 'Stock Alert', icon: AlertCircle },
                  { value: 'general', label: 'General Notice', icon: Megaphone },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.value}
                    onClick={() => setType(item.value as any)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      type === item.value
                        ? 'bg-brand-red/20 text-brand-pink border-brand-red'
                        : 'bg-white text-text-muted border-surface-border hover:border-text-light'
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Notification Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New Arrival: 7 Mukhi Nepali Rudraksha Mala"
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-white text-text-main placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-brand-red"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Message Description *</label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Fresh stock of natural certified Nepali beads just arrived. Minimum order starts at 10 pcs."
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-white text-text-main placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-brand-red"
              />
            </div>

            {/* Product Link (Optional) */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                Attach Catalogue Product (Optional)
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-white text-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-red"
              >
                <option value="">No product link (directs to home)</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-text-muted mt-1">
                When a customer clicks the notification, it directly opens this product details page.
              </p>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={sendBroadcast.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {sendBroadcast.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Broadcasting…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Broadcast to All Customers
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Recent Broadcasts List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card bg-white border-surface-border p-5">
            <h2 className="text-base font-semibold text-brand-blue mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Recent Announcements
            </h2>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-16 rounded-xl bg-white" />
                ))}
              </div>
            ) : recentNotifications.length === 0 ? (
              <p className="text-sm text-text-muted py-6 text-center">No announcements broadcasted yet.</p>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {recentNotifications.map((notif: any) => (
                  <div key={notif.id} className="p-3 rounded-xl bg-surface-bg border border-surface-border/80 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-brand-blue line-clamp-1">{notif.title}</span>
                      <span className="badge badge-brand-yellow text-[9px] uppercase">{notif.type}</span>
                    </div>
                    <p className="text-xs text-text-muted line-clamp-2">{notif.message}</p>
                    <p className="text-[10px] text-text-muted pt-1">
                      Sent {formatDate(notif.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
