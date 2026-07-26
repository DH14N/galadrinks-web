"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Beer, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { categories } from "@/lib/categories";
import AdminShell from "@/components/admin/AdminShell";

const money = (p) => (p == null ? "" : (p / 100).toFixed(2));

function ProductsInner() {
  const searchParams = useSearchParams();

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [unpriced, setUnpriced] = useState(searchParams.get("unpriced") === "1");
  const [page, setPage] = useState(1);

  const [drafts, setDrafts] = useState({});   // productId -> typed price
  const [savedId, setSavedId] = useState(null);

  const token = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const t = await token();
    if (!t) return;

    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (category) params.set("category", category);
    if (unpriced) params.set("unpriced", "1");
    if (page > 1) params.set("page", String(page));

    const res = await fetch(`/api/admin/products?${params}`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!res.ok) { setError("Could not load products."); setLoading(false); return; }
    const json = await res.json();
    setItems(json.items || []);
    setMeta(json);
    setDrafts({});
    setLoading(false);
  }, [search, category, unpriced, page, token]);

  useEffect(() => { load(); }, [load]);

  async function savePrice(product) {
    const typed = drafts[product.id];
    if (typed === undefined) return;

    const t = await token();
    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({
        product_id: product.id,
        price: typed === "" ? null : typed,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Could not save that price.");
      return;
    }

    const { product: updated } = await res.json();
    setItems((list) =>
      list.map((p) => (p.id === updated.id ? { ...p, trade_price_pence: updated.trade_price_pence } : p))
    );
    setDrafts((d) => { const n = { ...d }; delete n[product.id]; return n; });
    setSavedId(product.id);
    setTimeout(() => setSavedId((s) => (s === product.id ? null : s)), 1800);
  }

  return (
    <AdminShell
      title="Products & prices"
      subtitle="Set the base price every customer sees. Leave a price empty for “price on request”."
    >
      {/* Controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <form
          onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(query.trim()); }}
          className="card flex flex-1 items-center gap-3 rounded-full px-5"
        >
          <Search size={16} className="shrink-0 text-gold" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product, brand or code…"
            className="w-full bg-transparent py-2.5 text-sm text-ink placeholder:text-body/50 focus:outline-none"
          />
          <button type="submit" className="shrink-0 rounded-full bg-ink px-4 py-1.5 text-[13px] font-medium text-white hover:bg-navy-700">
            Search
          </button>
        </form>

        <select
          value={category}
          onChange={(e) => { setPage(1); setCategory(e.target.value); }}
          className="card rounded-full px-5 py-2.5 text-sm text-ink focus:outline-none"
        >
          <option value="">All ranges</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>

        <label className="card inline-flex cursor-pointer items-center gap-2.5 rounded-full px-5 py-2.5 text-sm text-ink">
          <input
            type="checkbox"
            checked={unpriced}
            onChange={(e) => { setPage(1); setUnpriced(e.target.checked); }}
            className="h-4 w-4 accent-[#a87c24]"
          />
          Only unpriced
        </label>
      </div>

      {error && (
        <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading && <p className="py-16 text-center text-body">Loading products…</p>}

      {!loading && meta && (
        <>
          <p className="mt-6 text-sm text-body">
            <span className="font-semibold text-ink">{meta.total}</span>{" "}
            {meta.total === 1 ? "product" : "products"}
            {meta.totalPages > 1 && <> · page {meta.page} of {meta.totalPages}</>}
          </p>

          <div className="card mt-4 divide-y divide-line overflow-hidden rounded-2xl">
            {items.map((p) => {
              const typed = drafts[p.id];
              const dirty = typed !== undefined && typed !== money(p.trade_price_pence);
              return (
                <div key={p.id} className="flex flex-wrap items-center gap-4 p-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-line bg-white p-1">
                    {p.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.image_url} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <Beer size={20} strokeWidth={1} className="text-gold/40" />
                    )}
                  </div>

                  <div className="min-w-[200px] flex-1">
                    <div className="text-sm font-medium text-ink">{p.name}</div>
                    <div className="mt-0.5 text-[12px] text-body">
                      {p.brand}
                      {p.pack_size ? ` · ${p.pack_size}` : ""}
                      {p.sku ? ` · ${p.sku}` : ""}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-body">£</span>
                    <input
                      inputMode="decimal"
                      value={typed !== undefined ? typed : money(p.trade_price_pence)}
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [p.id]: e.target.value.replace(/[^\d.]/g, "") }))
                      }
                      onKeyDown={(e) => { if (e.key === "Enter") savePrice(p); }}
                      placeholder="—"
                      className="w-24 rounded-xl border border-line bg-paper-2 px-3 py-2 text-right text-sm font-semibold text-ink focus:border-gold focus:outline-none"
                    />
                    <button
                      onClick={() => savePrice(p)}
                      disabled={!dirty}
                      className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
                        savedId === p.id
                          ? "bg-gold-pale text-gold"
                          : dirty
                          ? "bg-ink text-white hover:bg-navy-700"
                          : "cursor-default bg-paper-2 text-body/50"
                      }`}
                    >
                      {savedId === p.id ? <Check size={15} /> : "Save"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {meta.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((n) => Math.max(1, n - 1))}
                disabled={meta.page <= 1}
                className="inline-flex h-10 items-center gap-1 rounded-full border border-line bg-white px-4 text-sm text-ink hover:border-gold hover:text-gold disabled:opacity-40"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="text-sm text-body">
                Page <span className="font-semibold text-ink">{meta.page}</span> of {meta.totalPages}
              </span>
              <button
                onClick={() => setPage((n) => Math.min(meta.totalPages, n + 1))}
                disabled={meta.page >= meta.totalPages}
                className="inline-flex h-10 items-center gap-1 rounded-full border border-line bg-white px-4 text-sm text-ink hover:border-gold hover:text-gold disabled:opacity-40"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsInner />
    </Suspense>
  );
}
