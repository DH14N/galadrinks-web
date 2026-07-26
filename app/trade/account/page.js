"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  KeyRound, Eye, EyeOff, Check, ShieldCheck, Phone, Mail, Hash, Building2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import TradeHeader from "@/components/trade/TradeHeader";

const money = (p) => "£" + ((p || 0) / 100).toFixed(2);

export default function TradeAccountPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Change password
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const token = s?.session?.access_token;
      if (!token) { router.replace("/trade-login"); return; }

      const res = await fetch("/api/trade/account", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { router.replace("/trade-login"); return; }
      if (res.ok) setData(await res.json());
      setLoading(false);
    })();
  }, [router]);

  async function changePassword(e) {
    e.preventDefault();
    setError("");
    setSaved(false);

    if (password.length < 8) {
      setError("Please use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don’t match.");
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (updateError) {
      setError("Could not change your password. Please try again.");
      return;
    }

    setPassword("");
    setConfirm("");
    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
  }

  const c = data?.customer;
  const s = data?.summary;

  const field =
    "w-full bg-transparent py-3.5 text-sm text-ink placeholder:text-body/50 focus:outline-none";
  const wrap =
    "flex items-center gap-3 rounded-2xl border border-line bg-paper-2 px-4 transition-colors focus-within:border-gold";

  return (
    <>
      <TradeHeader customer={c ? { name: c.name, number: c.number, isAdmin: c.isAdmin } : null} />
      <main className="mx-auto max-w-4xl px-4 pb-24 pt-[110px] sm:px-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Your account
        </h1>
        <p className="mt-2 text-body">Your details and password.</p>

        {loading && <p className="py-16 text-center text-body">Loading…</p>}

        {c && (
          <>
            {/* Details */}
            <div className="card mt-8 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-ink">Account details</h2>
                {c.isAdmin && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-pale px-3 py-1 text-[12px] font-semibold text-gold">
                    <ShieldCheck size={12} /> Staff access
                  </span>
                )}
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {[
                  { icon: Building2, label: "Business", value: c.name },
                  { icon: Hash, label: "Customer number", value: c.number },
                  { icon: Mail, label: "Email", value: c.email || "—" },
                  { icon: Phone, label: "Phone", value: c.phone || "—" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <Icon size={17} className="mt-0.5 shrink-0 text-gold" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-body">
                        {label}
                      </div>
                      <div className="mt-0.5 truncate text-sm font-medium text-ink">{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-5 rounded-xl bg-paper-2 px-4 py-3 text-[13px] text-body">
                Need to change your business details or add a delivery address?
                Call the office on{" "}
                <span className="font-semibold text-ink">0116 289 0111</span>.
              </p>
            </div>

            {/* Ordering summary */}
            {s && (
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="card rounded-2xl p-5">
                  <div className="font-display text-2xl font-bold text-ink">{s.orderCount}</div>
                  <div className="mt-0.5 text-[13px] text-body">
                    {s.orderCount === 1 ? "Order placed" : "Orders placed"}
                  </div>
                </div>
                <div className="card rounded-2xl p-5">
                  <div className="font-display text-2xl font-bold text-ink">
                    {money(s.totalSpendPence)}
                  </div>
                  <div className="mt-0.5 text-[13px] text-body">Ordered online</div>
                </div>
                <div className="card rounded-2xl p-5">
                  <div className="font-display text-2xl font-bold text-ink">
                    {s.lastOrder
                      ? new Date(s.lastOrder).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                      : "—"}
                  </div>
                  <div className="mt-0.5 text-[13px] text-body">Last order</div>
                </div>
              </div>
            )}

            {/* Password */}
            <div className="card mt-6 rounded-2xl p-6">
              <h2 className="font-display text-lg font-semibold text-ink">Change your password</h2>
              <p className="mt-1 text-[13px] text-body">
                Use at least 8 characters. You’ll stay signed in on this device.
              </p>

              <form onSubmit={changePassword} className="mt-5 max-w-md space-y-4">
                <div>
                  <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.15em] text-body">
                    New password
                  </label>
                  <div className={wrap}>
                    <KeyRound size={17} className="shrink-0 text-gold" />
                    <input
                      className={field}
                      type={show ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      aria-label={show ? "Hide password" : "Show password"}
                      onClick={() => setShow((v) => !v)}
                      className="shrink-0 text-body transition-colors hover:text-gold"
                    >
                      {show ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.15em] text-body">
                    Confirm new password
                  </label>
                  <div className={wrap}>
                    <KeyRound size={17} className="shrink-0 text-gold" />
                    <input
                      className={field}
                      type={show ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Type it again"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </p>
                )}

                {saved && (
                  <p className="inline-flex items-center gap-2 rounded-xl border border-gold/30 bg-gold-pale px-4 py-3 text-sm font-medium text-ink">
                    <Check size={16} className="text-gold" /> Password changed.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-700 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Change password"}
                </button>
              </form>
            </div>

            <div className="mt-8 text-center">
              <Link href="/trade/products" className="text-sm font-medium text-gold hover:underline">
                Back to ordering
              </Link>
            </div>
          </>
        )}
      </main>
    </>
  );
}
