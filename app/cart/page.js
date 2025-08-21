'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  function loadCart() {
    try { setItems(JSON.parse(localStorage.getItem('cart') || '[]')); }
    catch { setItems([]); }
  }
  function saveCart(next) {
    setItems(next);
    localStorage.setItem('cart', JSON.stringify(next));
  }

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace('/login');
        return;
      }
      loadCart();
    })();
  }, [router]);

  function inc(i) {
    const next = [...items];
    next[i].qty += 1;
    saveCart(next);
  }
  function dec(i) {
    const next = [...items];
    next[i].qty = Math.max(1, next[i].qty - 1);
    saveCart(next);
  }
  function remove(i) {
    const next = items.filter((_, idx) => idx !== i);
    saveCart(next);
  }

  const subtotalPence = items.reduce((s, it) => s + it.qty * it.price_pence, 0);

  async function placeOrder() {
    if (!items.length) return;
    setError('');
    setPlacing(true);

    // get current user id for orders.customer_id
    const { data: sess } = await supabase.auth.getSession();
    const userId = sess?.session?.user?.id;
    if (!userId) { setError('Not logged in'); setPlacing(false); return; }

    // 1) create order
    const { data: order, error: oErr } = await supabase
      .from('orders')
      .insert({ customer_id: userId, status: 'pending' })
      .select('*')
      .single();

    if (oErr) { setError(oErr.message); setPlacing(false); return; }

    // 2) create order_items
    const rows = items.map(it => ({
      order_id: order.id,
      product_id: it.product_id,
      qty: it.qty,
      unit_price_pence: it.price_pence,
    }));

    const { error: oiErr } = await supabase.from('order_items').insert(rows);
    if (oiErr) { setError(oiErr.message); setPlacing(false); return; }

    // 3) clear cart and show success
    localStorage.removeItem('cart');
    setItems([]);
    setPlacing(false);
    alert('Order placed!'); // later we’ll add an orders page
    router.replace('/products');
  }

  return (
    <main className="min-h-screen p-6 bg-white text-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Your Cart</h1>
        <Link href="/products" className="rounded-xl px-4 py-2 border">Continue shopping</Link>
      </div>

      {items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div className="grid gap-4">
          {items.map((it, i) => (
            <div key={it.product_id} className="rounded-2xl border p-4 bg-gray-50 shadow flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-500">{it.sku}</div>
                <div className="font-medium">{it.name}</div>
                <div>£{(it.price_pence / 100).toFixed(2)} each</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => dec(i)} className="rounded-xl px-3 py-1 border">−</button>
                <div className="w-10 text-center">{it.qty}</div>
                <button onClick={() => inc(i)} className="rounded-xl px-3 py-1 border">+</button>
                <button onClick={() => remove(i)} className="rounded-xl px-3 py-1 border ml-3">Remove</button>
              </div>
            </div>
          ))}

          <div className="text-right text-lg font-semibold">
            Subtotal: £{(subtotalPence / 100).toFixed(2)}
          </div>

          {error && <p className="text-red-600">{error}</p>}

          <button
            onClick={placeOrder}
            disabled={placing || items.length === 0}
            className="rounded-xl px-4 py-3 border font-medium bg-black text-white disabled:opacity-50"
          >
            {placing ? 'Placing…' : 'Place order'}
          </button>
        </div>
      )}
    </main>
  );
}
