"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, Download, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell from "@/components/admin/AdminShell";

const money = (p) => "£" + ((p || 0) / 100).toFixed(2);

const STATUSES = ["pending", "confirmed", "delivered", "cancelled"];
const statusStyle = {
  pending: "bg-gold-pale text-gold",
  confirmed: "bg-blue-50 text-blue-700",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(null);
  const [saving, setSaving] = useState(null);

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
    if (status) params.set("status", status);
    if (search) params.set("q", search);

    const res = await fetch(`/api/admin/orders?${params}`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!res.ok) { setError("Could not load orders."); setLoading(false); return; }
    const json = await res.json();
    setOrders(json.orders || []);
    setLoading(false);
  }, [status, search, token]);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(orderId, newStatus) {
    setSaving(orderId);
    const t = await token();
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ order_id: orderId, status: newStatus }),
    });
    setSaving(null);
    if (res.ok) {
      setOrders((list) => list.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    } else {
      setError("Could not update that order.");
    }
  }

  function downloadCsv() {
    const rows = [["Order", "Date", "Customer", "Account", "Status", "Product", "Qty", "Unit price", "Line total"]];
    for (const o of orders) {
      for (const l of o.lines) {
        rows.push([
          o.id.slice(0, 8).toUpperCase(),
          new Date(o.created_at).toLocaleDateString("en-GB"),
          o.customer,
          o.customer_number,
          o.status,
          l.name,
          l.qty,
          (l.unit_price_pence / 100).toFixed(2),
          ((l.qty * l.unit_price_pence) / 100).toFixed(2),
        ]);
      }
    }
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `gala-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminShell
      title="Orders"
      subtitle="Every order placed through the website."
      actions={
        <button
          onClick={downloadCsv}
          disabled={!orders.length}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium text-ink hover:border-gold hover:text-gold disabled:opacity-40"
        >
          <Download size={16} /> Download CSV
        </button>
      }
    >
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(query.trim()); }}
          className="card flex flex-1 items-center gap-3 rounded-full px-5"
        >
          <Search size={16} className="shrink-0 text-gold" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customer, account number or order reference…"
            className="w-full bg-transparent py-2.5 text-sm text-ink placeholder:text-body/50 focus:outline-none"
          />
        </form>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatus("")}
            className={!status
              ? "rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-white"
              : "rounded-full border border-line bg-white px-4 py-2 text-[13px] text-body hover:border-gold hover:text-gold"}
          >
            All
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={status === s
                ? "rounded-full bg-ink px-4 py-2 text-[13px] font-semibold capitalize text-white"
                : "rounded-full border border-line bg-white px-4 py-2 text-[13px] capitalize text-body hover:border-gold hover:text-gold"}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading && <p className="py-16 text-center text-body">Loading orders…</p>}

      {!loading && orders.length === 0 && (
        <div className="card mt-6 rounded-3xl p-12 text-center">
          <h2 className="font-display text-lg font-semibold text-ink">No orders found</h2>
          <p className="mt-2 text-sm text-body">Try a different filter or search.</p>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="card rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-display text-base font-semibold text-ink">
                  {o.customer}{" "}
                  <span className="font-sans text-[12px] font-normal text-body">
                    ({o.customer_number})
                  </span>
                </div>
                <div className="mt-0.5 text-[12px] text-body">
                  {new Date(o.created_at).toLocaleString("en-GB", {
                    day: "numeric", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                  {" · "}
                  <span className="font-mono">{o.id.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-[12px] font-semibold capitalize ${statusStyle[o.status] || "bg-paper-2 text-body"}`}>
                  {o.status}
                </span>
                <span className="font-display text-xl font-bold text-ink">
                  {money(o.total_pence)}
                </span>
                <select
                  value={o.status}
                  disabled={saving === o.id}
                  onChange={(e) => changeStatus(o.id, e.target.value)}
                  className="rounded-full border border-line bg-white px-3 py-1.5 text-[13px] capitalize text-ink focus:border-gold focus:outline-none disabled:opacity-50"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <Link
                  href={`/admin/orders/${o.id}/invoice`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-[13px] text-ink hover:border-gold hover:text-gold"
                >
                  <FileText size={14} /> Invoice
                </Link>
                <button
                  onClick={() => setOpen(open === o.id ? null : o.id)}
                  className="text-[13px] font-medium text-gold hover:underline"
                >
                  {open === o.id ? "Hide items" : `${o.lines.length} item${o.lines.length === 1 ? "" : "s"}`}
                </button>
              </div>
            </div>

            {open === o.id && (
              <ul className="mt-4 divide-y divide-line border-t border-line pt-2">
                {o.lines.map((l, i) => (
                  <li key={i} className="flex justify-between gap-4 py-2 text-sm">
                    <span className="text-body">
                      {l.qty} × {l.name}
                      {l.pack_size ? ` (${l.pack_size})` : ""}
                    </span>
                    <span className="shrink-0 font-medium text-ink">
                      {money(l.qty * l.unit_price_pence)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {o.notes && (
              <p className="mt-3 rounded-xl bg-paper-2 px-4 py-2.5 text-[13px] text-body">
                <span className="font-semibold text-ink">Note:</span> {o.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
