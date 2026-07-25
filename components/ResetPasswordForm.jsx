"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Lets a customer choose a new password after clicking the emailed
// reset link. Supabase creates a temporary signed-in session from the
// link, so we only need to save the new password.
export default function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);   // is there a valid session?
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // The link puts a recovery session in place; wait for it to appear
  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data?.session) setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady(true);
    });

    // Give the link a moment to be processed before showing the warning
    const timer = setTimeout(() => setReady((v) => v || false), 1500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      sub?.subscription?.unsubscribe();
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

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
      setError(
        updateError.message?.includes("session")
          ? "This reset link has expired. Please request a new one."
          : "Could not save the new password. Please try again."
      );
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/trade/products"), 1800);
  }

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle2 size={40} className="mx-auto text-gold" strokeWidth={1.6} />
        <p className="mt-4 font-display text-lg font-semibold text-ink">
          Password updated
        </p>
        <p className="mt-2 text-sm text-body">Taking you to your account…</p>
      </div>
    );
  }

  const field =
    "w-full bg-transparent py-3.5 text-sm text-ink placeholder:text-body/50 focus:outline-none";
  const wrap =
    "flex items-center gap-3 rounded-2xl border border-line bg-paper-2 px-4 transition-colors focus-within:border-gold";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.15em] text-body">
          New password
        </label>
        <div className={wrap}>
          <KeyRound size={17} className="shrink-0 text-gold" />
          <input
            className={field}
            type={show ? "text" : "password"}
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            placeholder="Type it again"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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

      {!ready && (
        <p className="rounded-xl border border-gold/30 bg-gold-pale px-4 py-3 text-sm text-ink">
          Open this page from the reset link in your email. If you came here
          directly, request a new link from the{" "}
          <Link href="/trade-login" className="font-semibold text-gold hover:underline">
            trade login page
          </Link>
          .
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-full bg-ink px-6 py-3.5 text-sm font-semibold tracking-wide text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-navy-700 disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {saving ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
