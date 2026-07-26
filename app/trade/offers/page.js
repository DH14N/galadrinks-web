"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgePercent, Beer, Check, Plus, Minus, Phone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { addToBasket } from "@/lib/basket";
import TradeHeader from "@/components/trade/TradeHeader";

const money = (p) => "£" + (p / 100).toFixed(2);

function OfferCard({ offer }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const hasPrice = offer.price_pence != null;

  function add() {
    addToBasket(offer.id, qty);
    setAdded(true);
    setQty(1);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="card relative flex flex-col overflow-hidden rounded-2xl border-gold/40">
      <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1.5 text-[11px] font-bold text-white shadow-sm">
        <BadgePercent size={12} /> {offer.deal}
      </span>

      <div className="flex h-44 items-center justify-center border-b border-line bg-white p-3 pt-12">
        {offer.image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={offer.image_url} alt={offer.name} loading="lazy" className="h-full w-full object-contain" />
        ) : (
          <Beer size={44} strokeWidth={1} className="text-gold/40" />
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {offer.brand && (
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
            {offer.brand}
          </div>
        )}
        <h3 className="mt-1 font-display text-base font-semibold leading-snug text-ink">
          {offer.name}
        </h3>
        {offer.pack_size && (
          <div className="mt-2">
            <span className="rounded-full border border-line px-2.5 py-1 text-[11px] text-body">
              {offer.pack_size}
            </span>
          </div>
        )}

        <div className="mt-auto pt-4">
          {hasPrice ? (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold text-ink">
                  {money(offer.price_pence)}
                </span>
                <span className="text-[12px] text-body">per case</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex items-center rounded-full border border-line">
                  <button aria-label="Fewer" onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 text-body hover:text-gold">
                    <Minus size={14} />
                  </button>
                  <span className="w-9 text-center text-sm font-semibold text-ink">{qty}</span>
                  <button aria-label="More" onClick={() => setQty((q) => Math.min(999, q + 1))} className="px-3 py-2 text-body hover:text-gold">
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  onClick={add}
                  className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                    added ? "bg-gold-pale text-gold" : "bg-ink text-white hover:bg-navy-700"
                  }`}
                >
                  {added ? (
                    <span className="inline-flex items-center gap-1.5"><Check size={15} /> Added</span>
                  ) : "Add to basket"}
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-line bg-paper-2 px-4 py-3">
              <div className="text-sm font-semibold text-ink">Price on request</div>
              <div className="mt-0.5 inline-flex items-center gap-1.5 text-[12px] text-body">
                <Phone size={12} /> Call 0116 289 0111
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TradeOffersPage() {
  const router = useRouter();
  const [offers, setOffers] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) { router.replace("/trade-login"); return; }

      const res = await fetch("/api/trade/offers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { router.replace("/trade-login"); return; }
      if (!res.ok) { setError("Could not load this month’s offers."); setLoading(false); return; }

      const json = await res.json();
      setOffers(json.offers || []);
      setCustomer(json.customer || null);
      setLoading(false);
    })();
  }, [router]);

  const month = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <>
      <TradeHeader customer={customer} />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-[110px] sm:px-6">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold-pale px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-gold">
            <BadgePercent size={14} /> {month}
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            This month’s offers
          </h1>
          <p className="mt-2 text-body">
            Deals available on your account. Prices shown are yours.
          </p>
        </div>

        {loading && <p className="py-16 text-center text-body">Loading offers…</p>}

        {error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </p>
        )}

        {!loading && !error && offers.length === 0 && (
          <div className="card rounded-3xl p-12 text-center">
            <BadgePercent size={38} className="mx-auto text-gold" strokeWidth={1.5} />
            <h2 className="mt-4 font-display text-lg font-semibold text-ink">
              No offers running right now
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-body">
              Check back soon, or call the office on 0116 289 0111 to ask what’s on deal.
            </p>
            <Link
              href="/trade/products"
              className="mt-7 inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-navy-700"
            >
              Browse all products
            </Link>
          </div>
        )}

        {offers.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {offers.map((o) => (
              <OfferCard key={o.id} offer={o} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
