import { getCustomerFromRequest, authErrorResponse } from "@/lib/tradeAuth";

// A customer's own past orders. The customer is taken from the login
// token, so nobody can request someone else's order history.
export async function GET(request) {
  const { admin, customer, error } = await getCustomerFromRequest(request);
  if (error) return authErrorResponse(error);

  const { data: orders, error: ordersError } = await admin
    .from("orders")
    .select("id, status, notes, created_at")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (ordersError) {
    return Response.json({ error: "Could not load your orders." }, { status: 500 });
  }

  if (!orders.length) return Response.json({ orders: [] });

  const { data: items } = await admin
    .from("order_items")
    .select("order_id, qty, unit_price_pence, products(name, pack_size, image_url)")
    .in("order_id", orders.map((o) => o.id));

  const byOrder = new Map();
  for (const item of items || []) {
    if (!byOrder.has(item.order_id)) byOrder.set(item.order_id, []);
    byOrder.get(item.order_id).push({
      name: item.products?.name || "Item",
      pack_size: item.products?.pack_size || null,
      image_url: item.products?.image_url || null,
      qty: item.qty,
      unit_price_pence: item.unit_price_pence,
    });
  }

  return Response.json({
    orders: orders.map((o) => {
      const lines = byOrder.get(o.id) || [];
      return {
        ...o,
        lines,
        total_pence: lines.reduce((s, l) => s + l.qty * l.unit_price_pence, 0),
      };
    }),
    customer: { number: customer.customer_number, name: customer.name, isAdmin: customer.is_admin },
  });
}
