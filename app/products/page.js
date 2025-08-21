'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import HeaderBar from '@/components/HeaderBar';

export default function ProductsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [showFavesOnly, setShowFavesOnly] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [addingIds, setAddingIds] = useState({});
  const timersRef = useRef({});

  // ---- cart helpers ----
  function getCart() {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return []; }
  }
  function setCart(items) {
    localStorage.setItem('cart', JSON.stringify(items));
    const count = items.reduce((s, it) => s + (it.qty || 0), 0);
    setCartCount(count);
  }
  function refreshCartCount() {
    const items = getCart();
    const count = items.reduce((s, it) => s + (it.qty || 0), 0);
    setCartCount(count);
  }

  useEffect(() => {
    async function load() {
      setError('');
      setLoading(true);

      // require session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) { router.replace('/login'); return; }

      // products allowed by RLS
      const { data: prods, error: prodErr } = await supabase
        .from('products')
        .select('id, sku, name, description, category, unit')
        .order('name', { ascending: true });
      if (prodErr) { setError(prodErr.message); setLoading(false); return; }

      const ids = prods.map(p => p.id);

      // prices
      const { data: prices, error: priceErr } = ids.length
        ? await supabase.from('customer_prices')
            .select('product_id, price_pence')
            .in('product_id', ids)
        : { data: [], error: null };
      if (priceErr) { setError(priceErr.message); setLoading(false); return; }
      const priceMap = new Map(prices.map(r => [r.product_id, r.price_pence]));

      // favourites
      const { data: favs, error: favErr } = ids.length
        ? await supabase.from('customer_products')
            .select('product_id, is_favourite')
            .in('product_id', ids)
        : { data: [], error: null };
      if (favErr) { setError(favErr.message); setLoading(false); return; }
      const favMap = new Map(favs.map(r => [r.product_id, r.is_favourite]));

      // merge
      const merged = prods.map(p => ({
        ...p,
        price_pence: priceMap.get(p.id) ?? null,
        is_favourite: !!favMap.get(p.id),
      }));

      setProducts(merged);
      setLoading(false);
      refreshCartCount();
    }

    load();
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  function addToCart(p) {
    if (p.price_pence == null) return;
    const cart = getCart();
    const idx = cart.findIndex(i => i.product_id === p.id);
    if (idx >= 0) cart[idx].qty += 1;
    else cart.push({ product_id: p.id, name: p.name, sku: p.sku, price_pence: p.price_pence, qty: 1 });
    setCart(cart);

    // show "Added to cart" for 3s
    setAddingIds(prev => ({ ...prev, [p.id]: true }));
    if (timersRef.current[p.id]) clearTimeout(timersRef.current[p.id]);
    timersRef.current[p.id] = setTimeout(() => {
      setAddingIds(prev => {
        const next = { ...prev };
        delete next[p.id];
        return next;
      });
    }, 3000);
  }

  async function toggleFavourite(productId, current) {
    const { data: u } = await supabase.auth.getUser();
    const userId = u?.user?.id;
    if (!userId) { setError('Not logged in'); return; }

    const { error: upErr } = await supabase
      .from('customer_products')
      .upsert({
        customer_id: userId,
        product_id: productId,
        is_favourite: !current,
      });

    if (upErr) { setError(upErr.message); return; }

    setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_favourite: !current } : p));
  }

  const visible = showFavesOnly ? products.filter(p => p.is_favourite) : products;

  return (
    <>
      <HeaderBar
        cartCount={cartCount}
        showFavesOnly={showFavesOnly}
        onToggleFaves={setShowFavesOnly}
        onSignOut={handleSignOut}
      />

      <main className="min-h-screen p-6 bg-white text-black">
        {loading && <p>Loading…</p>}
        {error && <p className="text-red-600">Error: {error}</p>}

        {!loading && !error && (visible.length === 0 ? (
          <p>{showFavesOnly ? 'No favourites yet.' : 'No products available for your account.'}</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map(p => (
              <li key={p.id} className="rounded-2xl border p-4 bg-gray-50 shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-gray-500">{p.sku}</div>
                    <div className="font-medium text-lg">{p.name}</div>
                    <div className="text-sm text-gray-600">{p.category} • {p.unit}</div>
                  </div>
                  <button
                    title={p.is_favourite ? 'Unfavourite' : 'Favourite'}
                    className={`ml-3 text-2xl leading-none ${p.is_favourite ? 'opacity-100' : 'opacity-30'} hover:opacity-100`}
                    onClick={() => toggleFavourite(p.id, p.is_favourite)}
                  >
                    ★
                  </button>
                </div>

                {p.price_pence != null ? (
                  <div className="mt-2 text-xl font-semibold">£{(p.price_pence / 100).toFixed(2)}</div>
                ) : (
                  <div className="mt-2 text-sm text-gray-500">No price set</div>
                )}

                <button
                  className="mt-3 w-full rounded-xl border px-3 py-2 hover:bg-gray-100"
                  onClick={() => addToCart(p)}
                >
                  {addingIds[p.id] ? 'Added to cart' : 'Add to cart'}
                </button>
              </li>
            ))}
          </ul>
        ))}
      </main>
    </>
  );
}
