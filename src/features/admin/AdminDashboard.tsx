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
  ArrowRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatINR, formatDate, formatOrderId } from '@/lib/utils'
import { Link } from 'react-router-dom'
import type { Product } from '@/lib/types'

const DEFAULT_IMAGE_FALLBACK = '/nityamani-logo-rounded.png'

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
  iconColor,
  iconBg,
  to,
  isLoading,
  isError,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  iconColor: string
  iconBg: string
  to?: string
  isLoading?: boolean
  isError?: boolean
}) {
  const card = (
    <div className="bg-white border border-surface-border rounded-2xl p-5 hover:border-brand-blue/20 transition-all duration-200 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] group h-full flex flex-col justify-between relative overflow-hidden">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {to && (
          <ArrowUpRight className="w-4 h-4 text-text-muted group-hover:text-brand-pink transition-colors" />
        )}
      </div>
      <div>
        {isLoading ? (
          <div className="h-9 w-16 bg-surface-bg rounded-lg animate-pulse mb-1"></div>
        ) : isError ? (
          <p className="text-xl font-bold text-red-500 tracking-tight">Error</p>
        ) : (
          <p className="text-3xl font-extrabold text-brand-blue tracking-tight">{value}</p>
        )}
        <p className="text-xs font-semibold text-text-muted mt-1 uppercase tracking-wide">{label}</p>
      </div>
      {/* Decorative gradient blur */}
      <div className={`absolute -bottom-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20 ${iconBg} transition-opacity group-hover:opacity-40 pointer-events-none`}></div>
    </div>
  )

  return to ? <Link to={to} className="block h-full">{card}</Link> : card
}

