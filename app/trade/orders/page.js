"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Beer, ClipboardList } from "lucide-react";
import { supabase } from "@/lib/supabase";
import TradeHeader from "@/components/trade/TradeHeader";

const money = (pence) => "£" + (pence / 100).toFixed(2);

const statusStyle = {
  pending: "bg-gold-pale text-gold",
  confirmed: "bg-green-100 text-green-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-700",
};

export default function TradeOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) { router.replace("/trade-login"); return; }

      const res = await fetch("/api/trade/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { router.replace("/trade-login"); return; }
      if (!res.ok) { setError("Could not load your orders."); setLoading(false); return; }

      const json = await res.json();
      setOrders(json.orders || []);
      setCustomer(json.customer || null);
      setLoading(false);
    })();
  }, [router]);

  return (
    <>
      <TradeHeader customer={customer} />
      <main className="mx-auto max-w-4xl px-4 pb-24 pt-[110px] sm:px-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Your orders
        </h1>
        <p className="mt-2 text-body">Everything you’ve ordered through the website.</p>

        {loading && <p className="py-16 text-center text-body">Loading…</p>}

        {error && (
          <p className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </p>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="card mt-8 rounded-3xl p-12 text-center">
            <ClipboardList size={40} className="mx-auto text-gold" strokeWidth={1.5} />
            <h2 className="mt-4 font-display text-xl font-semibold text-ink">
              No orders yet
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-body">
              When you place an order it’ll appear here.
            </p>
            <Link
              href="/trade/products"
              className="mt-7 inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-navy-700"
            >
              Start ordering
            </Link>
          </div>
        )}

        <div className="mt-8 space-y-5">
          {orders.map((order) => (
            <div key={order.id} className="card rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                <div>
                  <div className="font-display text-base font-semibold text-ink">
                    {new Date(order.created_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] text-body">
                    {order.id.slice(0, 8).toUpperCase()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-[12px] font-semibold capitalize ${
                      statusStyle[order.status] || "bg-paper-2 text-body"
                    }`}
                  >
                    {order.status}
                  </span>
                  <span className="font-display text-xl font-bold text-ink">
                    {money(order.total_pence)}
                  </span>
                </div>
              </div>

              <ul className="mt-4 space-y-3">
                {order.lines.map((line, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-line bg-white p-1">
                      {line.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={line.image_url} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <Beer size={18} strokeWidth={1} className="text-gold/40" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink">{line.name}</div>
                      <div className="text-[12px] text-body">
                        {line.qty} × {money(line.unit_price_pence)}
                        {line.pack_size ? ` · ${line.pack_size}` : ""}
                      </div>
                    </div>
                    <div className="shrink-0 text-sm font-semibold text-ink">
                      {money(line.qty * line.unit_price_pence)}
                    </div>
                  </li>
                ))}
              </ul>

              {order.notes && (
                <p className="mt-4 rounded-xl bg-paper-2 px-4 py-3 text-[13px] text-body">
                  <span className="font-semibold text-ink">Your note:</span> {order.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
