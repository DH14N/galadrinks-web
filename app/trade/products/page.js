"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { categories } from "@/lib/categories";
import TradeHeader from "@/components/trade/TradeHeader";
import TradeProductCard from "@/components/trade/TradeProductCard";

export default function TradeProductsPage() {
  const router = useRouter();

  const [customer, setCustomer] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // What the customer is browsing
  const [query, setQuery] = useState("");        // the box they type in
  const [search, setSearch] = useState("");      // what's actually applied
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) {
      router.replace("/trade-login");
      return;
    }

    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (category) params.set("category", category);
    if (sort !== "name") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));

    const res = await fetch(`/api/trade/products?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      router.replace("/trade-login");
      return;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Could not load products.");
      setLoading(false);
      return;
    }

    const json = await res.json();
    setResults(json);
    setCustomer(json.customer);
    setLoading(false);
  }, [search, category, sort, page, router]);

  useEffect(() => {
    load();
  }, [load]);

  function applySearch(e) {
    e.preventDefault();
    setPage(1);
    setSearch(query.trim());
  }

  function chooseCategory(slug) {
    setPage(1);
    setCategory(slug);
  }

  const pillOn = "rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-white";
  const pillOff =
    "rounded-full border border-line bg-white px-4 py-2 text-[13px] text-body transition-colors hover:border-gold hover:text-gold";

  return (
    <>
      <TradeHeader customer={customer} />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-[110px] sm:px-6">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Order products
          </h1>
          <p className="mt-2 text-body">
            Your account prices are shown. Add what you need and place your order.
          </p>
        </div>

        {/* Search + sort */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <form
            onSubmit={applySearch}
            className="card flex flex-1 items-center gap-3 rounded-full px-5 focus-within:border-gold"
          >
            <Search size={17} className="shrink-0 text-gold" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by product, brand or code…"
              className="w-full bg-transparent py-3 text-sm text-ink placeholder:text-body/50 focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-ink px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-navy-700"
            >
              Search
            </button>
          </form>

          <div className="card flex items-center gap-3 rounded-full px-5">
            <SlidersHorizontal size={16} className="shrink-0 text-gold" />
            <select
              value={sort}
              onChange={(e) => { setPage(1); setSort(e.target.value); }}
              className="bg-transparent py-3 text-sm text-ink focus:outline-none"
            >
              <option value="name">Sort: Name A–Z</option>
              <option value="brand">Sort: Brand A–Z</option>
            </select>
          </div>
        </div>

        {/* Ranges */}
        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={() => chooseCategory("")} className={!category ? pillOn : pillOff}>
            All products
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => chooseCategory(c.slug)}
              className={category === c.slug ? pillOn : pillOff}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="mt-8">
          {error && (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </p>
          )}

          {loading && (
            <p className="py-16 text-center text-body">Loading products…</p>
          )}

          {!loading && !error && results && (
            <>
              <p className="mb-6 text-sm text-body">
                Showing{" "}
                <span className="font-semibold text-ink">
                  {results.items.length ? (results.page - 1) * results.perPage + 1 : 0}–
                  {(results.page - 1) * results.perPage + results.items.length}
                </span>{" "}
                of <span className="font-semibold text-ink">{results.total}</span>{" "}
                {results.total === 1 ? "product" : "products"}
                {search && <> for <span className="font-semibold text-ink">“{search}”</span></>}
              </p>

              {results.items.length === 0 ? (
                <div className="card rounded-3xl p-12 text-center">
                  <h2 className="font-display text-xl font-semibold text-ink">
                    Nothing matched
                  </h2>
                  <p className="mx-auto mt-3 max-w-md text-sm text-body">
                    Try a different search or range — or call us on 0116 289 0111.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {results.items.map((p) => (
                    <TradeProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}

              {results.totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={results.page <= 1}
                    className="inline-flex h-10 items-center gap-1 rounded-full border border-line bg-white px-4 text-sm text-ink transition-colors hover:border-gold hover:text-gold disabled:opacity-40"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <span className="text-sm text-body">
                    Page <span className="font-semibold text-ink">{results.page}</span> of{" "}
                    {results.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(results.totalPages, p + 1))}
                    disabled={results.page >= results.totalPages}
                    className="inline-flex h-10 items-center gap-1 rounded-full border border-line bg-white px-4 text-sm text-ink transition-colors hover:border-gold hover:text-gold disabled:opacity-40"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
