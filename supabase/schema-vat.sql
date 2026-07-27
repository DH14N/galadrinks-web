-- ---------------------------------------------------------------------------
-- Gala Drinks — VAT
--
-- Adds a VAT rate to each product, and records the rate on each order
-- line at the time of ordering (so past orders stay correct even if a
-- rate changes later).
--
-- Everything defaults to 20%. Your accountant should confirm which lines
-- are zero-rated — those can be changed in the admin screen afterwards.
--
-- Safe to run more than once.
-- ---------------------------------------------------------------------------

-- Rate stored as a whole percentage: 20 = 20%, 0 = zero-rated
ALTER TABLE products    ADD COLUMN IF NOT EXISTS vat_rate INTEGER NOT NULL DEFAULT 20;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS vat_rate INTEGER NOT NULL DEFAULT 20;

-- Guard against nonsense values
ALTER TABLE products    DROP CONSTRAINT IF EXISTS products_vat_rate_check;
ALTER TABLE products    ADD  CONSTRAINT products_vat_rate_check    CHECK (vat_rate BETWEEN 0 AND 100);
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_vat_rate_check;
ALTER TABLE order_items ADD  CONSTRAINT order_items_vat_rate_check CHECK (vat_rate BETWEEN 0 AND 100);

-- Tea, coffee and cocoa for home consumption are commonly zero-rated in
-- the UK. This is a STARTING POINT only — please have your accountant
-- confirm, then adjust any product in Admin → Products & prices.
UPDATE products
   SET vat_rate = 0
 WHERE category_slug = 'hot-beverages'
   AND vat_rate = 20;
