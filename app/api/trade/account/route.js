import { getCustomerFromRequest, authErrorResponse } from "@/lib/tradeAuth";

// The signed-in customer's own account details, plus a summary of
// their ordering. Only ever returns the account the token belongs to.
export async function GET(request) {
  const { admin, customer, error } = await getCustomerFromRequest(request);
  if (error) return authErrorResponse(error);

  const { data: orders } = await admin
    .from("orders")
    .select("id, status, created_at")
    .eq("customer_id", customer.id);

  let spend = 0;
  if (orders?.length) {
    const { data: items } = await admin
      .from("order_items")
      .select("qty, unit_price_pence")
      .in("order_id", orders.map((o) => o.id));
    spend = (items || []).reduce((s, i) => s + i.qty * i.unit_price_pence, 0);
  }

  return Response.json({
    customer: {
      number: customer.customer_number,
      name: customer.name,
      email: customer.contact_email,
      phone: customer.contact_phone,
      isAdmin: customer.is_admin,
    },
    summary: {
      orderCount: orders?.length || 0,
      lastOrder: orders?.length
        ? orders.map((o) => o.created_at).sort().reverse()[0]
        : null,
      totalSpendPence: spend,
    },
  });
}
