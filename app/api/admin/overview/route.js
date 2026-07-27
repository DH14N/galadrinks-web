import { requireAdmin, authErrorResponse } from "@/lib/tradeAuth";

// Numbers for the admin dashboard: recent orders, customer and product
// counts, and anything needing attention.
export async function GET(request) {
  const { admin, error } = await requireAdmin(request);
  if (error) return authErrorResponse(error);

  // All of these are independent, so run them at the same time rather
  // than waiting for each in turn (this page was taking ~10s).
  const [
    productsRes, unpricedRes, customersRes, pendingRes, specialRes, ordersRes,
  ] = await Promise.all([
    admin.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
    admin.from("products").select("*", { count: "exact", head: true })
      .eq("is_active", true).is("trade_price_pence", null),
    admin.from("customers").select("*", { count: "exact", head: true }).eq("is_active", true),
    admin.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("customer_prices").select("*", { count: "exact", head: true }),
    admin.from("orders")
      .select("id, status, created_at, customers(name, customer_number)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const counts = {
    products: productsRes.count ?? 0,
    unpriced: unpricedRes.count ?? 0,
    customers: customersRes.count ?? 0,
    pendingOrders: pendingRes.count ?? 0,
    specialPrices: specialRes.count ?? 0,
  };

  const orders = ordersRes.data;

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
