'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AdminOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [custById, setCustById] = useState({});
  const [itemsByOrder, setItemsByOrder] = useState({});
  const [error, setError] = useState('');
  const [q, setQ] = useState(''); // search by customer name/number/order id

  useEffect(() => {
    (async () => {
      setError('');
      setLoading(true);

      // ensure logged in
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) { window.location.href = '/login'; return; }

      // latest 200 orders
      const { data: ords, error: oErr } = await supabase
        .from('orders')
        .select('id, customer_id, status, created_at')
        .order('created_at', { ascending: false })
        .limit(200);

      if (oErr) { setError(oErr.message); setLoading(false); return; }
      setOrders(ords);

      // customers for those orders
      const custIds = Array.from(new Set(ords.map(o => o.customer_id)));
      if (custIds.length) {
        const { data: custs, error: cErr } = await supabase
          .from('customers')
          .select('id, customer_number, name')
          .in('id', custIds);
        if (cErr) { setError(cErr.message); setLoading(false); return; }
        const map = {};
        for (const c of custs) map[c.id] = c;
        setCustById(map);
      }

      // items (with product info) for those orders
      const orderIds = ords.map(o => o.id);
      if (orderIds.length) {
        const { data: items, error: iErr } = await supabase
          .from('order_items')
          .select('order_id, qty, unit_price_pence, products(name, sku)')
          .in('order_id', orderIds)
          .order('order_id');
        if (iErr) { setError(iErr.message); setLoading(false); return; }

        const byOrder = {};
        for (const it of items) {
          if (!byOrder[it.order_id]) byOrder[it.order_id] = [];
          byOrder[it.order_id].push(it);
        }
        setItemsByOrder(byOrder);
      }

      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return orders;
    return orders.filter(o => {
      const c = custById[o.customer_id] || {};
      return (
        (o.id || '').toLowerCase().includes(term) ||
        (c.customer_number || '').toLowerCase().includes(term) ||
        (c.name || '').toLowerCase().includes(term)
      );
    });
  }, [orders, custById, q]);

  const rowsForCsv = useMemo(() => {
    const rows = [];
    for (const o of filtered) {
      const cust = custById[o.customer_id] || {};
      const items = itemsByOrder[o.id] || [];
      for (const it of items) {
        rows.push({
          order_id: o.id,
          order_date: new Date(o.created_at).toISOString().slice(0, 10),
          customer_number: cust.customer_number || '',
          customer_name: cust.name || '',
          sku: it.products?.sku || '',
          product_name: it.products?.name || '',
          qty: it.qty,
          unit_price: (it.unit_price_pence / 100).toFixed(2),
          line_total: ((it.qty * it.unit_price_pence) / 100).toFixed(2),
          status: o.status,
        });
      }
    }
    return rows;
  }, [filtered, custById, itemsByOrder]);

  function downloadCsv() {
    const headers = ['order_id','order_date','customer_number','customer_name','sku','product_name','qty','unit_price','line_total','status'];
    const lines = [headers.join(',')];
    for (const r of rowsForCsv) {
      lines.push(headers.map(h => {
        const v = r[h] ?? '';
        return /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g,'""')}"` : v;
      }).join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'orders-export.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <main className="min-h-screen p-6">Loading…</main>;

  return (
    <main className="min-h-screen p-6 bg-white text-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">All Orders (Admin)</h1>
        <div className="flex gap-3">
          <input
            value={q}
            onChange={e=>setQ(e.target.value)}
            placeholder="Search order id / customer # / name"
            className="border rounded-md px-3 py-2"
          />
          <button onClick={downloadCsv} className="rounded-xl px-4 py-2 border">Download CSV</button>
          <Link href="/trade/products" className="rounded-xl px-4 py-2 border">Products</Link>
        </div>
      </div>

      {error && <p className="text-red-600 mb-4">Error: {error}</p>}

      {filtered.length === 0 ? (
        <p>No orders.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(o => {
            const cust = custById[o.customer_id] || {};
            const items = itemsByOrder[o.id] || [];
            const total = items.reduce((s, it) => s + it.qty * it.unit_price_pence, 0);
            return (
              <div key={o.id} className="rounded-2xl border p-4 bg-gray-50 shadow">
                <div className="flex justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Order</div>
                    <div className="font-mono text-sm">{o.id}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div>{new Date(o.created_at).toLocaleString()}</div>
                    <span className="ml-2 rounded-full px-2 py-1 border">{o.status}</span>
                  </div>
                </div>

                <div className="mt-2 flex justify-between text-sm">
                  <div className="text-gray-700">
                    {cust.customer_number || '—'} — {cust.name || 'Unknown'}
                  </div>
                  <div className="font-semibold">
                    Total £{(total / 100).toFixed(2)}
                  </div>
                </div>

                <div className="mt-3 flex gap-3">
                  <Link href={`/admin/orders/${o.id}/invoice`} className="rounded-xl px-3 py-2 border bg-white">
                    Invoice / Print
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
