import { requireAdmin, authErrorResponse } from "@/lib/tradeAuth";
import { buildIndex, rankCandidates, searchProductsByName } from "@/lib/sageMatch";

// ---------------------------------------------------------------------------
// The Sage matching screen.
//
//   GET  ?action=next            the next line needing a decision, with candidates
//   GET  ?action=search&q=...    look up a product by name instead
//   POST {code, action}          record the decision
//
// Confirming a match does two things: it stamps the Sage code onto the
// website product permanently, and it takes Sage's price. The stamp is the
// valuable part — once it's there, future price exports apply on their own.
// ---------------------------------------------------------------------------

// The catalogue is 4,000-odd rows and barely changes during a matching
// session, so it's built once and reused rather than re-fetched per click.
let cache = null;
const CACHE_MS = 10 * 60 * 1000;

async function catalogueIndex(admin) {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.index;

  const rows = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from("products")
      .select("id, name, brand, pack_size, unit_size, slug, image_url, trade_price_pence")
      .eq("is_active", true)
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }

  const index = buildIndex(rows);
  cache = { at: Date.now(), index };
  return index;
}

const shape = (c) => ({
  id: c.product.id,
  name: c.product.name,
  brand: c.product.brand,
  pack_size: c.product.pack_size,
  slug: c.product.slug,
  image_url: c.product.image_url,
  current_price_pence: c.product.trade_price_pence,
  score: Math.round(c.score * 100),
});

async function progressFor(admin) {
  const counts = {};
  for (const status of ["pending", "matched", "not_stocked", "skipped"]) {
    const { count } = await admin
      .from("sage_products")
      .select("*", { count: "exact", head: true })
      .eq("status", status);
    counts[status] = count ?? 0;
  }
  counts.total = counts.pending + counts.matched + counts.not_stocked + counts.skipped;
  return counts;
}

export async function GET(request) {
  const { admin, error } = await requireAdmin(request);
  if (error) return authErrorResponse(error);

  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "next";

  try {
    const index = await catalogueIndex(admin);

    if (action === "search") {
      const q = url.searchParams.get("q") || "";
      const hits = searchProductsByName(index, q);
      return Response.json({ results: hits.map(shape) });
    }

    const progress = await progressFor(admin);

    // Skipped lines come back round once everything else is decided
    let { data: rows } = await admin
      .from("sage_products")
      .select("code, description, price_pence")
      .eq("status", "pending")
      .order("description")
      .limit(1);

    if (!rows?.length) {
      ({ data: rows } = await admin
        .from("sage_products")
        .select("code, description, price_pence")
        .eq("status", "skipped")
        .order("description")
        .limit(1));
    }

    if (!rows?.length) return Response.json({ progress, item: null, candidates: [] });

    const item = rows[0];

    // Products already claimed by another Sage line can't be picked twice
    const { data: taken } = await admin
      .from("sage_products")
      .select("product_id")
      .eq("status", "matched")
      .not("product_id", "is", null);
    const used = new Set((taken || []).map((t) => t.product_id));

    const candidates = rankCandidates(index, item.description, 8, item.price_pence)
      .filter((c) => !used.has(c.product.id))
      .slice(0, 5)
      .map(shape);

    return Response.json({ progress, item, candidates });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { admin, error } = await requireAdmin(request);
  if (error) return authErrorResponse(error);

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const code = String(body.code || "").trim();
  const action = String(body.action || "");
  if (!code) return Response.json({ error: "Which Sage line?" }, { status: 400 });

  const { data: line } = await admin
    .from("sage_products")
    .select("code, description, price_pence")
    .eq("code", code)
    .single();

  if (!line) return Response.json({ error: "That Sage line no longer exists." }, { status: 404 });

  // ------------------------------------------------------------------- undo
  // 800 decisions means the odd misclick. Undo puts the line back in the
  // queue and unlinks the product, but leaves the price where it is —
  // the next correct match overwrites it anyway.
  if (action === "reset") {
    const { data: current } = await admin
      .from("sage_products").select("product_id").eq("code", code).single();

    if (current?.product_id) {
      await admin.from("products").update({ sage_code: null }).eq("id", current.product_id);
    }
    await admin
      .from("sage_products")
      .update({ status: "pending", product_id: null, decided_at: null })
      .eq("code", code);
    return Response.json({ ok: true });
  }

  // ------------------------------------------------- skip / we don't stock it
  if (action === "skip" || action === "not_stocked") {
    await admin
      .from("sage_products")
      .update({
        status: action === "skip" ? "skipped" : "not_stocked",
        product_id: null,
        decided_at: new Date().toISOString(),
      })
      .eq("code", code);
    return Response.json({ ok: true });
  }

  if (action !== "match") {
    return Response.json({ error: "Unknown action." }, { status: 400 });
  }

  const productId = String(body.product_id || "");
  if (!productId) return Response.json({ error: "Pick a product first." }, { status: 400 });

  // One Sage line per product, both ways round — otherwise a later price
  // import wouldn't know which price wins.
  const { data: clash } = await admin
    .from("products")
    .select("id, name, sage_code")
    .eq("id", productId)
    .single();

  if (!clash) return Response.json({ error: "That product no longer exists." }, { status: 404 });
  if (clash.sage_code && clash.sage_code !== code) {
    return Response.json(
      { error: `“${clash.name}” is already linked to Sage code ${clash.sage_code}.` },
      { status: 409 }
    );
  }

  // Where Sage has no price, the existing price stays — the user's call.
  const update = { sage_code: code };
  if (line.price_pence && line.price_pence > 0) update.trade_price_pence = line.price_pence;

  const { error: writeError } = await admin.from("products").update(update).eq("id", productId);
  if (writeError) return Response.json({ error: writeError.message }, { status: 500 });

  await admin
    .from("sage_products")
    .update({ status: "matched", product_id: productId, decided_at: new Date().toISOString() })
    .eq("code", code);

  return Response.json({
    ok: true,
    priceApplied: Boolean(update.trade_price_pence),
    price_pence: update.trade_price_pence ?? null,
  });
}
