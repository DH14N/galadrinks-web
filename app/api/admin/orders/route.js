import { requireAdmin, authErrorResponse } from "@/lib/tradeAuth";
import { totalsFor } from "@/lib/vat";

const VALID_STATUS = ["pending", "confirmed", "delivered", "cancelled"];

// ---------------------------------------------------------------- list
export async function GET(request) {
  const { admin, error } = await requireAdmin(request);
  if (error) return authErrorResponse(error);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";
  const q = (searchParams.get("q") || "").trim();

  let query = admin
    .from("orders")
    .select("id, status, notes, created_at, exported_to_sage, customers(id, name, customer_number)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (status && VALID_STATUS.includes(status)) query = query.eq("status", status);

  const { data: orders, error: listError } = await query;
  if (listError) {
    return Response.json({ error: "Could not load orders." }, { status: 500 });
  }

  let rows = orders || [];

  // Search by customer name/number or order reference
  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter(
      (o) =>
        o.customers?.name?.toLowerCase().includes(needle) ||
        o.customers?.customer_number?.toLowerCase().includes(needle) ||
        o.id.toLowerCase().startsWith(needle)
    );
  }

  let withTotals = [];
  if (rows.length) {
    const { data: items } = await admin
      .from("order_items")
      .select("order_id, qty, unit_price_pence, vat_rate, products(name, pack_size)")
      .in("order_id", rows.map((o) => o.id));

    const byOrder = new Map();
    for (const i of items || []) {
      if (!byOrder.has(i.order_id)) byOrder.set(i.order_id, []);
      byOrder.get(i.order_id).push({
        name: i.products?.name || "Item",
        pack_size: i.products?.pack_size || null,
        qty: i.qty,
        unit_price_pence: i.unit_price_pence,
        vat_rate: i.vat_rate ?? 20,
      });
    }

    withTotals = rows.map((o) => {
      const lines = byOrder.get(o.id) || [];
      return {
        id: o.id,
        status: o.status,
        notes: o.notes,
        created_at: o.created_at,
        exported: o.exported_to_sage,
        customer: o.customers?.name || "—",
        customer_number: o.customers?.customer_number || "",
        lines,
        totals: totalsFor(lines),
        total_pence: totalsFor(lines).gross,
      };
    });
  }

  return Response.json({ orders: withTotals });
}

// ------------------------------------------------------- change a status
export async function PATCH(request) {
  const { admin, error } = await requireAdmin(request);
  if (error) return authErrorResponse(error);

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const id = typeof body?.order_id === "string" ? body.order_id : null;
  const status = typeof body?.status === "string" ? body.status : null;

  if (!id || !VALID_STATUS.includes(status)) {
    return Response.json({ error: "Invalid order or status." }, { status: 400 });
  }

  const { error: updateError } = await admin
    .from("orders")
    .update({ status })
    .eq("id", id);

  if (updateError) {
    return Response.json({ error: "Could not update the order." }, { status: 500 });
  }

  return Response.json({ ok: true, order_id: id, status });
}
