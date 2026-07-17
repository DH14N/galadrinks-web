"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserRound, KeyRound, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Trade customers sign in with their customer number (or email) + password.
// If a customer number is entered we look up the matching email on the
// server (/api/customer-email) and then sign in with Supabase Auth.
export default function TradeLoginForm() {
  const router = useRouter();
  const [idOrEmail, setIdOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignIn(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    let email = idOrEmail.trim();
    // If it doesn't look like an email, treat it as a customer number
    if (!email.includes("@")) {
      const res = await fetch("/api/customer-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_number: email }),
      });
      if (!res.ok) {
        setLoading(false);
        setError("Customer number not found. Please check and try again.");
        return;
      }
      const json = await res.json();
      email = json.email;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (authError) {
      setError("Incorrect login details. Please try again.");
    } else {
      router.push("/trade/products");
    }
  }

  return (
    <form onSubmit={handleSignIn} className="space-y-5">
      <div>
        <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.15em] text-body">
          Customer number or email
        </label>
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-paper-2 px-4 transition-colors focus-within:border-gold">
          <UserRound size={17} className="shrink-0 text-gold" />
          <input
            className="w-full bg-transparent py-3.5 text-sm text-ink placeholder:text-body/50 focus:outline-none"
            placeholder="e.g. GALA1023"
            value={idOrEmail}
            onChange={(e) => setIdOrEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.15em] text-body">
          Password
        </label>
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-paper-2 px-4 transition-colors focus-within:border-gold">
          <KeyRound size={17} className="shrink-0 text-gold" />
          <input
            className="w-full bg-transparent py-3.5 text-sm text-ink placeholder:text-body/50 focus:outline-none"
            type={showPassword ? "text" : "password"}
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((v) => !v)}
            className="shrink-0 text-body transition-colors hover:text-gold"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-ink px-6 py-3.5 text-sm font-semibold tracking-wide text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-navy-700 disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {loading ? "Signing in…" : "Sign in to your account"}
      </button>

      <p className="text-center text-sm text-body">
        Not a customer yet?{" "}
        <Link href="/contact" className="font-medium text-gold hover:underline">
          Apply for a trade account
        </Link>
      </p>
    </form>
  );
}
