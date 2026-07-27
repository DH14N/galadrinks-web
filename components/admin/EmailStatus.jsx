"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, MailWarning, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Shows whether the website can actually send email, and lets staff
// send themselves a test message. Sits on the admin dashboard.
//
// Until the mailbox settings are added in Vercel, orders are still saved
// but nobody is emailed — so this stays loud until it's working.
export default function EmailStatus() {
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const token = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  }, []);

  const load = useCallback(async () => {
    const t = await token();
    if (!t) return;
    const res = await fetch("/api/admin/email-check", {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (res.ok) setStatus(await res.json());
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function sendTest() {
    setSending(true);
    setResult(null);
    const t = await token();
    const res = await fetch("/api/admin/email-check", {
      method: "POST",
      headers: { Authorization: `Bearer ${t}` },
    });
    const body = await res.json().catch(() => ({}));
    setResult(res.ok
      ? { ok: true, text: `Sent to ${body.to}. Give it a minute, and check junk if it's not there.` }
      : { ok: false, text: body.error || "That didn’t send." });
    setSending(false);
    load();
  }

  if (!status) return null;

  const { settings, connection } = status;
  const working = settings.mode === "smtp" ? connection.ok : settings.mode === "resend";

  // ------------------------------------------------------- working: quiet line
  if (working) {
    return (
      <div className="card mt-5 flex flex-wrap items-center gap-3 rounded-2xl p-4">
        <CheckCircle2 size={18} className="shrink-0 text-green-600" />
        <div className="flex-1 text-[13px] text-body">
          Email is working — orders and enquiries go to{" "}
          <strong className="text-ink">{settings.ordersEmail}</strong>, sent from{" "}
          <strong className="text-ink">{settings.user || settings.from}</strong>.
        </div>
        <button
          onClick={sendTest}
          disabled={sending}
          className="shrink-0 rounded-full border border-line px-4 py-2 text-[13px] font-semibold text-ink hover:bg-paper-2 disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send test email"}
        </button>
        {result && (
          <p className={`w-full text-[13px] ${result.ok ? "text-body" : "text-red-700"}`}>
            {result.text}
          </p>
        )}
      </div>
    );
  }

  // -------------------------------------------------- not working: loud notice
  return (
    <div className="card mt-5 flex items-start gap-3 rounded-2xl border-red-200 bg-red-50 p-5">
      {settings.mode === "none"
        ? <MailWarning size={20} className="mt-0.5 shrink-0 text-red-600" />
        : <Mail size={20} className="mt-0.5 shrink-0 text-red-600" />}
      <div className="flex-1">
        <div className="font-display text-sm font-semibold text-ink">
          {settings.mode === "none"
            ? "Order emails are not switched on"
            : "The website can’t sign in to the mailbox"}
        </div>
        <p className="mt-1 text-[13px] text-body">
          Orders are still being saved and will show under Orders — but no
          confirmation goes to the customer and nothing lands in the office inbox.
        </p>

        {settings.missing.length > 0 && (
          <p className="mt-2 text-[13px] text-body">
            Still to add in Vercel:{" "}
            <span className="font-mono text-[12px] text-ink">
              {settings.missing.join(", ")}
            </span>
          </p>
        )}

        {connection.error && (
          <p className="mt-2 text-[13px] text-red-700">
            Zoho said: {connection.error}
          </p>
        )}

        {result && (
          <p className={`mt-2 text-[13px] ${result.ok ? "text-body" : "text-red-700"}`}>
            {result.text}
          </p>
        )}
      </div>
      <button
        onClick={load}
        className="shrink-0 rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-white hover:bg-navy-700"
      >
        Check again
      </button>
    </div>
  );
}
