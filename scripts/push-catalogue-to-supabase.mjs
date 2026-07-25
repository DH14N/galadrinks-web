// ---------------------------------------------------------------------------
// Pushes lib/products-data.json into the Supabase products table.
//
//   node scripts/push-catalogue-to-supabase.mjs            (dry run — shows what would happen)
//   node scripts/push-catalogue-to-supabase.mjs --apply    (actually writes)
//
// - Matches existing rows by slug, so it can be re-run safely after a
//   fresh CSV import: existing products are updated, new ones added.
// - NEVER writes prices. Trade prices are set separately, on purpose:
//   the shop CSV holds RETAIL prices, which must not reach trade customers.
// - Products no longer in the catalogue are deactivated, not deleted, so
//   past orders keep working.
// ---------------------------------------------------------------------------

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");

// Read credentials from .env.local
const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const products = JSON.parse(fs.readFileSync("lib/products-data.json", "utf8"));
console.log(`Catalogue file: ${products.length} products`);

// Existing rows, keyed by slug
const { data: existing, error: exErr } = await supabase
  .from("products")
  .select("id, slug, sku, name, is_active");
if (exErr) {
  console.error("Could not read products:", exErr.message);
  process.exit(1);
}
const bySlug = new Map(existing.filter((r) => r.slug).map((r) => [r.slug, r]));
console.log(`Database currently: ${existing.length} rows (${bySlug.size} with a slug)`);

// Build the rows to write
const rows = products.map((p) => ({
  slug: p.slug,
  sku: p.sku || null,
  name: p.name,
  description: p.description || null,
  category: p.category || null,       // legacy text column
  category_slug: p.category || null,
  brand: p.brand || null,
  brand_slug: p.brandSlug || null,
  owner: p.owner || null,
  pack_size: p.pack_size || null,
  unit_size: p.unit_size || null,
  case_size: p.case_size || null,
  unit: p.pack_size || null,          // legacy text column
  abv: p.abv || null,
  country: p.country || null,
  vessel: p.vessel || null,
  image_url: p.image_url || null,
  barcode: p.barcode || null,
  specs: p.specs || null,
  nolow: !!p.nolow,
  is_active: true,
}));

const newCount = rows.filter((r) => !bySlug.has(r.slug)).length;
console.log(`Would add ${newCount} new products, update ${rows.length - newCount} existing`);

const catalogueSlugs = new Set(rows.map((r) => r.slug));
const toDeactivate = existing.filter(
  (r) => r.slug && r.is_active && !catalogueSlugs.has(r.slug)
);
if (toDeactivate.length) {
  console.log(`Would deactivate ${toDeactivate.length} products no longer in the catalogue`);
}
const noSlug = existing.filter((r) => !r.slug);
if (noSlug.length) {
  console.log(`Leaving ${noSlug.length} legacy row(s) untouched (no slug): ${noSlug.map((r) => r.name).join(", ")}`);
}

if (!APPLY) {
  console.log("\nDRY RUN — nothing written. Re-run with --apply to write.");
  process.exit(0);
}

// Write in batches so we don't overwhelm the connection
const BATCH = 250;
let done = 0;
for (let i = 0; i < rows.length; i += BATCH) {
  const chunk = rows.slice(i, i + BATCH);
  const { error } = await supabase
    .from("products")
    .upsert(chunk, { onConflict: "slug" });
  if (error) {
    console.error(`\nFailed on batch starting ${i}:`, error.message);
    process.exit(1);
  }
  done += chunk.length;
  process.stdout.write(`\rWritten ${done}/${rows.length}…`);
}
console.log("");

for (const r of toDeactivate) {
  await supabase.from("products").update({ is_active: false }).eq("id", r.id);
}

const { count } = await supabase
  .from("products")
  .select("*", { count: "exact", head: true })
  .eq("is_active", true);
console.log(`Done. Active products in database: ${count}`);
console.log("Trade prices were NOT set — every product shows 'price on request' until priced.");
