import {
  getCustomerFromRequest,
  authErrorResponse,
  pricesForCustomer,
} from "@/lib/tradeAuth";

// Given the product ids in a customer's basket, returns those products
// with the price that customer actually pays. Prices are always resolved
// here rather than remembered in the browser.
export async function POST(request) {
  const { admin, customer, error } = await getCustomerFromRequest(request);
  if (error) return authErrorResponse(error);

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const ids = Array.isArray(body?.product_ids)
    ? body.product_ids.filter((i) => typeof i === "string").slice(0, 200)
    : [];

  if (!ids.length) return Response.json({ items: [] });

  const { data: products, error: prodError } = await admin
    .from("products")
    .select("id, slug, name, brand, pack_size, image_url, sku, is_active")
    .in("id", ids);

  if (prodError) {
    return Response.json({ error: "Could not load your basket." }, { status: 500 });
  }

  const priceMap = await pricesForCustomer(admin, customer.id, ids);

  const items = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    pack_size: p.pack_size,
    image_url: p.image_url,
    sku: p.sku,
    available: p.is_active,
    price_pence: priceMap.get(p.id) ?? null,
  }));

  // Anything asked for that no longer exists at all
  const found = new Set(products.map((p) => p.id));
  const missing = ids.filter((id) => !found.has(id));

  return Response.json({ items, missing });
}
