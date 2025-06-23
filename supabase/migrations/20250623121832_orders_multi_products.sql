-- Migration: Support multiple products per order
ALTER TABLE public.orders
  DROP COLUMN IF EXISTS product_id,
  DROP COLUMN IF EXISTS qty;

ALTER TABLE public.orders
  ADD COLUMN products jsonb NOT NULL DEFAULT '[]';

-- Optionally, migrate existing data (if any) to the new products column
-- (This is a no-op if you have no existing orders or don't need to preserve them)
-- UPDATE public.orders SET products = jsonb_build_array(jsonb_build_object('productId', product_id, 'qty', qty)); 