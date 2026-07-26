"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Beer, Trash2, Plus, Minus, CheckCircle2, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import TradeHeader from "@/components/trade/TradeHeader";
import {
  getBasket, setQty, removeFromBasket, clearBasket,
} from "@/lib/basket";

const money = (pence) => "£" + (pence / 100).toFixed(2);

export default function BasketPage() {
  const router = useRouter();
  const [lines, setLines] = useState([]);      // products + prices from server
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [placed, setPlaced] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) { router.replace("/trade-login"); return; }

    const basket = getBasket();
    const qtyMap = Object.fromEntries(basket.map((i) => [i.product_id, i.qty]));
    setQuantities(qtyMap);

    if (!basket.length) { setLines([]); setLoading(false); return; }

    const res = await fetch("/api/trade/basket", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ product_ids: basket.map((i) => i.product_id) }),
    });

    if (res.status === 401) { router.replace("/trade-login"); return; }
    if (!res.ok) {
      setError("Could not load your basket.");
      setLoading(false);
      return;
    }

    const json = await res.json();
    setLines(json.items || []);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  function changeQty(productId, qty) {
    setQty(productId, qty);
    setQuantities((q) => ({ ...q, [productId]: Math.max(1, Math.min(999, qty)) }));
  }

  function remove(productId) {
    removeFromBasket(productId);
    setLines((l) => l.filter((i) => i.id !== productId));
  }

  const orderable = lines.filter((l) => l.price_pence != null && l.available);
  const subtotal = orderable.reduce(
    (sum, l) => sum + (quantities[l.id] || 1) * l.price_pence, 0
  );

  async function placeOrder() {
    setPlacing(true);
    setError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) { router.replace("/trade-login"); return; }

    // Only ids and quantities are sent — the server works out the prices
    const res = await fetch("/api/trade/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        items: orderable.map((l) => ({ product_id: l.id, qty: quantities[l.id] || 1 })),
        notes: notes.trim() || null,
      }),
    });

    const json = await res.json().catch(() => ({}));
    setPlacing(false);

    if (!res.ok) {
      setError(json.error || "Could not place your order. Please try again.");
      return;
    }

    clearBasket();
    setPlaced(json);
  }

  // ------------------------------------------------------------ order placed
  if (placed) {
    return (
      <>
        <TradeHeader />
        <main className="mx-auto max-w-2xl px-4 pb-24 pt-[130px] text-center sm:px-6">
          <CheckCircle2 size={52} className="mx-auto text-gold" strokeWidth={1.5} />
          <h1 className="mt-5 font-display text-3xl font-semibold text-ink">
            Order received
          </h1>
          <p className="mt-3 text-body">
            Thanks — we’ve got your order and the team will be in touch to
            confirm delivery.
          </p>
          <div className="card mt-8 rounded-2xl p-6 text-left">
            <div className="flex justify-between border-b border-line pb-3 text-sm">
              <span className="text-body">Order total</span>
              <span className="font-display text-lg font-bold text-ink">
                {money(placed.total_pence)}
              </span>
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {placed.lines.map((l, i) => (
                <li key={i} className="flex justify-between gap-4">
                  <span className="text-body">{l.qty} × {l.name}</span>
                  <span className="shrink-0 text-ink">{money(l.qty * l.unit_price_pence)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/trade/products" className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-navy-700">
              Order more
            </Link>
            <Link href="/trade/orders" className="rounded-full border border-line px-6 py-3 text-sm font-medium text-ink hover:border-gold hover:text-gold">
              View your orders
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <TradeHeader />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-[110px] sm:px-6">
        <Link href="/trade/products" className="inline-flex items-center gap-1.5 text-sm text-body hover:text-gold">
          <ArrowLeft size={15} /> Back to products
        </Link>

        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Your basket
        </h1>

        {loading && <p className="py-16 text-center text-body">Loading…</p>}

        {!loading && lines.length === 0 && (
          <div className="card mt-8 rounded-3xl p-12 text-center">
            <h2 className="font-display text-xl font-semibold text-ink">
              Your basket is empty
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-body">
              Browse the range and add what you need.
            </p>
            <Link
              href="/trade/products"
              className="mt-7 inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-navy-700"
            >
              Start ordering
            </Link>
          </div>
        )}

        {!loading && lines.length > 0 && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
            {/* Items */}
            <div className="space-y-4">
              {lines.map((line) => {
                const qty = quantities[line.id] || 1;
                const unavailable = line.price_pence == null || !line.available;
                return (
                  <div key={line.id} className="card flex gap-4 rounded-2xl p-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-line bg-white p-1.5">
                      {line.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={line.image_url} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <Beer size={28} strokeWidth={1} className="text-gold/40" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      {line.brand && (
                        <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
                          {line.brand}
                        </div>
                      )}
                      <div className="font-display text-sm font-semibold text-ink">
                        {line.name}
                      </div>
                      <div className="mt-0.5 text-[12px] text-body">{line.pack_size}</div>

                      {unavailable ? (
                        <div className="mt-2 text-[13px] font-medium text-red-700">
                          Price on request — call 0116 289 0111 to order this
                        </div>
                      ) : (
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <div className="flex items-center rounded-full border border-line">
                            <button
                              aria-label="Fewer"
                              onClick={() => changeQty(line.id, qty - 1)}
                              className="px-2.5 py-1.5 text-body hover:text-gold"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-9 text-center text-sm font-semibold text-ink">{qty}</span>
                            <button
                              aria-label="More"
                              onClick={() => changeQty(line.id, qty + 1)}
                              className="px-2.5 py-1.5 text-body hover:text-gold"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                          <span className="text-[13px] text-body">
                            {money(line.price_pence)} each
                          </span>
                          <span className="font-display text-base font-bold text-ink">
                            {money(qty * line.price_pence)}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      aria-label="Remove"
                      onClick={() => remove(line.id)}
                      className="shrink-0 self-start rounded-full p-2 text-body transition-colors hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="lg:sticky lg:top-[100px] lg:self-start">
              <div className="card rounded-2xl p-6">
                <h2 className="font-display text-lg font-semibold text-ink">Order summary</h2>

                <div className="mt-4 flex justify-between border-b border-line pb-4 text-sm">
                  <span className="text-body">
                    {orderable.length} {orderable.length === 1 ? "item" : "items"}
                  </span>
                  <span className="font-display text-xl font-bold text-ink">
                    {money(subtotal)}
                  </span>
                </div>

                <p className="mt-3 text-[12px] leading-relaxed text-body">
                  Prices exclude VAT where applicable. We’ll confirm your
                  delivery day when we process the order.
                </p>

                <label className="mt-5 block text-[12px] font-semibold uppercase tracking-[0.15em] text-body">
                  Notes for this order
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything we should know?"
                  className="mt-2 w-full rounded-2xl border border-line bg-paper-2 px-4 py-3 text-sm text-ink placeholder:text-body/50 focus:border-gold focus:outline-none"
                />

                {error && (
                  <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </p>
                )}

                <button
                  onClick={placeOrder}
                  disabled={placing || orderable.length === 0}
                  className="mt-5 w-full rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700 disabled:opacity-50"
                >
                  {placing ? "Placing order…" : "Place order"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
