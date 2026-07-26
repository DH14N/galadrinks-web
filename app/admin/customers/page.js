"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Users, Tag, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell from "@/components/admin/AdminShell";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) return;
    const res = await fetch("/api/admin/customers", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { setError("Could not load customers."); setLoading(false); return; }
    const json = await res.json();
    setCustomers(json.customers || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <AdminShell
      title="Customers"
      subtitle="Trade accounts and the prices agreed with each one."
    >
      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading && <p className="py-16 text-center text-body">Loading…</p>}

      {!loading && customers.length === 0 && (
        <div className="card rounded-3xl p-12 text-center">
          <Users size={38} className="mx-auto text-gold" strokeWidth={1.5} />
          <h2 className="mt-4 font-display text-lg font-semibold text-ink">No customers yet</h2>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {customers.map((c) => (
          <Link
            key={c.id}
            href={`/admin/customers/${c.id}`}
            className="card rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-display text-base font-semibold text-ink">{c.name}</div>
                <div className="mt-0.5 text-[12px] text-body">Account {c.customer_number}</div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                {c.is_admin && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold-pale px-2.5 py-1 text-[11px] font-semibold text-gold">
                    <ShieldCheck size={11} /> Staff
                  </span>
                )}
                {!c.is_active && (
                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                    Inactive
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3 space-y-0.5 text-[13px] text-body">
              {c.contact_email && <div className="truncate">{c.contact_email}</div>}
              {c.contact_phone && <div>{c.contact_phone}</div>}
            </div>

            <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-gold">
              <Tag size={12} />
              {c.special_price_count === 0
                ? "Base prices only"
                : `${c.special_price_count} special price${c.special_price_count === 1 ? "" : "s"}`}
            </div>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
