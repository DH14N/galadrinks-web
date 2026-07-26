// ---------------------------------------------------------------------------
// Sets (or clears) a special price for ONE customer on ONE product.
// Everyone else keeps the base price.
//
//   Set a special price:
//     node scripts/set-customer-price.mjs 000002 pepsi-cola-24x330ml-cans 11.50
//
//   Remove it (customer goes back to the base price):
//     node scripts/set-customer-price.mjs 000002 pepsi-cola-24x330ml-cans clear
//
//   Find a product's code (slug) by searching its name:
//     node scripts/set-customer-price.mjs --find "pepsi"
//
//   See every special price a customer has:
//     node scripts/set-customer-price.mjs --list 000002
//
// This is a stop-gap until the admin screens are built.
// ---------------------------------------------------------------------------

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const money = (p) => (p == null ? "—" : "£" + (p / 100).toFixed(2));
const args = process.argv.slice(2);

// ----------------------------------------------------------------- --find
if (args[0] === "--find") {
  const term = args.slice(1).join(" ");
  if (!term) { console.log('Usage: --find "search words"'); process.exit(1); }
  const { data, error } = await sb
    .from("products")
    .select("slug, name, pack_size, trade_price_pence")
    .ilike("name", `%${term}%`)
    .eq("is_active", true)
    .order("name")
    .limit(25);
  if (error) { console.error(error.message); process.exit(1); }
  if (!data.length) { console.log("No products matched."); process.exit(0); }
  console.log(`${data.length} match(es):\n`);
  for (const p of data) {
    console.log(`  ${money(p.trade_price_pence).padStart(9)}  ${p.name.slice(0, 52).padEnd(52)}  ${p.slug}`);
  }
  process.exit(0);
}

// ----------------------------------------------------------------- --list
if (args[0] === "--list") {
  const number = args[1];
  const { data: cust } = await sb
    .from("customers").select("id, name, customer_number")
    .eq("customer_number", number).single();
  if (!cust) { console.log(`No customer with number ${number}`); process.exit(1); }

  const { data: rows } = await sb
    .from("customer_prices")
    .select("price_pence, products(name, pack_size, trade_price_pence)")
    .eq("customer_id", cust.id);

  console.log(`Special prices for ${cust.name} (${cust.customer_number}):\n`);
  if (!rows?.length) { console.log("  (none — they pay the base price on everything)"); process.exit(0); }
  for (const r of rows) {
    const base = r.products?.trade_price_pence;
    const diff = base != null ? (r.price_pence < base ? "cheaper" : r.price_pence > base ? "dearer" : "same") : "";
    console.log(`  ${money(r.price_pence).padStart(9)}  (base ${money(base)}, ${diff})  ${r.products?.name?.slice(0, 45)}`);
  }
  process.exit(0);
}

// ------------------------------------------------------- set / clear a price
const [number, slug, value] = args;
if (!number || !slug || !value) {
  console.log("Usage:");
  console.log('  node scripts/set-customer-price.mjs <customer_number> <product-slug> <price|clear>');
  console.log('  node scripts/set-customer-price.mjs --find "pepsi"');
  console.log("  node scripts/set-customer-price.mjs --list 000002");
  process.exit(1);
}

const { data: cust } = await sb
  .from("customers").select("id, name, customer_number")
  .eq("customer_number", number).single();
if (!cust) { console.log(`No customer with number ${number}`); process.exit(1); }

const { data: prod } = await sb
  .from("products").select("id, name, trade_price_pence")
  .eq("slug", slug).single();
if (!prod) { console.log(`No product with code ${slug} — try --find`); process.exit(1); }

if (value.toLowerCase() === "clear") {
  const { error } = await sb.from("customer_prices")
    .delete().eq("customer_id", cust.id).eq("product_id", prod.id);
  if (error) { console.error(error.message); process.exit(1); }
  console.log(`Removed special price. ${cust.name} now pays the base ${money(prod.trade_price_pence)} for ${prod.name}.`);
  process.exit(0);
}

const pounds = parseFloat(value);
if (Number.isNaN(pounds) || pounds <= 0) { console.log("Price must be a number, e.g. 11.50"); process.exit(1); }
const pence = Math.round(pounds * 100);

const { error } = await sb.from("customer_prices")
  .upsert({ customer_id: cust.id, product_id: prod.id, price_pence: pence },
          { onConflict: "customer_id,product_id" });
if (error) { console.error(error.message); process.exit(1); }

console.log(`${prod.name}`);
console.log(`  base price            : ${money(prod.trade_price_pence)}`);
console.log(`  ${cust.name} (${cust.customer_number}) pays : ${money(pence)}`);
