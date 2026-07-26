"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AdminShell from "@/components/admin/AdminShell";
import {
  Package, Users, ClipboardList, Tag, AlertCircle, ArrowRight,
} from "lucide-react";

const money = (p) => "£" + ((p || 0) / 100).toFixed(2);

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const token = s?.session?.access_token;
      if (!token) return;
      const res = await fetch("/api/admin/overview", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setData(await res.json());
    })();
  }, []);

  const c = data?.counts;

  const tiles = [
    { label: "Orders to action", value: c?.pendingOrders, icon: ClipboardList, href: "/admin/orders?status=pending", highlight: (c?.pendingOrders || 0) > 0 },
    { label: "Active products", value: c?.products, icon: Package, href: "/admin/products" },
    { label: "Customers", value: c?.customers, icon: Users, href: "/admin/customers" },
    { label: "Special prices set", value: c?.specialPrices, icon: Tag, href: "/admin/customers" },
  ];

  return (
    <AdminShell
      title="Dashboard"
      subtitle="Everything at a glance."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(({ label, value, icon: Icon, href, highlight }) => (
          <Link
            key={label}
            href={href}
            className={`card rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
              highlight ? "border-gold/50 bg-gold-pale/40" : ""
            }`}
          >
            <Icon size={20} className="text-gold" strokeWidth={1.8} />
            <div className="mt-3 font-display text-3xl font-bold text-ink">
              {value ?? "—"}
            </div>
            <div className="mt-0.5 text-[13px] text-body">{label}</div>
          </Link>
        ))}
      </div>

      {(c?.unpriced ?? 0) > 0 && (
        <div className="card mt-5 flex items-start gap-3 rounded-2xl border-gold/40 bg-gold-pale/40 p-5">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-gold" />
          <div className="flex-1">
            <div className="font-display text-sm font-semibold text-ink">
              {c.unpriced} product{c.unpriced === 1 ? "" : "s"} have no price
            </div>
            <p className="mt-1 text-[13px] text-body">
              Customers see “price on request” on these and can’t order them online.
            </p>
          </div>
          <Link
            href="/admin/products?unpriced=1"
            className="shrink-0 rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-white hover:bg-navy-700"
          >
            Fix these
          </Link>
        </div>
      )}

      <div className="card mt-8 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Recent orders</h2>
          <Link href="/admin/orders" className="inline-flex items-center gap-1 text-[13px] font-medium text-gold hover:underline">
            See all <ArrowRight size={14} />
          </Link>
        </div>

        {!data && <p className="py-8 text-center text-sm text-body">Loading…</p>}

        {data && data.recent.length === 0 && (
          <p className="py-8 text-center text-sm text-body">No orders yet.</p>
        )}

        {data && data.recent.length > 0 && (
          <ul className="mt-4 divide-y divide-line">
            {data.recent.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <div className="text-sm font-medium text-ink">{o.customer}</div>
                  <div className="text-[12px] text-body">
                    {o.customer_number} · {new Date(o.created_at).toLocaleDateString("en-GB")}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-paper-2 px-3 py-1 text-[12px] font-medium capitalize text-body">
                    {o.status}
                  </span>
                  <span className="font-display text-base font-bold text-ink">
                    {money(o.total_pence)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
