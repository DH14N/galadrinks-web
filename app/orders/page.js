'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [itemsByOrder, setItemsByOrder] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) { router.replace('/login'); return; }

      // 1) load this customer's orders (RLS: only theirs)
      const { data: ordersRes, error: oErr } = await supabase
        .from('orders')
        .select('id, status, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      if (oErr) { setErr(oErr.message); setLoading(false); return; }

      setOrders(ordersRes);

      // 2) load items for these orders
      const ids = ordersRes.map(o => o.id);
      if (ids.length) {
        const { data: itemsRes, error: iErr } = await supabase
          .from('order_items')
          .select('order_id, qty, unit_price_pence, product_id, products(name, sku)')
          .in('order_id', ids)
          .order('order_id', { ascending: false })
          .returns();
        if (iErr) { setErr(iErr.message); setLoading(false); return; }

        // Group items by order_id
        const grouped = {};
        for (const it of itemsRes) {
          if (!grouped[it.order_id]) grouped[it.order_id] = [];
          grouped[it.order_id].push(it);
        }
        setItemsByOrder(grouped);
      }

      setLoading(false);
    })();
  }, [router]);

  if (loading) return <main className="min-h-screen p-6">Loading…</main>;

  return (
    <main className="min-h-screen p-6 bg-white text-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Your Orders</h1>
        <div className="flex gap-3">
          <Link href="/products" className="rounded-xl px-4 py-2 border">Products</Link>
          <Link href="/cart" className="rounded-xl px-4 py-2 border">Cart</Link>
        </div>
      </div>

      {err && <p className="text-red-600 mb-4">Error: {err}</p>}

      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map(o => {
            const items = itemsByOrder[o.id] || [];
            const totalPence = items.reduce((s, it) => s + it.qty * it.unit_price_pence, 0);
            return (
              <div key={o.id} className="rounded-2xl border p-4 bg-gray-50 shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-500">Order ID</div>
                    <div className="font-mono text-sm">{o.id}</div>
                  </div>
                  <div className="text-sm">
                    <span className="mr-2 rounded-full px-2 py-1 border">{o.status}</span>
                    {new Date(o.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="mt-3">
                  {items.length === 0 ? (
                    <div className="text-sm text-gray-500">No items</div>
                  ) : (
                    <ul className="divide-y">
                      {items.map((it, idx) => (
                        <li key={idx} className="py-2 flex justify-between">
                          <div>
                            <div className="font-medium">{it.products?.name}</div>
                            <div className="text-xs text-gray-600">{it.products?.sku}</div>
                          </div>
                          <div className="text-right">
                            <div>Qty: {it.qty}</div>
                            <div>£{(it.unit_price_pence / 100).toFixed(2)}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="mt-3 text-right font-semibold">
                  Total: £{(totalPence / 100).toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