function OrderStatusBadge({ status }: { status: string }) {
  let colorClass = 'bg-gray-100 text-gray-600 border-gray-200'
  
  switch(status.toLowerCase()) {
    case 'requested':
      colorClass = 'bg-brand-yellow/20 text-yellow-700 border-brand-yellow/30'
      break
    case 'confirmed':
      colorClass = 'bg-blue-100 text-blue-700 border-blue-200'
      break
    case 'processing':
      colorClass = 'bg-purple-100 text-purple-700 border-purple-200'
      break
    case 'shipped':
      colorClass = 'bg-indigo-100 text-indigo-700 border-indigo-200'
      break
    case 'delivered':
      colorClass = 'bg-green-100 text-green-700 border-green-200'
      break
    case 'cancelled':
      colorClass = 'bg-red-100 text-red-700 border-red-200'
      break
  }

  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${colorClass}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
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
    <div className="space-y-6 animate-fade-in">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-brand-blue">Business Overview</h2>
          <p className="text-sm text-text-muted mt-1">Monitor wholesale activity and catalogue performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/notifications" className="px-4 py-2 bg-white border border-surface-border hover:bg-surface-bg hover:border-brand-blue/20 text-brand-blue text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Broadcast Notice</span>
          </Link>
          <Link to="/admin/products" className="px-4 py-2 bg-brand-pink hover:bg-brand-red text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Alerts Row */}
      {((stats?.new_orders ?? 0) > 0 || (stats?.low_stock_products ?? 0) > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(stats?.new_orders ?? 0) > 0 && (
            <Link
              to="/admin/orders"
              className="flex items-center justify-between p-4 rounded-2xl bg-brand-yellow/20 border border-brand-yellow/40 hover:bg-brand-yellow/30 transition-colors shadow-sm group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-brand-yellow/40 text-yellow-800 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-yellow-900 text-sm">
                    {stats?.new_orders} New Order Request{stats?.new_orders !== 1 ? 's' : ''}
                  </p>
                  <p className="text-yellow-800/80 text-xs font-medium">Awaiting quotation and dispatch confirmation</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-yellow-800 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}

          {(stats?.low_stock_products ?? 0) > 0 && (
            <Link
              to="/admin/products"
              className="flex items-center justify-between p-4 rounded-2xl bg-red-50 border border-red-100 hover:bg-red-100 transition-colors shadow-sm group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-red-900 text-sm">
                    {stats?.low_stock_products} Low Stock Item{stats?.low_stock_products !== 1 ? 's' : ''}
                  </p>
                  <p className="text-red-700/80 text-xs font-medium">Inventory available below reorder threshold</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-red-600 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          icon={Package}
          label="Total Products"
          value={stats?.total_products ?? 0}
          isLoading={statsLoading}
          iconColor="text-brand-pink"
          iconBg="bg-brand-pink/10"
          to="/admin/products"
        />
        <StatCard
          icon={FolderOpen}
          label="Active Categories"
          value={stats?.total_categories ?? 0}
          isLoading={statsLoading}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          to="/admin/categories"
        />
        <StatCard
          icon={ClipboardList}
          label="Wholesale Orders"
          value={stats?.total_orders ?? 0}
          isLoading={statsLoading}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          to="/admin/orders"
        />
        <StatCard
          icon={Users}
          label="Customers"
          value={stats?.total_customers ?? 0}
          isLoading={statsLoading}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
          to="/admin/customers"
        />
      </div>

      {/* Two columns: Recent Orders & Recently Added Products */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white border border-surface-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-surface-border flex items-center justify-between bg-white">
            <h3 className="text-base font-extrabold text-brand-blue flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-500" />
              Recent Orders
            </h3>
            <Link to="/admin/orders" className="text-xs font-bold text-brand-pink hover:text-brand-red flex items-center gap-1 transition-colors">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 bg-white p-2">
            {ordersLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse h-12 rounded-lg bg-surface-bg" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-12 text-text-muted text-sm font-medium">No wholesale orders recorded yet.</div>
            ) : (
              <div className="divide-y divide-surface-border/50">
                {recentOrders.map((order: any) => (
                  <div key={order.id} className="p-3 flex items-center justify-between hover:bg-surface-bg rounded-xl transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-surface-border flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold text-text-muted">ORD</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-sm font-bold text-brand-blue">
                            {formatOrderId(order.id)}
                          </span>
                          <OrderStatusBadge status={order.fulfilment_status} />
                        </div>
                        <p className="text-xs font-semibold text-text-muted mt-0.5">
                          {order.profiles?.full_name || 'Buyer'} · {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right flex items-center gap-4">
                      {order.confirmed_total_paise ? (
                        <p className="text-sm font-bold text-brand-blue">
                          {formatINR(order.confirmed_total_paise)}
                        </p>
                      ) : (
                        <p className="text-xs font-semibold text-text-muted">Pending quote</p>
                      )}
                      
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="px-3 py-1.5 bg-white border border-surface-border rounded-lg text-xs font-bold text-brand-blue hover:border-brand-blue/30 hover:bg-surface-bg transition-colors shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recently Added Products */}
        <div className="bg-white border border-surface-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-surface-border flex items-center justify-between bg-white">
            <h3 className="text-base font-extrabold text-brand-blue flex items-center gap-2">
              <Package className="w-5 h-5 text-brand-pink" />
              Recent Products
            </h3>
            <Link to="/admin/products" className="text-xs font-bold text-brand-pink hover:text-brand-red flex items-center gap-1 transition-colors">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 bg-white p-2">
            {productsLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse h-12 rounded-lg bg-surface-bg" />
                ))}
              </div>
            ) : recentProducts.length === 0 ? (
              <div className="text-center py-12 text-text-muted text-sm font-medium">No products in catalogue yet.</div>
            ) : (
              <div className="divide-y divide-surface-border/50">
                {recentProducts.map((p) => {
                  const img = p.images?.find((i: any) => i.is_primary)?.url || p.images?.[0]?.url || DEFAULT_IMAGE_FALLBACK
                  
                  return (
                    <div key={p.id} className="p-3 flex items-center justify-between hover:bg-surface-bg rounded-xl transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg border border-surface-border bg-white flex-shrink-0 overflow-hidden shadow-sm p-0.5">
                          <img
                            src={img}
                            alt={p.name}
                            className="w-full h-full object-contain rounded-md bg-white"
                            onError={(e) => { e.currentTarget.src = DEFAULT_IMAGE_FALLBACK }}
                          />
                        </div>
                        <div className="min-w-0 pr-4">
                          <p className="text-sm font-bold text-brand-blue truncate" title={p.name}>
                            {p.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] font-mono font-semibold text-text-muted bg-surface-border px-1.5 py-0.5 rounded">{p.sku}</span>
                            <span className="text-[11px] font-bold text-text-light">•</span>
                            <span className="text-[11px] font-bold text-brand-pink">{formatINR(p.price_paise)} <span className="text-text-muted">/ {p.selling_unit}</span></span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-4 flex-shrink-0">
                        <div className="hidden sm:block text-right">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${p.is_published ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            {p.is_published ? 'Published' : 'Draft'}
                          </span>
                          <p className="text-[11px] font-semibold text-text-muted mt-1">
                            {p.available} in stock
                          </p>
                        </div>
                        
                        <Link
                          to={`/admin/products/edit/${p.id}`}
                          className="px-3 py-1.5 bg-white border border-surface-border rounded-lg text-xs font-bold text-brand-blue hover:border-brand-blue/30 hover:bg-surface-bg transition-colors shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
