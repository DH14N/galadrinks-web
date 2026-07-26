// ---------------------------------------------------------------------------
// This month's trade offers.
//
// Each entry finds the first active product whose name contains `match`.
// Edit this list to change what's promoted — or ask for the admin screen
// and we'll move it into the database so it can be managed on the site.
//
// Deliberately server-side only: offers are for signed-in customers.
// ---------------------------------------------------------------------------

export const MONTHLY_OFFERS = [
  { match: "cobra beer 12x660ml", deal: "Buy 5 cases, get 1 free" },
  { match: "coca cola 24", deal: "Money off every case" },
  { match: "smirnoff red label vodka 70cl", deal: "Special price this month" },
  { match: "kopparberg strawberry & lime cider 15", deal: "Buy 3 cases, save more" },
  { match: "red bull energy drink 24", deal: "Multi-buy deal on 4+ cases" },
  { match: "moet et chandon", deal: "Summer special price" },
  { match: "peroni nastro azzurro beer 24", deal: "Case deal this month" },
  { match: "guinness draught can", deal: "Buy 4 cases, save" },
];

// Looks each offer up in the database and returns it with the price this
// customer pays. Products that can't be found are skipped.
export async function resolveOffers(admin, priceLookup) {
  const found = [];

  for (const { match, deal } of MONTHLY_OFFERS) {
    const { data } = await admin
      .from("products")
      .select("id, slug, name, brand, pack_size, abv, image_url")
      .ilike("name", `%${match}%`)
      .eq("is_active", true)
      .limit(1);

    if (data?.length) found.push({ ...data[0], deal });
  }

  if (!found.length) return [];

  const prices = await priceLookup(found.map((p) => p.id));
  return found.map((p) => ({ ...p, price_pence: prices.get(p.id) ?? null }));
}
