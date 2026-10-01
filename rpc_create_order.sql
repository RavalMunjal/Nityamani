-- ==============================================================================
-- NITYAMANI - SECURE ORDER CREATION RPC
-- Run this in your Supabase SQL Editor
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.create_wholesale_order(
  p_customer_id UUID,
  p_shipping_address JSONB,
  p_billing_address JSONB,
  p_payment_method TEXT,
  p_notes TEXT
) RETURNS UUID AS $$
DECLARE
  v_cart_id UUID;
  v_order_id UUID;
  v_total_paise BIGINT := 0;
  v_item RECORD;
  v_product RECORD;
  v_line_total BIGINT;
BEGIN
  -- 1. Security Check
  IF auth.uid() IS NULL OR auth.uid() != p_customer_id THEN
    RAISE EXCEPTION 'Unauthorized: Invalid customer ID';
  END IF;

  -- 2. Find the Cart
  SELECT id INTO v_cart_id FROM public.carts WHERE customer_id = p_customer_id;
  IF v_cart_id IS NULL THEN
    RAISE EXCEPTION 'Cart not found';
  END IF;

  -- Check if cart is empty
  IF NOT EXISTS (SELECT 1 FROM public.cart_items WHERE cart_id = v_cart_id) THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- 3. Create the Order (Initial Draft)
  INSERT INTO public.orders (
    customer_id,
    fulfilment_status,
    payment_status,
    shipping_address_snapshot,
    billing_address_snapshot,
    notes,
    confirmed_total_paise
  ) VALUES (
    p_customer_id,
    'requested',
    'unpaid',
    p_shipping_address,
    p_billing_address,
    p_notes,
    0 -- Will update later
  ) RETURNING id INTO v_order_id;

  -- 4. Process Cart Items securely
  FOR v_item IN (SELECT * FROM public.cart_items WHERE cart_id = v_cart_id) LOOP
    
    -- Lock product to prevent race conditions and get trusted data
    SELECT * INTO v_product FROM public.products WHERE id = v_item.product_id FOR UPDATE;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found (ID: %)', v_item.product_id;
    END IF;

    IF v_product.is_published = FALSE OR v_product.is_archived = TRUE THEN
      RAISE EXCEPTION 'Product "%" is no longer available', v_product.name;
    END IF;

    -- Validate MOQ
    IF v_item.quantity < v_product.moq THEN
      RAISE EXCEPTION 'Quantity for "%" (%) is below Minimum Order Quantity (%)', v_product.name, v_item.quantity, v_product.moq;
    END IF;

    -- Calculate trusted price
    v_line_total := v_item.quantity * v_product.price_paise;
    v_total_paise := v_total_paise + v_line_total;

    -- Insert Order Item (Taking snapshots of current product data)
    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name_snapshot,
      sku_snapshot,
      unit_snapshot,
      quantity,
      unit_price_paise,
      total_paise
    ) VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.sku,
      v_product.selling_unit,
      v_item.quantity,
      v_product.price_paise,
      v_line_total
    );

    -- Note: Stock deduction happens when order is confirmed by Admin, not on request.
    -- (Based on business workflow 'Requested' -> 'Confirmed')
  END LOOP;

  -- 5. Update Order Total
  UPDATE public.orders SET confirmed_total_paise = v_total_paise WHERE id = v_order_id;

  -- 6. Record Payment Method (in payments table)
  INSERT INTO public.payments (
    order_id,
    amount_paise,
    payment_method,
    status
  ) VALUES (
    v_order_id,
    v_total_paise,
    p_payment_method,
    'pending'
  );

  -- 7. Empty the Cart
  DELETE FROM public.cart_items WHERE cart_id = v_cart_id;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
