-- ---------------------------------------------------------------------------
-- Gala Drinks — catalogue schema upgrade
--
-- Adds the columns the new website needs to the existing products table,
-- and introduces a single shared trade price per product. Per-customer
-- special prices continue to live in customer_prices, which override it.
--
-- Safe to run more than once (every statement is IF NOT EXISTS / OR REPLACE).
-- ---------------------------------------------------------------------------

-- 1. Extra product fields used by the new site -------------------------------
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug          TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand         TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_slug    TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS owner         TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_slug TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS pack_size     TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_size     TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS case_size     TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS abv           TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS country       TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS vessel        TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url     TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode       TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS specs         TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS nolow         BOOLEAN DEFAULT FALSE;

-- The shared trade price every logged-in customer sees (in pence).
-- NULL means "price on request" — nothing can be ordered at a wrong price.
ALTER TABLE products ADD COLUMN IF NOT EXISTS trade_price_pence INTEGER;

-- Slug is how the website looks a product up, so it must be unique
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_key ON products (slug);
CREATE INDEX IF NOT EXISTS products_category_idx ON products (category_slug);
CREATE INDEX IF NOT EXISTS products_brand_idx    ON products (brand_slug);

-- 2. Row Level Security ------------------------------------------------------
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Any signed-in trade customer may read active products
DROP POLICY IF EXISTS "signed-in can read active products" ON products;
CREATE POLICY "signed-in can read active products"
  ON products FOR SELECT
  TO authenticated
  USING (is_active);

-- 3. Price lookup ------------------------------------------------------------
-- One place that decides a customer's price: their special price if one
-- exists, otherwise the shared trade price. Used by the website and, most
-- importantly, when an order is placed (so prices are never trusted from
-- the browser).
CREATE OR REPLACE FUNCTION price_for_customer(p_customer UUID, p_product UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (SELECT cp.price_pence FROM customer_prices cp
      WHERE cp.customer_id = p_customer AND cp.product_id = p_product),
    (SELECT pr.trade_price_pence FROM products pr WHERE pr.id = p_product)
  );
$$;
