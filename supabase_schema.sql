-- ==============================================================================
-- NITYAMANI B2B WHOLESALE SYSTEM — COMPLETE SUPABASE DATABASE SCHEMA
-- Run this in your Supabase Project Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- TABLES
-- ==============================================================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business Profiles (wholesale GST, business name, address)
CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  business_name TEXT NOT NULL,
  gst_number TEXT,
  billing_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pin_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  selling_unit TEXT NOT NULL DEFAULT 'piece',
  pack_contents INT,
  moq INT NOT NULL DEFAULT 1,
  order_increment INT NOT NULL DEFAULT 1,
  price_paise BIGINT NOT NULL, -- Integer paise (₹100 = 10000 paise)
  is_published BOOLEAN DEFAULT TRUE,
  is_archived BOOLEAN DEFAULT FALSE,
  on_hand INT NOT NULL DEFAULT 0,
  reserved INT NOT NULL DEFAULT 0,
  available INT NOT NULL DEFAULT 0,
  low_stock_threshold INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Images
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  display_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Carts
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cart Items
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK (quantity > 0),
  price_paise_snapshot BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cart_id, product_id)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id),
  fulfilment_status TEXT NOT NULL DEFAULT 'requested' CHECK (
    fulfilment_status IN ('requested', 'under_review', 'awaiting_payment', 'processing', 'ready', 'dispatched', 'delivered', 'cancelled', 'expired')
  ),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (
    payment_status IN ('unpaid', 'partially_paid', 'paid', 'overpaid')
  ),
  shipping_address_snapshot JSONB NOT NULL DEFAULT '{}',
  billing_address_snapshot JSONB NOT NULL DEFAULT '{}',
  confirmed_total_paise BIGINT,
  net_verified_paid_paise BIGINT NOT NULL DEFAULT 0,
  outstanding_paise BIGINT NOT NULL DEFAULT 0,
  overpaid_paise BIGINT NOT NULL DEFAULT 0,
  notes TEXT,
  internal_notes TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name_snapshot TEXT NOT NULL,
  sku_snapshot TEXT NOT NULL,
  unit_snapshot TEXT NOT NULL,
  quantity INT NOT NULL,
  unit_price_paise BIGINT NOT NULL,
  total_paise BIGINT NOT NULL
);

-- Banners
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  link_url TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotations
CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'agreed', 'superseded')),
  quotation_number TEXT NOT NULL UNIQUE,
  goods_total_paise BIGINT NOT NULL DEFAULT 0,
  freight_paise BIGINT,
  discount_paise BIGINT NOT NULL DEFAULT 0,
  tax_paise BIGINT NOT NULL DEFAULT 0,
  grand_total_paise BIGINT NOT NULL DEFAULT 0,
  is_freight_confirmed BOOLEAN DEFAULT FALSE,
  notes_to_customer TEXT,
  issued_at TIMESTAMPTZ,
  agreed_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments (Manual Bank Transfer / UPI proofs)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount_paise BIGINT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  reference_number TEXT,
  payment_proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  link_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- AUTOMATIC PROFILE TRIGGER ON SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Valued Customer'),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    'customer',
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET status = 'active';
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- PREVENT ROLE SELF-ASSIGNMENT
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.protect_role_update()
RETURNS trigger AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Not authorized to change role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_role_change ON public.profiles;
CREATE TRIGGER prevent_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_role_update();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop old policies to avoid duplicate name conflicts on re-run
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "biz_select" ON business_profiles;
DROP POLICY IF EXISTS "biz_insert" ON business_profiles;
DROP POLICY IF EXISTS "biz_update" ON business_profiles;
DROP POLICY IF EXISTS "categories_select" ON categories;
DROP POLICY IF EXISTS "categories_admin_all" ON categories;
DROP POLICY IF EXISTS "products_select" ON products;
DROP POLICY IF EXISTS "products_admin_all" ON products;
DROP POLICY IF EXISTS "product_images_select" ON product_images;
DROP POLICY IF EXISTS "product_images_admin_all" ON product_images;
DROP POLICY IF EXISTS "carts_manage_own" ON carts;
DROP POLICY IF EXISTS "carts_admin" ON carts;
DROP POLICY IF EXISTS "cart_items_manage_own" ON cart_items;
DROP POLICY IF EXISTS "cart_items_admin" ON cart_items;
DROP POLICY IF EXISTS "orders_select_own" ON orders;
DROP POLICY IF EXISTS "orders_insert_own" ON orders;
DROP POLICY IF EXISTS "orders_admin_all" ON orders;
DROP POLICY IF EXISTS "order_items_select" ON order_items;
DROP POLICY IF EXISTS "order_items_insert" ON order_items;
DROP POLICY IF EXISTS "order_items_admin_all" ON order_items;
DROP POLICY IF EXISTS "banners_select" ON banners;
DROP POLICY IF EXISTS "banners_admin_all" ON banners;
DROP POLICY IF EXISTS "quotations_select" ON quotations;
DROP POLICY IF EXISTS "quotations_admin_all" ON quotations;
DROP POLICY IF EXISTS "payments_select_own" ON payments;
DROP POLICY IF EXISTS "payments_insert_own" ON payments;
DROP POLICY IF EXISTS "payments_admin_all" ON payments;
DROP POLICY IF EXISTS "notifications_manage_own" ON notifications;

