import {
  getCustomerFromRequest,
  authErrorResponse,
  pricesForCustomer,
} from "@/lib/tradeAuth";
import {
  sendEmail,
  ORDERS_EMAIL,
  orderConfirmationEmail,
  orderNotificationEmail,
} from "@/lib/email";
import { totalsFor } from "@/lib/vat";

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
    .select("id, name, sku, pack_size, vat_rate, is_active")
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
      vat_rate: product.vat_rate ?? 20,
      name: product.name,
      pack_size: product.pack_size,
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
      vat_rate: l.vat_rate,
    }))
  );

  if (itemsError) {
    // Don't leave a half-made order behind
    await admin.from("orders").delete().eq("id", order.id);
    return Response.json({ error: "Could not place the order." }, { status: 500 });
  }

  const totals = totalsFor(lines);
  const total = totals.gross;
  const orderRef = order.id.slice(0, 8).toUpperCase();

  // Tell the office, and confirm to the customer. Wrapped so a mail
  // problem can never lose an order that's already been placed.
  try {
    const emailLines = lines.map((l) => ({
      name: l.name,
      pack_size: l.pack_size,
      qty: l.qty,
      unit_price_pence: l.unit_price_pence,
      vat_rate: l.vat_rate,
    }));

    const jobs = [
      sendEmail({
        to: ORDERS_EMAIL,
        subject: `New order ${orderRef} — ${customer.name} (${customer.customer_number})`,
        replyTo: customer.contact_email || undefined,
        html: orderNotificationEmail({
          customerName: customer.name,
          customerNumber: customer.customer_number,
          customerEmail: customer.contact_email,
          orderRef,
          lines: emailLines,
          totals,
          notes,
        }),
      }),
    ];

    if (customer.contact_email) {
      jobs.push(
        sendEmail({
          to: customer.contact_email,
          subject: `Your Gala Drinks order ${orderRef}`,
          html: orderConfirmationEmail({
            customerName: customer.name,
            orderRef,
            lines: emailLines,
            totals,
            notes,
          }),
        })
      );
    }

    await Promise.allSettled(jobs);
  } catch (err) {
    console.error("[checkout] order saved but email failed:", err.message);
  }

  return Response.json({
    ok: true,
    order_id: order.id,
    placed_at: order.created_at,
    total_pence: total,
    totals,
    lines: lines.map(({ name, qty, unit_price_pence, vat_rate }) => ({ name, qty, unit_price_pence, vat_rate })),
    rejected,
  });
}
