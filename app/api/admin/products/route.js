import { requireAdmin, authErrorResponse } from "@/lib/tradeAuth";

const PER_PAGE = 40;

// ---------------------------------------------------------------- list
export async function GET(request) {
  const { admin, error } = await requireAdmin(request);
  if (error) return authErrorResponse(error);

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const category = searchParams.get("category") || "";
  const onlyUnpriced = searchParams.get("unpriced") === "1";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  let query = admin
    .from("products")
    .select("id, slug, name, brand, category_slug, pack_size, sku, image_url, trade_price_pence, vat_rate, is_active", { count: "exact" })
    .order("name", { ascending: true });

  if (category) query = query.eq("category_slug", category);
  if (onlyUnpriced) query = query.is("trade_price_pence", null);
  if (q) {
    const safe = q.replace(/[%,]/g, " ");
    query = query.or(`name.ilike.%${safe}%,brand.ilike.%${safe}%,sku.ilike.%${safe}%`);
  }

  const from = (page - 1) * PER_PAGE;
  const { data, count, error: listError } = await query.range(from, from + PER_PAGE - 1);

  if (listError) {
    return Response.json({ error: "Could not load products." }, { status: 500 });
  }

  return Response.json({
    items: data,
    total: count ?? 0,
    page,
    perPage: PER_PAGE,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / PER_PAGE)),
  });
}

// ------------------------------------------- change a base price / activity
export async function PATCH(request) {
  const { admin, error } = await requireAdmin(request);
  if (error) return authErrorResponse(error);

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const id = typeof body?.product_id === "string" ? body.product_id : null;
  if (!id) return Response.json({ error: "Which product?" }, { status: 400 });

  const patch = {};

  // Price: a number in pounds, or null to clear it ("price on request")
  if ("price" in body) {
    if (body.price === null || body.price === "") {
      patch.trade_price_pence = null;
    } else {
      const pounds = Number(body.price);
      if (!Number.isFinite(pounds) || pounds < 0 || pounds > 100000) {
        return Response.json({ error: "That price doesn’t look right." }, { status: 400 });
      }
      patch.trade_price_pence = Math.round(pounds * 100);
    }
  }

  if ("is_active" in body) patch.is_active = !!body.is_active;

  // VAT rate as a whole percentage (20 = 20%, 0 = zero-rated)
  if ("vat_rate" in body) {
    const rate = Number(body.vat_rate);
    if (!Number.isInteger(rate) || rate < 0 || rate > 100) {
      return Response.json({ error: "VAT rate must be between 0 and 100." }, { status: 400 });
    }
    patch.vat_rate = rate;
  }

  if (!Object.keys(patch).length) {
    return Response.json({ error: "Nothing to change." }, { status: 400 });
  }

  const { data, error: updateError } = await admin
    .from("products")
    .update(patch)
    .eq("id", id)
    .select("id, name, trade_price_pence, vat_rate, is_active")
    .single();

  if (updateError) {
    return Response.json({ error: "Could not save the change." }, { status: 500 });
  }

  return Response.json({ ok: true, product: data });
}