-- Profiles:
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- Business Profiles:
CREATE POLICY "biz_select" ON business_profiles FOR SELECT USING (profile_id = auth.uid() OR public.is_admin());
CREATE POLICY "biz_insert" ON business_profiles FOR INSERT WITH CHECK (profile_id = auth.uid() OR public.is_admin());
CREATE POLICY "biz_update" ON business_profiles FOR UPDATE USING (profile_id = auth.uid() OR public.is_admin());

-- Categories: (Public can read active categories)
CREATE POLICY "categories_select" ON categories FOR SELECT USING (
  is_active = TRUE OR public.is_admin()
);
CREATE POLICY "categories_admin_all" ON categories FOR ALL USING (public.is_admin());

-- Products: (Public can read published products)
CREATE POLICY "products_select" ON products FOR SELECT USING (
  (is_published = TRUE AND is_archived = FALSE) OR public.is_admin()
);
CREATE POLICY "products_admin_all" ON products FOR ALL USING (public.is_admin());

-- Product Images: (Public can read images of published products)
CREATE POLICY "product_images_select" ON product_images FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = product_id AND p.is_published = TRUE
  )
  OR public.is_admin()
);
CREATE POLICY "product_images_admin_all" ON product_images FOR ALL USING (public.is_admin());

-- Carts:
CREATE POLICY "carts_manage_own" ON carts FOR ALL USING (customer_id = auth.uid());
CREATE POLICY "carts_admin" ON carts FOR SELECT USING (public.is_admin());

-- Cart Items:
CREATE POLICY "cart_items_manage_own" ON cart_items FOR ALL USING (
  EXISTS (SELECT 1 FROM carts WHERE id = cart_id AND customer_id = auth.uid())
);
CREATE POLICY "cart_items_admin" ON cart_items FOR SELECT USING (public.is_admin());

-- Orders:
CREATE POLICY "orders_select_own" ON orders FOR SELECT USING (customer_id = auth.uid() OR public.is_admin());
CREATE POLICY "orders_insert_own" ON orders FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "orders_admin_all" ON orders FOR ALL USING (public.is_admin());

-- Order Items:
CREATE POLICY "order_items_select" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_id AND customer_id = auth.uid())
  OR public.is_admin()
);
CREATE POLICY "order_items_insert" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE id = order_id AND customer_id = auth.uid())
);
CREATE POLICY "order_items_admin_all" ON order_items FOR ALL USING (public.is_admin());

-- Banners:
CREATE POLICY "banners_select" ON banners FOR SELECT USING (is_active = TRUE OR public.is_admin());
CREATE POLICY "banners_admin_all" ON banners FOR ALL USING (public.is_admin());

-- Quotations:
CREATE POLICY "quotations_select" ON quotations FOR SELECT USING (
  (EXISTS (SELECT 1 FROM orders WHERE id = order_id AND customer_id = auth.uid()) AND status IN ('published', 'agreed'))
  OR public.is_admin()
);
CREATE POLICY "quotations_admin_all" ON quotations FOR ALL USING (public.is_admin());

-- Payments:
CREATE POLICY "payments_select_own" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_id AND customer_id = auth.uid())
  OR public.is_admin()
);
CREATE POLICY "payments_insert_own" ON payments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE id = order_id AND customer_id = auth.uid())
);
CREATE POLICY "payments_admin_all" ON payments FOR ALL USING (public.is_admin());

-- Notifications:
CREATE POLICY "notifications_manage_own" ON notifications FOR ALL USING (profile_id = auth.uid() OR public.is_admin());

-- ==============================================================================
-- STORAGE BUCKETS SETUP (product-images bucket)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "product_images_bucket_public_read" ON storage.objects;
DROP POLICY IF EXISTS "product_images_bucket_admin_upload" ON storage.objects;
DROP POLICY IF EXISTS "product_images_bucket_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "product_images_bucket_admin_delete" ON storage.objects;

CREATE POLICY "product_images_bucket_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "product_images_bucket_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "product_images_bucket_admin_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "product_images_bucket_admin_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND public.is_admin());

-- ==============================================================================
-- SEED DATA (Wholesale Categories & Products)


-- Enable Realtime for notifications
alter publication supabase_realtime add table notifications;
