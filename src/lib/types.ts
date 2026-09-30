export type UserRole = 'customer' | 'admin'
export type AccountStatus = 'pending' | 'active' | 'blocked'
export type OrderFulfilmentStatus =
  | 'requested'
  | 'under_review'
  | 'awaiting_payment'
  | 'processing'
  | 'ready'
  | 'dispatched'
  | 'delivered'
  | 'cancelled'
  | 'expired'
export type QuotationStatus = 'draft' | 'published' | 'agreed' | 'superseded'
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'overpaid'
export type DocumentState = 'pending' | 'generating' | 'ready' | 'failed'

export interface Profile {
  id: string
  email: string
  full_name: string
  phone: string
  role: UserRole
  status: AccountStatus
  created_at: string
  updated_at: string
}

export interface BusinessProfile {
  id: string
  profile_id: string
  business_name: string
  gst_number: string | null
  billing_address: string
  city: string
  state: string
  pin_code: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

export interface Product {
  id: string
  sku: string
  name: string
  slug: string
  description: string | null
  category_id: string
  category?: Category
  selling_unit: string          // e.g. "bead", "bracelet", "bunch", "packet"
  pack_contents: number | null  // e.g. for "bunch of 50" → 50
  moq: number
  order_increment: number
  price_paise: number           // price in paise (integer, no float math)
  images: ProductImage[]
  is_published: boolean
  is_archived: boolean
  on_hand: number
  reserved: number
  available: number             // on_hand - reserved
  low_stock_threshold: number
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  alt_text: string | null
  display_order: number
  is_primary: boolean
}

export interface CartItem {
  id: string
  cart_id: string
  product_id: string
  product?: Product
  quantity: number
  price_paise_snapshot: number | null
  created_at: string
  updated_at: string
}

export interface Address {
  id: string
  profile_id: string
  label: string
  recipient_name: string
  line1: string
  line2: string | null
  city: string
  state: string
  pin_code: string
  phone: string
  is_default: boolean
  created_at: string
}

export interface Order {
  id: string
  order_number: string
  customer_id: string
  customer?: Profile
  profile?: Profile
  business_profile?: BusinessProfile
  fulfilment_status: OrderFulfilmentStatus
  payment_status: PaymentStatus
  items: OrderItem[]
  shipping_address_snapshot: AddressSnapshot
  billing_address_snapshot: AddressSnapshot
  notes: string | null
  internal_notes: string | null
  confirmed_total_paise: number | null
  net_verified_paid_paise: number
  outstanding_paise: number
  overpaid_paise: number
  idempotency_key: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name_snapshot: string
  sku_snapshot: string
  unit_snapshot: string
  quantity: number
  unit_price_paise: number
  total_paise: number
}

export interface AddressSnapshot {
  recipient_name: string
  line1: string
  line2?: string
  city: string
  state: string
  pin_code: string
  phone: string
  business_name?: string
  gst_number?: string
}

export interface Quotation {
  id: string
  order_id: string
  version: number
  status: QuotationStatus
  quotation_number: string
  goods_total_paise: number
  freight_paise: number | null
  discount_paise: number
  tax_paise: number
  grand_total_paise: number
  is_freight_confirmed: boolean
  notes_to_customer: string | null
  issued_at: string | null
  agreed_at: string | null
  created_by: string
  created_at: string
}

export interface Notification {
  id: string
  profile_id: string
  title: string
  body: string
  type: 'order' | 'quotation' | 'payment' | 'invoice' | 'general'
  is_read: boolean
  order_id: string | null
  created_at: string
}

export interface StockMovement {
  id: string
  product_id: string
  movement_type: 'receipt' | 'reservation' | 'release' | 'dispatch' | 'damage' | 'return' | 'adjustment'
  quantity_change: number
  reason: string | null
  order_id: string | null
  actor_id: string
  created_at: string
}

export interface Banner {
  id: string
  title: string
  subtitle: string | null
  image_url: string | null
  link_url: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

export interface Video {
  id: string
  title: string
  youtube_url: string
  thumbnail_url: string | null
  description: string | null
  display_order: number
  is_active: boolean
  related_products: Product[]
  created_at: string
}

export interface Payment {
  id: string
  order_id: string
  amount_paise: number
  payment_method: string
  reference_number: string | null
  payment_proof_url: string | null
  status: 'pending' | 'verified' | 'rejected'
  verified_by: string | null
  verified_at: string | null
  notes: string | null
  created_at: string
}
