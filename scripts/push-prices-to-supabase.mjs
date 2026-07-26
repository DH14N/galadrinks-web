// ---------------------------------------------------------------------------
// Sets each product's BASE trade price in Supabase, from the shop CSV export.
//
//   node scripts/push-prices-to-supabase.mjs           (dry run)
//   node scripts/push-prices-to-supabase.mjs --apply   (writes)
//
// Prices are read straight from the CSV and written ONLY to the database.
// They are deliberately never written into lib/products-data.json, because
// that file is sent to every visitor's browser — public visitors must
// never see prices.
//
// This sets the shared base price. Individual customers who have agreed a
// different price are handled separately, in the customer_prices table,
// which always overrides this.
// ---------------------------------------------------------------------------

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const FILES = ["products_export_1.csv", "products_export_2.csv"];

// ------------------------------------------------------------------ CSV parse
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// Collect one price per product handle (from its first, main row)
const priceBySlug = new Map();

for (const file of FILES) {
  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  const header = rows[0];
  const col = Object.fromEntries(header.map((h, i) => [h, i]));
  const get = (r, name) => (col[name] != null ? r[col[name]] || "" : "");

  for (const r of rows.slice(1)) {
    const handle = get(r, "Handle");
    const title = get(r, "Title");
    if (!handle || !title) continue;          // image-only continuation row
    if (priceBySlug.has(handle)) continue;    // already have the main row
    if (get(r, "Status") !== "active" || get(r, "Published") !== "true") continue;

    const raw = get(r, "Variant Price").trim();
    if (!raw) continue;
    const pounds = parseFloat(raw);
    if (Number.isNaN(pounds) || pounds <= 0) continue;

    priceBySlug.set(handle, Math.round(pounds * 100)); // store as pence
  }
}

console.log(`Prices found in CSV: ${priceBySlug.size}`);

// ------------------------------------------------------------------ Supabase
const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Fetch products in pages (Supabase returns max 1000 at a time)
const dbProducts = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase
    .from("products")
    .select("id, slug, name")
    .not("slug", "is", null)
    .range(from, from + 999);
  if (error) { console.error("Read failed:", error.message); process.exit(1); }
  dbProducts.push(...data);
  if (data.length < 1000) break;
}
console.log(`Products in database: ${dbProducts.length}`);

const updates = [];
const noPrice = [];
for (const p of dbProducts) {
  const pence = priceBySlug.get(p.slug);
  if (pence == null) noPrice.push(p);
  else updates.push({ id: p.id, pence });
}

console.log(`Would set a price on ${updates.length} products`);
console.log(`No price available for ${noPrice.length} products (they stay "price on request")`);

if (updates.length) {
  const sorted = [...updates].sort((a, b) => a.pence - b.pence);
  const fmt = (n) => "£" + (n / 100).toFixed(2);
  console.log(`Price range: ${fmt(sorted[0].pence)} – ${fmt(sorted[sorted.length - 1].pence)}`);
  console.log(`Median: ${fmt(sorted[Math.floor(sorted.length / 2)].pence)}`);
}

if (!APPLY) {
  console.log("\nDRY RUN — nothing written. Re-run with --apply to write.");
  process.exit(0);
}

let done = 0;
for (const u of updates) {
  const { error } = await supabase
    .from("products")
    .update({ trade_price_pence: u.pence })
    .eq("id", u.id);
  if (error) { console.error(`\nFailed on ${u.id}:`, error.message); process.exit(1); }
  done++;
  if (done % 100 === 0 || done === updates.length) {
    process.stdout.write(`\rPriced ${done}/${updates.length}…`);
  }
}
console.log("\nDone. Base trade prices set.");
console.log("Per-customer exceptions live in customer_prices and override these.");
