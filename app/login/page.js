'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [idOrEmail, setIdOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignIn(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    let email = idOrEmail.trim();
    // if it doesn't look like an email, treat it as a customer number
    if (!email.includes('@')) {
      const res = await fetch('/api/customer-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_number: email }),
      });
      if (!res.ok) {
        setLoading(false);
        setError('Customer number not found');
        return;
      }
      const json = await res.json();
      email = json.email;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else router.push('/products');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-black">
      <form onSubmit={handleSignIn} className="w-full max-w-sm bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-center text-black">Gala Drinks — Login</h1>
        <input
          className="w-full border rounded-xl p-3"
          placeholder="Customer number (e.g. 000001) or Email"
          value={idOrEmail}
          onChange={e => setIdOrEmail(e.target.value)}
          required
        />
        <input
          className="w-full border rounded-xl p-3"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-xl p-3 font-medium shadow hover:shadow-md transition bg-black text-white disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
