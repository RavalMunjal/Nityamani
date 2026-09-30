import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Package, Tag, AlertCircle, Megaphone, Clock, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/features/auth/AuthContext'
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/notifications'
import toast from 'react-hot-toast'
import { useState } from 'react'

export default function CustomerNotificationsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const { data: notifications = [], isLoading, error, refetch } = useQuery({
    queryKey: ['customer-notifications', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await markNotificationAsRead(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) return
      await markAllNotificationsAsRead(user.id)
    },
    onSuccess: () => {
      toast.success('All notifications marked as read')
      queryClient.invalidateQueries({ queryKey: ['customer-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })

  const handleClickNotification = async (notif: any) => {
    if (!notif.is_read) {
      await markReadMutation.mutateAsync(notif.id)
    }
    if (notif.link_url) {
      navigate(notif.link_url)
    }
  }

  const unreadCount = notifications.filter((n: any) => !n.is_read).length
  const displayedNotifications = filter === 'unread'
    ? notifications.filter((n: any) => !n.is_read)
    : notifications

  const getIcon = (type: string) => {
    switch (type) {
      case 'product':
        return Package
      case 'price':
        return Tag
      case 'stock':
        return AlertCircle
      default:
        return Megaphone
    }
  }

  return (
    <div className="page-container py-6 max-w-3xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-surface-border pb-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-main flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand-red" />
            Notifications
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            New arrivals, direct rate revisions, and wholesale announcements
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="btn-outline btn-sm flex items-center gap-1.5 text-xs"
          >
            <CheckCheck className="w-4 h-4 text-brand-red" />
            Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'all'
              ? 'bg-brand-red text-white'
              : 'bg-white text-text-muted border border-surface-border hover:bg-surface-bg'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'unread'
              ? 'bg-brand-red text-white'
              : 'bg-white text-text-muted border border-surface-border hover:bg-surface-bg'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="card p-8 text-center bg-white space-y-3">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <p className="text-base font-semibold text-text-main">Unable to load notifications</p>
          <button onClick={() => refetch()} className="btn-primary btn-sm mx-auto">
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && displayedNotifications.length === 0 && (
        <div className="card p-12 text-center bg-white space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-brand-yellow/30 text-brand-red flex items-center justify-center mx-auto">
            <Bell className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-text-main">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            When new products or wholesale notices are published by the Nityamani team, they will appear here.
          </p>
        </div>
      )}

      {/* Notifications list */}
      {!isLoading && !error && displayedNotifications.length > 0 && (
        <div className="space-y-3">
          {displayedNotifications.map((n: any) => {
            const Icon = getIcon(n.type)
            return (
              <div
                key={n.id}
                onClick={() => handleClickNotification(n)}
                className={`card p-4 transition-all duration-200 cursor-pointer flex items-start gap-4 border ${
                  n.is_read
                    ? 'bg-white hover:border-text-muted border-surface-border'
                    : 'bg-gradient-to-r from-brand-yellow/10 to-white border-brand-red/30 shadow-sm hover:border-brand-red'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    n.is_read
                      ? 'bg-surface-bg text-text-muted'
                      : 'bg-brand-yellow text-brand-red shadow-sm'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-sm ${
                          n.is_read ? 'font-medium text-text-main' : 'font-bold text-text-main'
                        }`}
                      >
                        {n.title}
                      </h3>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-brand-red shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] text-text-light whitespace-nowrap flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(n.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-text-muted mt-1 leading-relaxed line-clamp-2">
                    {n.message}
                  </p>

                  {n.link_url && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-brand-red hover:underline">
                      <span>View details</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
