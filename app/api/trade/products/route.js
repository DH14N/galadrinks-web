import {
  getCustomerFromRequest,
  authErrorResponse,
  pricesForCustomer,
} from "@/lib/tradeAuth";

// ---------------------------------------------------------------------------
// The product list for a signed-in trade customer.
//
// Searching, filtering and paging all happen in the database, so we never
// send 4,000 products to a browser. Prices are worked out on the server
// for the customer the login token belongs to.
// ---------------------------------------------------------------------------

const PER_PAGE = 24;

export async function GET(request) {
  const { admin, customer, error } = await getCustomerFromRequest(request);
  if (error) return authErrorResponse(error);

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "name";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  let query = admin
    .from("products")
    .select(
      "id, slug, name, brand, category_slug, pack_size, unit_size, case_size, abv, country, vessel, image_url, sku",
      { count: "exact" }
    )
    .eq("is_active", true);

  if (category) query = query.eq("category_slug", category);
  if (q) {
    // Match the name, brand or product code
    const safe = q.replace(/[%,]/g, " ");
    query = query.or(`name.ilike.%${safe}%,brand.ilike.%${safe}%,sku.ilike.%${safe}%`);
  }

  if (sort === "brand") query = query.order("brand", { ascending: true });
  else query = query.order("name", { ascending: true });

  const from = (page - 1) * PER_PAGE;
  const { data, count, error: queryError } = await query.range(from, from + PER_PAGE - 1);

  if (queryError) {
    return Response.json({ error: "Could not load products." }, { status: 500 });
  }

  const priceMap = await pricesForCustomer(
    admin,
    customer.id,
    data.map((p) => p.id)
  );

  const items = data.map((p) => ({
    ...p,
    price_pence: priceMap.get(p.id) ?? null,
  }));

  return Response.json({
    items,
    total: count ?? 0,
    page,
    perPage: PER_PAGE,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / PER_PAGE)),
    customer: {
      number: customer.customer_number,
      name: customer.name,
      isAdmin: customer.is_admin,
    },
  });
}
