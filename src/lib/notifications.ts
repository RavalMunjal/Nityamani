import { supabase } from '@/lib/supabase'

export async function broadcastNewProductNotification(product: { id: string; name: string }) {
  try {
    // 1. Fetch all customer profiles
    const { data: customers, error: profileErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'customer')

    if (profileErr || !customers || customers.length === 0) return

    const linkUrl = `/app/product/${product.id}`

    // 2. Prevent duplicate notifications for this product
    const { data: existing } = await supabase
      .from('notifications')
      .select('profile_id')
      .eq('link_url', linkUrl)
      .limit(1)

    if (existing && existing.length > 0) {
      // Already notified
      return
    }

    // 3. Insert notification records for all customers
    const rows = customers.map(c => ({
      profile_id: c.id,
      title: `New Arrival: ${product.name}`,
      message: `A new authentic product has been published to the wholesale catalogue. Explore pricing, MOQ & details.`,
      type: 'product',
      link_url: linkUrl,
      is_read: false,
    }))

    await supabase.from('notifications').insert(rows)
  } catch (err) {
    console.error('Failed to broadcast product notification:', err)
  }
}

export async function broadcastAdminAnnouncement({
  title,
  message,
  type = 'general',
  linkUrl,
}: {
  title: string
  message: string
  type?: 'general' | 'product' | 'price' | 'stock'
  linkUrl?: string
}) {
  // Fetch all customer profiles
  const { data: customers, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'customer')

  if (error || !customers || customers.length === 0) return { count: 0 }

  const rows = customers.map(c => ({
    profile_id: c.id,
    title,
    message,
    type,
    link_url: linkUrl || '/app',
    is_read: false,
  }))

  const { error: insertErr } = await supabase.from('notifications').insert(rows)
  if (insertErr) throw insertErr

  return { count: rows.length }
}

export async function markNotificationAsRead(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
  if (error) throw error
}

export async function markAllNotificationsAsRead(profileId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('profile_id', profileId)
  if (error) throw error
}
