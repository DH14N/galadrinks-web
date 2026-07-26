import {
  getCustomerFromRequest,
  authErrorResponse,
  pricesForCustomer,
} from "@/lib/tradeAuth";

// ---------------------------------------------------------------------------
// Places an order.
//
// SECURITY: the browser sends only product ids and quantities. Prices are
// looked up here, on the server, for the customer the login token belongs
// to. Nothing the browser claims about a price is ever trusted, so an
// order can't be placed at a price the customer invented.
// ---------------------------------------------------------------------------

const MAX_QTY = 999;

export async function POST(request) {
  const { admin, customer, error } = await getCustomerFromRequest(request);
  if (error) return authErrorResponse(error);

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const rawItems = Array.isArray(body?.items) ? body.items : [];
  const notes = typeof body?.notes === "string" ? body.notes.slice(0, 500) : null;

  // Clean up what came in: valid ids, sensible quantities, no duplicates
  const wanted = new Map();
  for (const item of rawItems) {
    const id = typeof item?.product_id === "string" ? item.product_id : null;
    const qty = Math.floor(Number(item?.qty));
    if (!id || !Number.isFinite(qty) || qty < 1) continue;
    wanted.set(id, Math.min((wanted.get(id) || 0) + qty, MAX_QTY));
  }

  if (wanted.size === 0) {
    return Response.json({ error: "Your basket is empty." }, { status: 400 });
  }

  const productIds = [...wanted.keys()];

  // Only active products can be ordered
  const { data: products, error: prodError } = await admin
    .from("products")
    .select("id, name, sku, is_active")
    .in("id", productIds)
    .eq("is_active", true);

  if (prodError) {
    return Response.json({ error: "Could not place the order." }, { status: 500 });
  }

  const priceMap = await pricesForCustomer(admin, customer.id, productIds);

  const lines = [];
  const rejected = [];
  for (const product of products) {
    const price = priceMap.get(product.id);
    if (price == null) {
      // No price agreed for this customer — can't be ordered online
      rejected.push({ name: product.name, reason: "price on request" });
      continue;
    }
    lines.push({
      product_id: product.id,
      qty: wanted.get(product.id),
      unit_price_pence: price,
      name: product.name,
    });
  }

  // Anything the customer had in their basket that no longer exists
  const foundIds = new Set(products.map((p) => p.id));
  for (const id of productIds) {
    if (!foundIds.has(id)) rejected.push({ name: "An item", reason: "no longer available" });
  }

  if (lines.length === 0) {
    return Response.json(
      { error: "None of these items can be ordered online. Please call us on 0116 289 0111.", rejected },
      { status: 400 }
    );
  }

  // Create the order
  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({ customer_id: customer.id, status: "pending", notes })
    .select("id, created_at")
    .single();

  if (orderError) {
    return Response.json({ error: "Could not place the order." }, { status: 500 });
  }

  const { error: itemsError } = await admin.from("order_items").insert(
    lines.map((l) => ({
      order_id: order.id,
      product_id: l.product_id,
      qty: l.qty,
      unit_price_pence: l.unit_price_pence,
    }))
  );

  if (itemsError) {
    // Don't leave a half-made order behind
    await admin.from("orders").delete().eq("id", order.id);
    return Response.json({ error: "Could not place the order." }, { status: 500 });
  }

  const total = lines.reduce((sum, l) => sum + l.qty * l.unit_price_pence, 0);

  return Response.json({
    ok: true,
    order_id: order.id,
    placed_at: order.created_at,
    total_pence: total,
    lines: lines.map(({ name, qty, unit_price_pence }) => ({ name, qty, unit_price_pence })),
    rejected,
  });
}
