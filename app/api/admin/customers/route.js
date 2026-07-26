import { requireAdmin, authErrorResponse } from "@/lib/tradeAuth";

// ---------------------------------------------------------------- list
export async function GET(request) {
  const { admin, error } = await requireAdmin(request);
  if (error) return authErrorResponse(error);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  // One customer, with their agreed special prices
  if (id) {
    const { data: customer, error: custError } = await admin
      .from("customers")
      .select("id, customer_number, name, contact_email, contact_phone, is_active, is_admin, created_at")
      .eq("id", id)
      .single();

    if (custError || !customer) {
      return Response.json({ error: "Customer not found." }, { status: 404 });
    }

    const { data: prices } = await admin
      .from("customer_prices")
      .select("product_id, price_pence, products(name, pack_size, sku, trade_price_pence)")
      .eq("customer_id", id);

    const { data: orders } = await admin
      .from("orders")
      .select("id, status, created_at")
      .eq("customer_id", id)
      .order("created_at", { ascending: false })
      .limit(10);

    return Response.json({
      customer,
      specialPrices: (prices || []).map((p) => ({
        product_id: p.product_id,
        price_pence: p.price_pence,
        name: p.products?.name || "Product",
        pack_size: p.products?.pack_size || null,
        sku: p.products?.sku || null,
        base_price_pence: p.products?.trade_price_pence ?? null,
      })),
      recentOrders: orders || [],
    });
  }

  // Everyone
  const { data: customers, error: listError } = await admin
    .from("customers")
    .select("id, customer_number, name, contact_email, contact_phone, is_active, is_admin")
    .order("customer_number", { ascending: true });

  if (listError) {
    return Response.json({ error: "Could not load customers." }, { status: 500 });
  }

  // How many special prices each one has
  const { data: allPrices } = await admin.from("customer_prices").select("customer_id");
  const priceCounts = new Map();
  for (const row of allPrices || []) {
    priceCounts.set(row.customer_id, (priceCounts.get(row.customer_id) || 0) + 1);
  }

  return Response.json({
    customers: (customers || []).map((c) => ({
      ...c,
      special_price_count: priceCounts.get(c.id) || 0,
    })),
  });
}

// ------------------------------------------------- set/clear a special price
export async function POST(request) {
  const { admin, error } = await requireAdmin(request);
  if (error) return authErrorResponse(error);

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const customerId = typeof body?.customer_id === "string" ? body.customer_id : null;
  const productId = typeof body?.product_id === "string" ? body.product_id : null;
  if (!customerId || !productId) {
    return Response.json({ error: "Which customer and product?" }, { status: 400 });
  }

  // A null/empty price removes the special price (back to the base price)
  if (body.price === null || body.price === "") {
    const { error: delError } = await admin
      .from("customer_prices")
      .delete()
      .eq("customer_id", customerId)
      .eq("product_id", productId);
    if (delError) {
      return Response.json({ error: "Could not remove the price." }, { status: 500 });
    }
    return Response.json({ ok: true, removed: true });
  }

  const pounds = Number(body.price);
  if (!Number.isFinite(pounds) || pounds < 0 || pounds > 100000) {
    return Response.json({ error: "That price doesn’t look right." }, { status: 400 });
  }

  const { error: upsertError } = await admin
    .from("customer_prices")
    .upsert(
      { customer_id: customerId, product_id: productId, price_pence: Math.round(pounds * 100) },
      { onConflict: "customer_id,product_id" }
    );

  if (upsertError) {
    return Response.json({ error: "Could not save the price." }, { status: 500 });
  }

  return Response.json({ ok: true });
}

// ------------------------------------------------------ activate/deactivate
export async function PATCH(request) {
  const { admin, customer, error } = await requireAdmin(request);
  if (error) return authErrorResponse(error);

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const id = typeof body?.customer_id === "string" ? body.customer_id : null;
  if (!id) return Response.json({ error: "Which customer?" }, { status: 400 });

  // Don't let an admin lock themselves out
  if (id === customer.id && body.is_active === false) {
    return Response.json({ error: "You can’t deactivate your own account." }, { status: 400 });
  }

  const patch = {};
  if ("is_active" in body) patch.is_active = !!body.is_active;
  if (!Object.keys(patch).length) {
    return Response.json({ error: "Nothing to change." }, { status: 400 });
  }

  const { error: updateError } = await admin.from("customers").update(patch).eq("id", id);
  if (updateError) {
    return Response.json({ error: "Could not save the change." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
