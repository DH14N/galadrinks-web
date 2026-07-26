"use client";

import { useState } from "react";
import { Beer, Check, Plus, Minus, Phone } from "lucide-react";
import { addToBasket } from "@/lib/basket";

const money = (pence) => "£" + (pence / 100).toFixed(2);

// A product as a signed-in customer sees it: their price, a quantity
// box and an add-to-basket button.
export default function TradeProductCard({ product }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const hasPrice = product.price_pence != null;

  function handleAdd() {
    addToBasket(product.id, qty);
    setAdded(true);
    setQty(1);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="card flex flex-col overflow-hidden rounded-2xl transition-shadow duration-300 hover:shadow-lg">
      <div className="flex h-40 items-center justify-center border-b border-line bg-white p-3">
        {product.image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-contain"
          />
        ) : (
          <Beer size={48} strokeWidth={1} className="text-gold/40" />
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {product.brand && (
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
            {product.brand}
          </div>
        )}
        <h3 className="mt-1 font-display text-base font-semibold leading-snug text-ink">
          {product.name}
        </h3>

        <div className="mt-2 flex flex-wrap gap-2">
          {product.pack_size && (
            <span className="rounded-full border border-line px-2.5 py-1 text-[11px] text-body">
              {product.pack_size}
            </span>
          )}
          {product.abv && product.abv !== "0%" && (
            <span className="rounded-full border border-line px-2.5 py-1 text-[11px] text-body">
              {product.abv} ABV
            </span>
          )}
        </div>

        <div className="mt-auto pt-4">
          {hasPrice ? (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold text-ink">
                  {money(product.price_pence)}
                </span>
                <span className="text-[12px] text-body">per case</span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="flex items-center rounded-full border border-line">
                  <button
                    aria-label="Fewer"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="px-3 py-2 text-body transition-colors hover:text-gold"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    aria-label="Quantity"
                    value={qty}
                    onChange={(e) => {
                      const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
                      setQty(Number.isFinite(n) && n > 0 ? Math.min(999, n) : 1);
                    }}
                    className="w-10 bg-transparent text-center text-sm font-semibold text-ink focus:outline-none"
                  />
                  <button
                    aria-label="More"
                    onClick={() => setQty((q) => Math.min(999, q + 1))}
                    className="px-3 py-2 text-body transition-colors hover:text-gold"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  onClick={handleAdd}
                  className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                    added
                      ? "bg-gold-pale text-gold"
                      : "bg-ink text-white hover:bg-navy-700"
                  }`}
                >
                  {added ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Check size={15} /> Added
                    </span>
                  ) : (
                    "Add to basket"
                  )}
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
