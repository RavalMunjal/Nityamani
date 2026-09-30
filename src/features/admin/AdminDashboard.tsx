import { useQuery } from '@tanstack/react-query'
import {
  Package,
  FolderOpen,
  Users,
  ClipboardList,
  AlertTriangle,
  IndianRupee,
  Clock,
  ExternalLink,
  Plus,
  Bell,
  ArrowUpRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatINR, formatDate, formatOrderId } from '@/lib/utils'
import { Link } from 'react-router-dom'
import type { Product } from '@/lib/types'

const DEFAULT_IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1515082161172-2f3b9c8c9735?q=80&w=400&auto=format&fit=crop'

interface DashboardStats {
  total_products: number
  total_categories: number
  total_orders: number
  total_customers: number
  low_stock_products: number
  new_orders: number
  active_customers: number
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  to,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
  to?: string
}) {
  const card = (
    <div className="card p-5 bg-text-main border-text-main hover:border-text-muted transition-all duration-200 shadow-lg group">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {to && (
          <ArrowUpRight className="w-4 h-4 text-text-light group-hover:text-white transition-colors" />
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-text-light mt-1 font-medium">{label}</p>
    </div>
  )

  return to ? <Link to={to}>{card}</Link> : card
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const [
        prods,
        cats,
        orders,
        customers,
        lowStock,
        newOrders,
        activeCustomers,
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_archived', false),
        supabase.from('categories').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
        supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .lt('available', 15)
          .eq('is_published', true)
          .eq('is_archived', false),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('fulfilment_status', 'requested'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer').eq('status', 'active'),
      ])

      return {
        total_products: prods.count ?? 0,
        total_categories: cats.count ?? 0,
        total_orders: orders.count ?? 0,
        total_customers: customers.count ?? 0,
        low_stock_products: lowStock.count ?? 0,
        new_orders: newOrders.count ?? 0,
        active_customers: activeCustomers.count ?? 0,
      }
    },
    refetchInterval: 30_000,
  })

  // Recent Orders query
  const { data: recentOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, fulfilment_status, created_at, confirmed_total_paise, profiles(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(6)
      if (error) throw error
      return data ?? []
    },
  })

  // Recently Added Products query
  const { data: recentProducts = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['admin-recent-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, images:product_images(*), category:categories(name)')
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(6)
      if (error) throw error
      return data ?? []
    },
  })

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-white">Admin Dashboard</h1>
          <p className="text-text-light text-sm mt-0.5">
            Real-time wholesale operations, orders, and catalogue intelligence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/products" className="btn-primary btn-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Product
          </Link>
          <Link to="/admin/notifications" className="btn-outline btn-sm flex items-center gap-1.5 text-xs text-white">
            <Bell className="w-3.5 h-3.5" /> Broadcast Notice
          </Link>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          label="Total Products"
          value={statsLoading ? '…' : stats?.total_products ?? 0}
          color="bg-brand-red/20 text-brand-pink"
          to="/admin/products"
        />
        <StatCard
          icon={FolderOpen}
          label="Active Categories"
          value={statsLoading ? '…' : stats?.total_categories ?? 0}
          color="bg-blue-500/20 text-blue-400"
          to="/admin/categories"
        />
        <StatCard
          icon={ClipboardList}
          label="Total Wholesale Orders"
          value={statsLoading ? '…' : stats?.total_orders ?? 0}
          color="bg-emerald-500/20 text-emerald-400"
          to="/admin/orders"
        />
        <StatCard
          icon={Users}
          label="Buyer Accounts"
          value={statsLoading ? '…' : stats?.total_customers ?? 0}
          color="bg-purple-500/20 text-purple-400"
          to="/admin/customers"
        />
      </div>

      {/* Alerts Row */}
      {((stats?.new_orders ?? 0) > 0 || (stats?.low_stock_products ?? 0) > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(stats?.new_orders ?? 0) > 0 && (
            <Link
              to="/admin/orders"
              className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 hover:border-amber-400/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-amber-300 text-sm">
                    {stats?.new_orders} New Order Request{stats?.new_orders !== 1 ? 's' : ''}
                  </p>
                  <p className="text-amber-400/70 text-xs">Awaiting quotation and dispatch confirmation</p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-amber-400" />
            </Link>
          )}

          {(stats?.low_stock_products ?? 0) > 0 && (
            <Link
              to="/admin/products"
              className="flex items-center justify-between p-4 rounded-2xl bg-red-500/10 border border-red-500/30 hover:border-red-400/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-red-300 text-sm">
                    {stats?.low_stock_products} Low Stock Item{stats?.low_stock_products !== 1 ? 's' : ''}
                  </p>
                  <p className="text-red-400/70 text-xs">Inventory available below reorder threshold</p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-red-400" />
            </Link>
          )}
        </div>
      )}

      {/* Two columns: Recent Orders & Recently Added Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card bg-text-main border-text-main p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-text-main pb-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-emerald-400" />
              Recent Wholesale Orders
            </h2>
            <Link to="/admin/orders" className="text-xs text-brand-pink hover:underline">
              View all
            </Link>
          </div>

          {ordersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-16 rounded-xl bg-text-main" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8 text-text-light text-xs">No orders recorded yet</div>
          ) : (
            <div className="divide-y divide-text-main/70">
              {recentOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-text-main/40 transition-colors px-2 rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">
                        {formatOrderId(order.id)}
                      </span>
                      <span className="badge badge-brand-yellow text-[9px] uppercase">
                        {order.fulfilment_status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-text-light mt-0.5">
                      {order.profiles?.full_name || 'Buyer'} · {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    {order.confirmed_total_paise && (
                      <p className="text-xs font-bold text-brand-pink">
                        {formatINR(order.confirmed_total_paise)}
                      </p>
                    )}
                    <Link
                      to="/admin/orders"
                      className="text-[11px] text-text-light hover:text-white flex items-center justify-end gap-1 mt-0.5"
                    >
                      Manage <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Added Products */}
        <div className="card bg-text-main border-text-main p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-text-main pb-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-brand-pink" />
              Recently Added Products
            </h2>
            <Link to="/admin/products" className="text-xs text-brand-pink hover:underline">
              View catalogue
            </Link>
          </div>

          {productsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-16 rounded-xl bg-text-main" />
              ))}
            </div>
          ) : recentProducts.length === 0 ? (
            <div className="text-center py-8 text-text-light text-xs">No products added yet</div>
          ) : (
            <div className="divide-y divide-text-main/70">
              {recentProducts.map((p) => {
                const img =
                  p.images?.find((i: any) => i.is_primary)?.url ||
                  p.images?.[0]?.url ||
                  DEFAULT_IMAGE_FALLBACK

                return (
                  <div
                    key={p.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-text-main/40 transition-colors px-2 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/40 border border-text-main flex-shrink-0">
                        <img
                          src={img}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_IMAGE_FALLBACK
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate max-w-[180px]">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-text-muted">
                          {p.sku} · {formatINR(p.price_paise)} / {p.selling_unit}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span
                        className={`badge text-[9px] font-semibold ${
                          p.is_published ? 'badge-green' : 'badge-gray'
                        }`}
                      >
                        {p.is_published ? 'Published' : 'Draft'}
                      </span>
                      <p className="text-[10px] text-text-light mt-0.5">
                        {p.available} in stock
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
