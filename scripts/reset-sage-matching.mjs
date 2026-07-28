// ---------------------------------------------------------------------------
// Puts the Sage matching back to a clean slate.
//
//   node scripts/reset-sage-matching.mjs             # shows what it would do
//   node scripts/reset-sage-matching.mjs --apply
//
// Three things happen:
//   1. every decision made so far is written to sage/matching-backup-<date>.json
//   2. products that took a Sage price get their original shop price back,
//      read from the Shopify export CSVs
//   3. every Sage line goes back to "pending"
//
// The backup means a reset is never final — the file lists exactly which
// Sage code was pointed at which product.
// ---------------------------------------------------------------------------

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const SHOP_FILES = ["products_export_1.csv", "products_export_2.csv"];

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ---------------------------------------------------- original shop prices
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const priceBySlug = new Map();
for (const file of SHOP_FILES) {
  if (!fs.existsSync(file)) continue;
  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  const col = Object.fromEntries(rows[0].map((h, i) => [h, i]));
  const get = (r, n) => (col[n] != null ? r[col[n]] || "" : "");
  for (const r of rows.slice(1)) {
    const handle = get(r, "Handle");
    if (!handle || !get(r, "Title") || priceBySlug.has(handle)) continue;
    if (get(r, "Status") !== "active" || get(r, "Published") !== "true") continue;
    const pounds = parseFloat(get(r, "Variant Price").trim());
    if (!Number.isNaN(pounds) && pounds > 0) priceBySlug.set(handle, Math.round(pounds * 100));
  }
}

// ------------------------------------------------------------ what's there
const { data: decisions } = await admin
  .from("sage_products")
  .select("code, description, price_pence, status, product_id, decided_at")
  .neq("status", "pending")
  .order("code");

const { data: linked } = await admin
  .from("products")
  .select("id, slug, name, sage_code, trade_price_pence")
  .not("sage_code", "is", null);

const byStatus = {};
for (const d of decisions || []) byStatus[d.status] = (byStatus[d.status] || 0) + 1;

console.log("Decisions made so far:");
for (const [s, n] of Object.entries(byStatus)) console.log(`  ${s.padEnd(12)} ${n}`);
console.log(`Products carrying a Sage code: ${linked?.length || 0}`);

const restorable = (linked || []).filter((p) => priceBySlug.has(p.slug));
const changed = restorable.filter((p) => priceBySlug.get(p.slug) !== p.trade_price_pence);
console.log(`Original shop price available for ${restorable.length} of them; ${changed.length} would change back.`);
console.log(`No original price for ${(linked?.length || 0) - restorable.length} — those keep what they have.`);

if (!APPLY) {
  console.log("\nDry run. Add --apply to actually reset.");
  process.exit(0);
}

// ------------------------------------------------------------------ back up
fs.mkdirSync("sage", { recursive: true });
const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
const backup = `sage/matching-backup-${stamp}.json`;
fs.writeFileSync(backup, JSON.stringify({
  savedAt: new Date().toISOString(),
  decisions: decisions || [],
  productPricesBefore: (linked || []).map((p) => ({
    id: p.id, slug: p.slug, name: p.name,
    sage_code: p.sage_code, trade_price_pence: p.trade_price_pence,
  })),
}, null, 2));
console.log(`\nBacked up to ${backup}`);

// -------------------------------------------------------- restore + unlink
let restored = 0;
for (const p of changed) {
  const { error } = await admin
    .from("products")
    .update({ trade_price_pence: priceBySlug.get(p.slug) })
    .eq("id", p.id);
  if (error) { console.error(`  couldn't restore ${p.name}: ${error.message}`); continue; }
  restored++;
}

for (const p of linked || []) {
  await admin.from("products").update({ sage_code: null }).eq("id", p.id);
}

const { error: resetError } = await admin
  .from("sage_products")
  .update({ status: "pending", product_id: null, decided_at: null })
  .neq("status", "pending");

if (resetError) { console.error("Reset failed:", resetError.message); process.exit(1); }

const { count } = await admin
  .from("sage_products").select("*", { count: "exact", head: true }).eq("status", "pending");
const { count: stillLinked } = await admin
  .from("products").select("*", { count: "exact", head: true }).not("sage_code", "is", null);

console.log(`Prices put back: ${restored}`);
console.log(`Sage codes cleared: ${linked?.length || 0}`);
console.log(`\nNow: ${count} lines pending, ${stillLinked} products still carrying a Sage code.`);
