import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";
import Pagination from "@/components/Pagination";
import CatalogueControls from "@/components/CatalogueControls";
import FilterSidebar from "@/components/FilterSidebar";
import Reveal from "@/components/Reveal";
import { categories } from "@/lib/categories";
import { searchProducts } from "@/lib/catalogue";

export const metadata = {
  title: "Products",
  description:
    "Browse the full Gala Drinks wholesale range. Trade customers log in to view prices.",
};

const parseList = (v) => (v ? v.toString().split(",").filter(Boolean) : []);

// Builds a category pill link that keeps the current search/sort
function pillHref(params, categorySlug) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.sort && params.sort !== "name") sp.set("sort", params.sort);
  if (categorySlug) sp.set("category", categorySlug);
  const qs = sp.toString();
  return qs ? `/products?${qs}` : "/products";
}

export default async function ProductsPage({ searchParams }) {
  const sp = await searchParams;
  const q = (sp?.q ?? "").toString();
  const category = (sp?.category ?? "").toString();
  const sort = (sp?.sort ?? "name").toString();
  const page = parseInt(sp?.page ?? "1", 10) || 1;
  const selected = {
    brands: parseList(sp?.brand),
    countries: parseList(sp?.country),
    packs: parseList(sp?.pack),
    abv: parseList(sp?.abv),
    owners: parseList(sp?.owner),
    specs: parseList(sp?.spec),
  };

  const results = searchProducts({ q, category, sort, page, ...selected });

  // Everything the pagination links need to keep in the URL
  const params = { q, category, sort };
  if (selected.brands.length) params.brand = selected.brands.join(",");
  if (selected.countries.length) params.country = selected.countries.join(",");
  if (selected.packs.length) params.pack = selected.packs.join(",");
  if (selected.abv.length) params.abv = selected.abv.join(",");
  if (selected.owners.length) params.owner = selected.owners.join(",");
  if (selected.specs.length) params.spec = selected.specs.join(",");

  const pillOn =
    "rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-white";
  const pillOff =
    "rounded-full border border-line bg-white px-4 py-2 text-[13px] text-body transition-colors hover:border-gold hover:text-gold";

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-[192px] sm:px-6">
      {/* Page heading — centred */}
      <Reveal className="mx-auto max-w-2xl text-center">
        <div className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold">
          Product Catalogue
        </div>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Browse the full range
        </h1>
        <p className="mt-4 text-body">
          Every product we stock, in one place. Trade customers log in to see
          prices and add to basket.
        </p>
      </Reveal>

      {/* Search + sort + category pills */}
      <div className="mt-10 space-y-5">
        <CatalogueControls basePath="/products" q={q} sort={sort} category={category} />
        <div className="flex flex-wrap gap-2">
          <Link href={pillHref(params, "")} className={!category ? pillOn : pillOff}>
            All products
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={pillHref(params, c.slug)}
              className={category === c.slug ? pillOn : pillOff}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Filters + results */}
      <div className="mt-10 flex flex-col gap-8 lg:flex-row">
        <div className="w-full lg:w-64 lg:shrink-0">
          <FilterSidebar
            basePath="/products"
            baseParams={{ q, sort, category }}
            facets={results.facets}
            selected={selected}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-6 text-sm text-body">
            Showing{" "}
            <span className="font-semibold text-ink">
              {results.items.length ? (results.page - 1) * 24 + 1 : 0}–
              {(results.page - 1) * 24 + results.items.length}
            </span>{" "}
            of <span className="font-semibold text-ink">{results.total}</span>{" "}
            {results.total === 1 ? "product" : "products"}
            {q && (
              <>
                {" "}for <span className="font-semibold text-ink">“{q}”</span>
              </>
            )}
          </p>
          <ProductGrid products={results.items} />
          <Pagination
            basePath="/products"
            params={params}
            page={results.page}
            totalPages={results.totalPages}
          />
        </div>
      </div>
    </div>
  );
}
