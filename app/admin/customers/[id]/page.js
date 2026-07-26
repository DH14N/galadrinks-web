"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Search, Trash2, Check, Plus, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell from "@/components/admin/AdminShell";

const money = (p) => (p == null ? "—" : "£" + (p / 100).toFixed(2));

export default function AdminCustomerPage() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Adding a new special price
  const [query, setQuery] = useState("");
  const [found, setFound] = useState([]);
  const [searching, setSearching] = useState(false);
  const [chosen, setChosen] = useState(null);
  const [newPrice, setNewPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const token = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token;
  }, []);

  const load = useCallback(async () => {
    const t = await token();
    if (!t) return;
    const res = await fetch(`/api/admin/customers?id=${id}`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!res.ok) { setError("Could not load this customer."); setLoading(false); return; }
    setData(await res.json());
    setLoading(false);
  }, [id, token]);

  useEffect(() => { load(); }, [load]);

  async function searchProducts(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    const t = await token();
    const res = await fetch(`/api/admin/products?q=${encodeURIComponent(query.trim())}`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    const json = await res.json();
    setFound(json.items || []);
    setSearching(false);
  }

  async function setPrice(productId, price) {
    setSaving(true);
    setError("");
    const t = await token();
    const res = await fetch("/api/admin/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ customer_id: id, product_id: productId, price }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Could not save that price.");
      return false;
    }
    await load();
    return true;
  }

  async function addSpecialPrice() {
    if (!chosen || !newPrice) return;
    const ok = await setPrice(chosen.id, newPrice);
    if (ok) {
      setSaved(true);
      setChosen(null);
      setNewPrice("");
      setFound([]);
      setQuery("");
      setTimeout(() => setSaved(false), 2000);
    }
  }

  const c = data?.customer;

  return (
    <AdminShell
      title={c?.name || "Customer"}
      subtitle={c ? `Account ${c.customer_number}` : ""}
      actions={
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium text-ink hover:border-gold hover:text-gold"
        >
          <ArrowLeft size={16} /> All customers
        </Link>
      }
    >
      {loading && <p className="py-16 text-center text-body">Loading…</p>}

      {error && (
        <p className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {c && (
        <>
          {/* Details */}
          <div className="card rounded-2xl p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-body">Email</div>
                <div className="mt-1 text-sm text-ink">{c.contact_email || "—"}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-body">Phone</div>
                <div className="mt-1 text-sm text-ink">{c.contact_phone || "—"}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-body">Status</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${c.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
                    {c.is_active ? "Active" : "Inactive"}
                  </span>
                  {c.is_admin && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold-pale px-2.5 py-1 text-[12px] font-semibold text-gold">
                      <ShieldCheck size={12} /> Staff
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Special prices */}
          <div className="card mt-6 rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold text-ink">Special prices</h2>
            <p className="mt-1 text-[13px] text-body">
              Prices agreed just for this customer. Everything else uses the base price.
            </p>

            {data.specialPrices.length === 0 ? (
              <p className="mt-4 rounded-xl bg-paper-2 px-4 py-3 text-sm text-body">
                No special prices — this customer pays the base price on everything.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-line">
                {data.specialPrices.map((sp) => {
                  const diff =
                    sp.base_price_pence == null ? null :
                    sp.price_pence < sp.base_price_pence ? "cheaper" :
                    sp.price_pence > sp.base_price_pence ? "dearer" : "same";
                  return (
                    <div key={sp.product_id} className="flex flex-wrap items-center gap-3 py-3">
                      <div className="min-w-[200px] flex-1">
                        <div className="text-sm font-medium text-ink">{sp.name}</div>
                        <div className="text-[12px] text-body">
                          Base {money(sp.base_price_pence)}
                          {diff && diff !== "same" && (
                            <span className={diff === "cheaper" ? "text-green-700" : "text-red-700"}>
                              {" "}· {diff}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="font-display text-lg font-bold text-ink">
                        {money(sp.price_pence)}
                      </div>
                      <button
                        onClick={() => setPrice(sp.product_id, null)}
                        disabled={saving}
                        title="Remove — back to the base price"
                        className="rounded-full p-2 text-body transition-colors hover:text-red-600 disabled:opacity-40"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add one */}
            <div className="mt-6 rounded-2xl border border-line bg-paper-2 p-5">
              <div className="font-display text-sm font-semibold text-ink">
                Add a special price
              </div>

              <form onSubmit={searchProducts} className="mt-3 flex gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-full border border-line bg-white px-4">
                  <Search size={15} className="shrink-0 text-gold" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for a product…"
                    className="w-full bg-transparent py-2.5 text-sm text-ink placeholder:text-body/50 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-navy-700"
                >
                  {searching ? "…" : "Find"}
                </button>
              </form>

              {found.length > 0 && !chosen && (
                <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-line bg-white">
                  {found.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setChosen(p); setNewPrice(""); }}
                      className="flex w-full items-center justify-between gap-3 border-b border-line px-4 py-2.5 text-left last:border-0 hover:bg-paper-2"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-ink">{p.name}</span>
                        <span className="block text-[12px] text-body">
                          Base {money(p.trade_price_pence)}
                        </span>
                      </span>
                      <Plus size={15} className="shrink-0 text-gold" />
                    </button>
                  ))}
                </div>
              )}

              {chosen && (
                <div className="mt-3 rounded-xl border border-gold/40 bg-white p-4">
                  <div className="text-sm font-medium text-ink">{chosen.name}</div>
                  <div className="text-[12px] text-body">
                    Base price {money(chosen.trade_price_pence)}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-body">£</span>
                    <input
                      autoFocus
                      inputMode="decimal"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value.replace(/[^\d.]/g, ""))}
                      onKeyDown={(e) => { if (e.key === "Enter") addSpecialPrice(); }}
                      placeholder="0.00"
                      className="w-28 rounded-xl border border-line bg-paper-2 px-3 py-2 text-right text-sm font-semibold text-ink focus:border-gold focus:outline-none"
                    />
                    <button
                      onClick={addSpecialPrice}
                      disabled={!newPrice || saving}
                      className="rounded-full bg-ink px-5 py-2 text-[13px] font-semibold text-white hover:bg-navy-700 disabled:opacity-40"
                    >
                      {saving ? "Saving…" : "Set price"}
                    </button>
                    <button
                      onClick={() => { setChosen(null); setNewPrice(""); }}
                      className="rounded-full border border-line px-4 py-2 text-[13px] text-body hover:text-ink"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {saved && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-gold">
                  <Check size={14} /> Saved
                </p>
              )}
            </div>
          </div>

          {/* Recent orders */}
          {data.recentOrders.length > 0 && (
            <div className="card mt-6 rounded-2xl p-6">
              <h2 className="font-display text-lg font-semibold text-ink">Recent orders</h2>
              <ul className="mt-3 divide-y divide-line">
                {data.recentOrders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-body">
                      {new Date(o.created_at).toLocaleDateString("en-GB")}
                      {" · "}
                      <span className="font-mono text-[12px]">{o.id.slice(0, 8).toUpperCase()}</span>
                    </span>
                    <span className="rounded-full bg-paper-2 px-3 py-1 text-[12px] font-medium capitalize text-body">
                      {o.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}
