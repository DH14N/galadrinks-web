'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ProductsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setError('');
      setLoading(true);

      // 1) require a session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace('/login');
        return;
      }

      // 2) load allowed products
      const { data: prods, error: prodErr } = await supabase
        .from('products')
        .select('id, sku, name, description, category, unit')
        .order('name', { ascending: true });

      if (prodErr) {
        setError(prodErr.message);
        setLoading(false);
        return;
      }

      // 3) load per-customer prices for those products
      const ids = prods.map(p => p.id);
      let priceMap = new Map();
      if (ids.length) {
        const { data: prices, error: priceErr } = await supabase
          .from('customer_prices')
          .select('product_id, price_pence')
          .in('product_id', ids);

        if (priceErr) {
          setError(priceErr.message);
          setLoading(false);
          return;
        }
        prices.forEach(row => priceMap.set(row.product_id, row.price_pence));
      }

      const merged = prods.map(p => ({
        ...p,
        price_pence: priceMap.get(p.id) ?? null,
      }));

      setProducts(merged);
      setLoading(false);
    }

    load();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <main className="min-h-screen p-6 bg-white text-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Products</h1>
        <button onClick={handleSignOut} className="rounded-xl px-4 py-2 border">
          Sign out
        </button>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {!loading && !error && (products.length === 0 ? (
        <p>No products available for your account.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(p => (
            <li key={p.id} className="rounded-2xl border p-4 bg-white">
              <div className="text-sm text-gray-500">{p.sku}</div>
              <div className="font-medium text-lg">{p.name}</div>
              <div className="text-sm text-gray-600">{p.category} • {p.unit}</div>
              {p.price_pence != null ? (
                <div className="mt-2 text-xl font-semibold">
                  £{(p.price_pence / 100).toFixed(2)}
                </div>
              ) : (
                <div className="mt-2 text-sm text-gray-500">No price set</div>
              )}
              <button
                className="mt-3 w-full rounded-xl border px-3 py-2 hover:bg-gray-50"
                onClick={() => alert(`(next step) Add to cart: ${p.name}`)}
              >
                Add to cart
              </button>
            </li>
          ))}
        </ul>
      ))}
    </main>
  );
}
