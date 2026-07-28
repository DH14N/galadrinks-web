// ---------------------------------------------------------------------------
// Loads a Sage 50 product export into the sage_products table, ready for the
// matching screen at /admin/sage.
//
//   node scripts/import-sage-products.mjs                    # dry run
//   node scripts/import-sage-products.mjs --apply
//   node scripts/import-sage-products.mjs --apply path/to/export.csv
//
// Save the Sage export as CSV. Columns are found by name, so the order
// doesn't matter, but it needs at least a product code, a description and
// a sales price.
//
// Running it again is safe and is how prices get updated: decisions already
// made on the matching screen are left alone, and every product already
// linked to a Sage code has its price refreshed automatically.
// ---------------------------------------------------------------------------

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const file = args.find((a) => !a.startsWith("--")) || "sage/sage-products.csv";

// --------------------------------------------------------------- read the CSV
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
  return rows.filter((r) => r.some((c) => c.trim()));
}

if (!fs.existsSync(file)) {
  console.error(`Can't find ${file}. Save the Sage export as CSV and put it there.`);
  process.exit(1);
}

const rows = parseCsv(fs.readFileSync(file, "utf8").replace(/^﻿/, ""));
const header = rows[0].map((h) => h.trim().toLowerCase());

const find = (...names) => {
  for (const n of names) {
    const i = header.findIndex((h) => h === n);
    if (i !== -1) return i;
  }
  for (const n of names) {
    const i = header.findIndex((h) => h.includes(n));
    if (i !== -1) return i;
  }
  return -1;
};

const iCode = find("product code", "code", "reference", "a/c");
const iDesc = find("description", "name", "details");
const iPrice = find("sales price", "price", "unit price");

if (iCode === -1 || iDesc === -1) {
  console.error("Couldn't find a code and description column. Header was:\n ", header.join(" | "));
  process.exit(1);
}
if (iPrice === -1) console.warn("! No price column found — importing codes and names only.\n");

const seen = new Set();
const items = [];
let skipped = 0;

for (const r of rows.slice(1)) {
  const code = (r[iCode] || "").trim();
  const description = (r[iDesc] || "").trim();
  if (!code || !description) { skipped++; continue; }
  if (seen.has(code.toUpperCase())) { skipped++; continue; }
  seen.add(code.toUpperCase());

  const raw = iPrice === -1 ? 0 : parseFloat((r[iPrice] || "0").replace(/[^0-9.\-]/g, "")) || 0;
  items.push({ code, description, price_pence: Math.round(raw * 100) });
}

const priced = items.filter((i) => i.price_pence > 0).length;
console.log(`${file}`);
console.log(`  ${items.length} products (${priced} with a price, ${items.length - priced} at zero)`);
if (skipped) console.log(`  ${skipped} rows ignored (blank or duplicate codes)`);

if (!apply) {
  console.log("\nDry run. Add --apply to write these to the database.");
  console.log("First few:");
  for (const i of items.slice(0, 5)) {
    console.log(`  ${i.code.padEnd(16)} ${i.description.slice(0, 44).padEnd(46)} £${(i.price_pence / 100).toFixed(2)}`);
  }
  process.exit(0);
}

// ------------------------------------------------------------------- write it
// Only the three columns from Sage are touched, so a code that has already
// been matched keeps its status and its link.
let written = 0;
for (let i = 0; i < items.length; i += 200) {
  const batch = items.slice(i, i + 200);
  const { error } = await admin
    .from("sage_products")
    .upsert(batch, { onConflict: "code", ignoreDuplicates: false });
  if (error) {
    console.error("Failed writing a batch:", error.message);
    process.exit(1);
  }
  written += batch.length;
  process.stdout.write(`\r  written ${written}/${items.length}`);
}
console.log("");

// ------------------------------------- push new prices onto products already
// linked, so re-running this is all it takes to update prices from Sage
const { data: linked } = await admin
  .from("sage_products")
  .select("code, price_pence, product_id")
  .eq("status", "matched")
  .not("product_id", "is", null);

let updated = 0, unchanged = 0;
for (const row of linked || []) {
  const fresh = items.find((i) => i.code === row.code);
  if (!fresh || !fresh.price_pence) continue;

  const { data: product } = await admin
    .from("products").select("trade_price_pence").eq("id", row.product_id).single();

  if (product && product.trade_price_pence === fresh.price_pence) { unchanged++; continue; }

  await admin.from("products")
    .update({ trade_price_pence: fresh.price_pence })
    .eq("id", row.product_id);
  updated++;
}

console.log(`\nDone. ${items.length} Sage lines stored.`);
console.log(`Prices on matched products: ${updated} changed, ${unchanged} already correct.`);
