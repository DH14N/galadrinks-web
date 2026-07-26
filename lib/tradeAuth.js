import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Server-side helpers for the trade (logged-in) area.
//
// Every trade API route uses these. The customer's identity is taken from
// the login token they send — never from anything the browser claims —
// so a customer can only ever see and order their own prices.
// ---------------------------------------------------------------------------

// Full-access client. Server-only: this key bypasses database rules,
// so it must never be sent to a browser.
export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// Checks the "Authorization: Bearer <token>" header and returns the
// matching customer, or null if the token is missing/invalid/inactive.
export async function getCustomerFromRequest(request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return { error: "not-signed-in" };

  const admin = adminClient();
  if (!admin) return { error: "not-configured" };

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData?.user) return { error: "not-signed-in" };

  const { data: customer, error: custError } = await admin
    .from("customers")
    .select("id, customer_number, name, contact_email, is_active, is_admin")
    .eq("id", userData.user.id)
    .single();

  if (custError || !customer) return { error: "no-account" };
  if (!customer.is_active) return { error: "account-inactive" };

  return { admin, customer };
}

// Turns an auth failure into the right HTTP response
export function authErrorResponse(error) {
  const map = {
    "not-signed-in": [401, "Please sign in."],
    "not-configured": [503, "Service unavailable."],
    "no-account": [403, "No trade account is linked to this login."],
    "account-inactive": [403, "This account is not active. Please call us."],
  };
  const [status, message] = map[error] || [401, "Please sign in."];
  return Response.json({ error: message }, { status });
}

// The price this customer pays: their agreed price if one exists,
// otherwise the product's base trade price. Returns a Map of
// productId -> pence. Prices are ALWAYS resolved here on the server.
export async function pricesForCustomer(admin, customerId, productIds) {
  if (!productIds.length) return new Map();

  const { data: products } = await admin
    .from("products")
    .select("id, trade_price_pence")
    .in("id", productIds);

  const prices = new Map(
    (products || []).map((p) => [p.id, p.trade_price_pence])
  );

  const { data: special } = await admin
    .from("customer_prices")
    .select("product_id, price_pence")
    .eq("customer_id", customerId)
    .in("product_id", productIds);

  for (const row of special || []) {
    prices.set(row.product_id, row.price_pence);
  }

  return prices;
}
