// ---------------------------------------------------------------------------
// The full product catalogue — imported from the shop export by
// scripts/import-products.mjs (run `node scripts/import-products.mjs`
// again whenever the CSV files change).
//
// SERVER-SIDE ONLY: this pulls in ~4,000 products (3.6 MB), so it must
// never be imported from a "use client" component or it would be sent
// to every visitor's browser. Client components import lib/categories.js
// instead, and pages pass down only the products they actually render.
//
// The generated data contains NO prices — prices only exist in Supabase
// and are only shown inside the trade portal.
// ---------------------------------------------------------------------------

import productsData from "./products-data.json";

export { categories, getCategory, getFormat } from "./categories";

export const products = productsData;

// Brand list derived from the products, so it always stays in sync
const brandMap = new Map();
for (const p of products) {
  if (!brandMap.has(p.brandSlug)) {
    brandMap.set(p.brandSlug, { slug: p.brandSlug, name: p.brand, count: 0 });
  }
  brandMap.get(p.brandSlug).count++;
}
export const brands = [...brandMap.values()].sort((a, b) =>
  a.name.localeCompare(b.name)
);

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export function getProduct(slug) {
  return products.find((p) => p.slug === slug) || null;
}

// The No & Low range is a collection: it gathers every product flagged
// no/low alcohol (a 0.0% lager lives in Lagers AND appears here).
export function getProductsInCategory(slug) {
  if (slug === "no-low-alcohol") {
    return products.filter((p) => p.nolow || p.category === slug);
  }
  return products.filter((p) => p.category === slug);
}

export function getBrand(slug) {
  return brands.find((b) => b.slug === slug) || null;
}

export function getProductsByBrand(slug) {
  return products.filter((p) => p.brandSlug === slug);
}

// Three product images used to illustrate the homepage hero ranges.
// Slugs are hand-picked so the images stay stable; falls back to null
// if a product is ever removed.
const SHOWCASE_SLUGS = {
  beers: "kronenbourg-1664-biere-beer-lager-24x440ml-cans",
  spirits: "tanqueray-export-strength-1l",
  wines: "moet-chandon-n-v-75cl-75cl",
};

export function getShowcaseProducts() {
  const out = {};
  for (const [key, slug] of Object.entries(SHOWCASE_SLUGS)) {
    const p = getProduct(slug);
    out[key] = p ? { name: p.name, image: p.image_url || null } : null;
  }
  return out;
}

// Well-known lines for the homepage "best sellers" section
const FEATURED_KEYWORDS = [
  "peroni", "corona extra", "guinness", "smirnoff red",
  "gordon's london dry", "jack daniel's old no", "moet", "kopparberg",
];

// Categories that shouldn't headline the homepage (machines, glasses,
// and the 0.0% variants — the classic lines front the shop window)
const NOT_FEATURED = new Set([
  "bar-supplies", "kegs", "gift-sets", "miniatures", "no-low-alcohol",
]);

