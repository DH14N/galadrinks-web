"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

const FIELDS = [
  { name: "business", label: "Business name", type: "text", placeholder: "e.g. The Golden Lion" },
  { name: "name", label: "Your name", type: "text", placeholder: "Full name", required: true },
  { name: "email", label: "Email", type: "email", placeholder: "you@business.co.uk" },
  { name: "phone", label: "Phone", type: "tel", placeholder: "Contact number" },
];

export default function ContactForm() {
  const [values, setValues] = useState({
    business: "", name: "", email: "", phone: "", message: "", website: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function update(field, value) {
    setValues((v) => ({ ...v, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSending(true);

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    setSending(false);
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(json.error || "Something went wrong. Please call us on 0116 289 0111.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="card rounded-3xl p-10 text-center">
        <CheckCircle2 size={44} className="mx-auto text-gold" strokeWidth={1.5} />
        <h2 className="mt-4 font-display text-xl font-semibold text-ink">
          Thanks — we’ve got that
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-sm text-body">
          One of the team will get back to you shortly. If it’s urgent, give us
          a ring on <span className="font-semibold text-ink">0116 289 0111</span>.
        </p>
      </div>
    );
  }

  const input =
    "w-full rounded-2xl border border-line bg-paper-2 px-4 py-3 text-sm text-ink placeholder:text-body/60 transition-colors focus:border-gold focus:outline-none";

  return (
    <form onSubmit={submit} className="card space-y-4 rounded-3xl p-8">
      <h2 className="font-display text-xl font-semibold text-ink">Send an enquiry</h2>

      {FIELDS.map((f) => (
        <div key={f.name}>
          <label
            htmlFor={f.name}
            className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.15em] text-body"
          >
            {f.label}
          </label>
          <input
            id={f.name}
            type={f.type}
            required={f.required}
            value={values[f.name]}
            onChange={(e) => update(f.name, e.target.value)}
            placeholder={f.placeholder}
            className={input}
          />
        </div>
      ))}

      <div>
        <label
          htmlFor="message"
          className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.15em] text-body"
        >
          Message
        </label>
        <textarea
          id="message"
          rows={4}
          value={values.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="Tell us about your venue and what you're looking for…"
          className={input}
        />
      </div>

      {/* Hidden from people, catches bots */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={values.website}
        onChange={(e) => update("website", e.target.value)}
        className="hidden"
      />

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="w-full rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-navy-700 disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {sending ? "Sending…" : "Send enquiry"}
      </button>

      <p className="text-center text-[12px] text-body">
        We’ll only use these details to reply to your enquiry.
      </p>
    </form>
  );
}
