import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import ProductGrid from "@/components/ProductGrid";
import Pagination from "@/components/Pagination";
import FilterSidebar from "@/components/FilterSidebar";
import ResultsBar from "@/components/ResultsBar";
import Reveal from "@/components/Reveal";
import PremiumButton from "@/components/PremiumButton";
import { categories, getCategory } from "@/lib/categories";
import { searchProducts } from "@/lib/catalogue";

const parseList = (v) => (v ? v.toString().split(",").filter(Boolean) : []);

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return { title: "Category not found" };
  return { title: category.name, description: category.description };
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = getCategory(slug);
  if (!category) notFound();

  const page = parseInt(sp?.page ?? "1", 10) || 1;
  const sort = (sp?.sort ?? "default").toString();
  const per = parseInt(sp?.per ?? "24", 10) || 24;
  const selected = {
    brands: parseList(sp?.brand),
    countries: parseList(sp?.country),
    packs: parseList(sp?.pack),
    abv: parseList(sp?.abv),
    owners: parseList(sp?.owner),
    specs: parseList(sp?.spec),
  };

  const results = searchProducts({
    category: slug, page, sort, perPage: per, ...selected,
  });

  // Everything the pagination/sort links need to keep in the URL
  const pageParams = {};
  if (sort !== "default") pageParams.sort = sort;
  if (per !== 24) pageParams.per = String(per);
  if (selected.brands.length) pageParams.brand = selected.brands.join(",");
  if (selected.countries.length) pageParams.country = selected.countries.join(",");
  if (selected.packs.length) pageParams.pack = selected.packs.join(",");
  if (selected.abv.length) pageParams.abv = selected.abv.join(",");
  if (selected.owners.length) pageParams.owner = selected.owners.join(",");
  if (selected.specs.length) pageParams.spec = selected.specs.join(",");

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-[165px] sm:px-6">
      {/* Heading — centred */}
      <Reveal className="text-center">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          {category.name}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-body">{category.description}</p>

        <div className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-gold/25 bg-gold-pale px-5 py-2.5 text-sm text-ink">
          <Lock size={15} className="text-gold" />
          Prices are visible to trade customers —{" "}
          <Link href="/trade-login" className="font-semibold text-gold hover:underline">
            log in here
          </Link>
        </div>
      </Reveal>

      {/* Filters + products */}
      <div className="mt-12 flex flex-col gap-x-8 lg:flex-row">
        <div className="w-full lg:w-64 lg:shrink-0">
          {/* Count sits above the filters so the filter box lines up
              with the product cards */}
          <p className="mb-6 flex h-10 items-center text-sm text-body">
            <span>
              <span className="font-semibold text-ink">{results.total}</span>{" "}
              {results.total === 1 ? "product" : "products"} in this range
              {results.totalPages > 1 && (
                <>
                  {" "}— page <span className="font-semibold text-ink">{results.page}</span> of{" "}
                  {results.totalPages}
                </>
              )}
            </span>
          </p>
          <FilterSidebar
            basePath={`/category/${slug}`}
            baseParams={{ sort, per: per !== 24 ? String(per) : "" }}
            facets={results.facets}
            selected={selected}
          />
        </div>

        <div className="min-w-0 flex-1">
          {results.total > 0 ? (
            <>
              <ResultsBar
                basePath={`/category/${slug}`}
                params={pageParams}
                sort={sort}
                per={per}
              />
              <ProductGrid products={results.items} />
              <Pagination
                basePath={`/category/${slug}`}
                params={pageParams}
                page={results.page}
                totalPages={results.totalPages}
              />
            </>
          ) : (
            <div className="card rounded-3xl p-12 text-center">
              <h2 className="font-display text-xl font-semibold text-ink">
                No products match these filters
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-body">
                Try removing a filter, or call us on 0116 289 0111 — we may
                still stock what you need.
              </p>
              <div className="mt-7">
                <PremiumButton href={`/category/${slug}`} variant="outline">
                  Clear filters
                </PremiumButton>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Other ranges */}
      <Reveal delay={0.1} className="mt-20">
        <h2 className="font-display text-xl font-semibold text-ink">Other ranges</h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {categories
            .filter((c) => c.slug !== slug)
            .map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="rounded-full border border-line px-4 py-2 text-[13px] text-body transition-all hover:border-gold/50 hover:text-gold"
              >
                {c.name}
              </Link>
            ))}
        </div>
      </Reveal>
    </div>
  );
}