export function getFeaturedProducts(limit = 8) {
  const picked = [];
  const used = new Set();
  for (const keyword of FEATURED_KEYWORDS) {
    const match = products.find(
      (p) =>
        p.image_url &&
        !used.has(p.slug) &&
        !NOT_FEATURED.has(p.category) &&
        p.name.toLowerCase().includes(keyword)
    );
    if (match) {
      picked.push(match);
      used.add(match.slug);
    }
  }
  // Top up with other products that have images if any keyword missed
  for (const p of products) {
    if (picked.length >= limit) break;
    if (p.image_url && !used.has(p.slug) && !NOT_FEATURED.has(p.category)) {
      picked.push(p);
      used.add(p.slug);
    }
  }
  return picked.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Search / filter / sort / pagination used by the catalogue pages
// ---------------------------------------------------------------------------

export const PER_PAGE = 24;

// ABV strength bands used by the sidebar filter
export const ABV_BANDS = [
  { key: "af", label: "Alcohol free (0.5% or less)", test: (v) => v <= 0.5 },
  { key: "low", label: "Up to 4.5%", test: (v) => v > 0.5 && v < 4.5 },
  { key: "mid", label: "4.5% – 5.5%", test: (v) => v >= 4.5 && v <= 5.5 },
  { key: "strong", label: "5.5% – 15%", test: (v) => v > 5.5 && v < 15 },
  { key: "liqueur", label: "15% – 30%", test: (v) => v >= 15 && v < 30 },
  { key: "spirit", label: "30% and over", test: (v) => v >= 30 },
];

function abvValue(p) {
  const v = parseFloat(p.abv);
  return Number.isNaN(v) ? null : v;
}

// Groups the messy vessel/package values into three clean options
export function packagingOf(p) {
  const s = `${p.vessel || ""} ${p.name}`.toLowerCase();
  if (/keg/.test(s)) return "Kegs";
  if (/\bcans?\b/.test(s)) return "Cans";
  if (/bottle/.test(s)) return "Bottles";
  return null;
}

// Option lists with counts for the filter sidebar, computed from the
// products in the current category/search scope
function computeFacets(list) {
  const brandCounts = new Map();
  const countryCounts = new Map();
  const packCounts = new Map();
  const ownerCounts = new Map();
  const specCounts = new Map();
  const abvCounts = Object.fromEntries(ABV_BANDS.map((b) => [b.key, 0]));

  for (const p of list) {
    const b = brandCounts.get(p.brandSlug);
    if (b) b.count++;
    else brandCounts.set(p.brandSlug, { slug: p.brandSlug, name: p.brand, count: 1 });

    if (p.country) countryCounts.set(p.country, (countryCounts.get(p.country) || 0) + 1);
    if (p.owner) ownerCounts.set(p.owner, (ownerCounts.get(p.owner) || 0) + 1);
    for (const s of p.specs || []) {
      specCounts.set(s, (specCounts.get(s) || 0) + 1);
    }

    const pack = packagingOf(p);
    if (pack) packCounts.set(pack, (packCounts.get(pack) || 0) + 1);

    const v = abvValue(p);
    if (v != null) {
      const band = ABV_BANDS.find((band) => band.test(v));
      if (band) abvCounts[band.key]++;
    }
  }

  const sortEntries = (m) =>
    [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  return {
    brands: [...brandCounts.values()].sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name)
    ),
    countries: sortEntries(countryCounts),
    owners: sortEntries(ownerCounts),
    specs: sortEntries(specCounts),
    packs: ["Cans", "Bottles", "Kegs"]
      .filter((k) => packCounts.has(k))
      .map((k) => [k, packCounts.get(k)]),
    abv: ABV_BANDS.filter((b) => abvCounts[b.key] > 0).map((b) => ({
      key: b.key,
      label: b.label,
      count: abvCounts[b.key],
    })),
  };
}

export function searchProducts({
  q = "",
  category = "",
  sort = "default",
  page = 1,
  perPage = PER_PAGE,
  brands: brandSel = [],
  countries: countrySel = [],
  packs: packSel = [],
  abv: abvSel = [],
  owners: ownerSel = [],
  specs: specSel = [],
}) {
  let list = products;

  if (category === "no-low-alcohol") {
    list = list.filter((p) => p.nolow || p.category === category);
  } else if (category) {
    list = list.filter((p) => p.category === category);
  }

  const query = q.trim().toLowerCase();
  if (query) {
    const terms = query.split(/\s+/);
    list = list.filter((p) => {
      const hay = `${p.name} ${p.brand} ${p.sku || ""} ${p.barcode || ""}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }

  // Facet options/counts reflect the category + search scope,
  // before the sidebar filters narrow things down further
  const facets = computeFacets(list);

  if (brandSel.length) list = list.filter((p) => brandSel.includes(p.brandSlug));
  if (countrySel.length) list = list.filter((p) => countrySel.includes(p.country));
  if (packSel.length) list = list.filter((p) => packSel.includes(packagingOf(p)));
  if (ownerSel.length) list = list.filter((p) => ownerSel.includes(p.owner));
  if (specSel.length) {
    list = list.filter((p) => specSel.every((s) => (p.specs || []).includes(s)));
  }
  if (abvSel.length) {
    const bands = ABV_BANDS.filter((b) => abvSel.includes(b.key));
    list = list.filter((p) => {
      const v = abvValue(p);
      return v != null && bands.some((b) => b.test(v));
    });
  }

  if (sort !== "default") {
    list = [...list];
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "name-desc") list.sort((a, b) => b.name.localeCompare(a.name));
    else if (sort === "brand") list.sort((a, b) => a.brand.localeCompare(b.brand));
  }

  const size = [24, 48, 96].includes(perPage) ? perPage : PER_PAGE;
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const items = list.slice((safePage - 1) * size, safePage * size);

  return { items, total, page: safePage, totalPages, perPage: size, facets };
}
