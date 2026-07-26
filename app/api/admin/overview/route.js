import { requireAdmin, authErrorResponse } from "@/lib/tradeAuth";

// Numbers for the admin dashboard: recent orders, customer and product
// counts, and anything needing attention.
export async function GET(request) {
  const { admin, error } = await requireAdmin(request);
  if (error) return authErrorResponse(error);

  const counts = {};

  const { count: products } = await admin
    .from("products").select("*", { count: "exact", head: true }).eq("is_active", true);
  counts.products = products ?? 0;

  const { count: unpriced } = await admin
    .from("products").select("*", { count: "exact", head: true })
    .eq("is_active", true).is("trade_price_pence", null);
  counts.unpriced = unpriced ?? 0;

  const { count: customers } = await admin
    .from("customers").select("*", { count: "exact", head: true }).eq("is_active", true);
  counts.customers = customers ?? 0;

  const { count: pending } = await admin
    .from("orders").select("*", { count: "exact", head: true }).eq("status", "pending");
  counts.pendingOrders = pending ?? 0;

  const { count: specialPrices } = await admin
    .from("customer_prices").select("*", { count: "exact", head: true });
  counts.specialPrices = specialPrices ?? 0;

  // The five most recent orders, with what they're worth
  const { data: orders } = await admin
    .from("orders")
    .select("id, status, created_at, customers(name, customer_number)")
    .order("created_at", { ascending: false })
    .limit(5);

  let recent = [];
  if (orders?.length) {
    const { data: items } = await admin
      .from("order_items")
      .select("order_id, qty, unit_price_pence")
      .in("order_id", orders.map((o) => o.id));

    const totals = new Map();
    for (const i of items || []) {
      totals.set(i.order_id, (totals.get(i.order_id) || 0) + i.qty * i.unit_price_pence);
    }
    recent = orders.map((o) => ({
      id: o.id,
      status: o.status,
      created_at: o.created_at,
      customer: o.customers?.name || "—",
      customer_number: o.customers?.customer_number || "",
      total_pence: totals.get(o.id) || 0,
    }));
  }

  return Response.json({ counts, recent });
}
