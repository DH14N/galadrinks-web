"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import AdminShell from "@/components/admin/AdminShell";
import { Search, X, SkipForward, Undo2, CheckCircle2 } from "lucide-react";

const money = (p) => (p == null ? "—" : "£" + (p / 100).toFixed(2));

export default function SageMatching() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [last, setLast] = useState(null);          // for undo
  const [searching, setSearching] = useState(false);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const searchBox = useRef(null);

  const token = useCallback(async () => {
    const { data: s } = await supabase.auth.getSession();
    return s?.session?.access_token || null;
  }, []);

  const load = useCallback(async () => {
    const t = await token();
    if (!t) return;
    const res = await fetch("/api/admin/sage?action=next", {
      headers: { Authorization: `Bearer ${t}` },
    });
    const body = await res.json();
    if (!res.ok) { setError(body.error || "Couldn’t load."); return; }
    setData(body);
    setSearching(false);
    setTerm("");
    setResults([]);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function decide(action, productId) {
    if (!data?.item || busy) return;
    setBusy(true);
    setError("");

    const t = await token();
    const res = await fetch("/api/admin/sage", {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify({ code: data.item.code, action, product_id: productId }),
    });
    const body = await res.json();

    if (!res.ok) { setError(body.error || "That didn’t save."); setBusy(false); return; }

    setLast({ code: data.item.code, description: data.item.description });
    setBusy(false);
    load();
  }

  async function undo() {
    if (!last || busy) return;
    setBusy(true);
    const t = await token();
    await fetch("/api/admin/sage", {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify({ code: last.code, action: "reset" }),
    });
    setLast(null);
    setBusy(false);
    load();
  }

  async function runSearch(e) {
    e?.preventDefault();
    const t = await token();
    const res = await fetch(`/api/admin/sage?action=search&q=${encodeURIComponent(term)}`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    const body = await res.json();
    setResults(body.results || []);
  }

  // Number keys pick a suggestion — over 800 decisions it's much quicker
  // than moving the mouse each time.
  useEffect(() => {
    function onKey(e) {
      if (searching || busy || !data?.item) return;
      if (e.target.tagName === "INPUT") return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= (data.candidates?.length || 0)) {
        decide("match", data.candidates[n - 1].id);
      } else if (e.key.toLowerCase() === "s") {
        decide("skip");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const p = data?.progress;
  const done = p ? p.matched + p.not_stocked : 0;
  const pct = p?.total ? Math.round((done / p.total) * 100) : 0;

  return (
    <AdminShell
      title="Sage prices"
      subtitle="Point each Sage product at the right one on the website. Once only — after this, prices update themselves."
    >
      {error && (
        <p className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {!data && <p className="py-10 text-center text-sm text-body">Loading…</p>}

      {data && p && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-[13px] text-body">
          <span>
            {done} of {p.total} done
            {p.skipped > 0 && ` · ${p.skipped} skipped`}
            {p.not_stocked > 0 && ` · ${p.not_stocked} not stocked`}
          </span>
          {last && (
            <button
              onClick={undo}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 font-medium text-ink hover:bg-paper-2"
            >
              <Undo2 size={14} /> Undo “{last.description.slice(0, 28)}”
            </button>
          )}
        </div>
      )}

      {data && p && (
        <div className="mb-7 h-1.5 overflow-hidden rounded-full bg-paper-2">
          <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}

      {data && !data.item && (
        <div className="card rounded-2xl p-10 text-center">
          <CheckCircle2 size={38} className="mx-auto text-gold" strokeWidth={1.5} />
          <h2 className="mt-4 font-display text-xl font-semibold text-ink">All done</h2>
          <p className="mt-2 text-sm text-body">
            Every Sage line has been dealt with. Prices will now update on their own
            whenever a fresh export is loaded.
          </p>
        </div>
      )}

      {data?.item && (
        <>
          <div className="card rounded-2xl p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
              From Sage
            </div>
            <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <div className="font-display text-2xl font-semibold text-ink">
                  {data.item.description}
                </div>
                <div className="mt-1 font-mono text-[13px] text-body">{data.item.code}</div>
              </div>
              <div className="font-display text-3xl font-bold text-ink">
                {data.item.price_pence > 0 ? money(data.item.price_pence) : "no price"}
              </div>
            </div>
          </div>

          {!searching && (
            <>
              <p className="mt-6 mb-2 text-[13px] text-body">
                Which product on the website is this?{" "}
                <span className="text-body/70">Press 1–{data.candidates.length} to choose, S to skip.</span>
              </p>

              {data.candidates.length === 0 && (
                <p className="card rounded-2xl p-5 text-sm text-body">
                  Nothing on the website looks like this one. Search for it, or say we don’t stock it.
                </p>
              )}

              <div className="space-y-2">
                {data.candidates.map((c, i) => (
                  <button
                    key={c.id}
                    disabled={busy}
                    onClick={() => decide("match", c.id)}
                    className={`card flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 ${
                      i === 0 ? "border-gold/60 bg-gold-pale/30" : ""
                    }`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-paper-2 text-[12px] font-semibold text-body">
                      {i + 1}
                    </span>
                    {c.image_url ? (
                      <img
                        src={c.image_url}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-lg bg-white object-contain"
                      />
                    ) : (
                      <span className="h-12 w-12 shrink-0 rounded-lg bg-paper-2" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium text-ink">{c.name}</span>
                      <span className="block truncate text-[12px] text-body">
                        {[c.brand, c.pack_size].filter(Boolean).join(" · ")}
                        {c.current_price_pence != null && ` · now ${money(c.current_price_pence)}`}
                      </span>
                    </span>
                    {i === 0 && (
                      <span className="shrink-0 rounded-full bg-gold-pale px-3 py-1 text-[11px] font-semibold text-gold">
                        Best guess
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {searching && (
            <div className="mt-6">
              <form onSubmit={runSearch} className="flex gap-2">
                <input
                  ref={searchBox}
                  autoFocus
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Search the website catalogue…"
                  className="w-full rounded-full border border-line bg-white px-5 py-3 text-sm outline-none focus:border-gold"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-navy-700"
                >
                  Search
                </button>
              </form>

              <div className="mt-3 space-y-2">
                {results.map((c) => (
                  <button
                    key={c.id}
                    disabled={busy}
                    onClick={() => decide("match", c.id)}
                    className="card flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
                  >
                    {c.image_url ? (
                      <img src={c.image_url} alt="" className="h-12 w-12 shrink-0 rounded-lg bg-white object-contain" />
                    ) : (
                      <span className="h-12 w-12 shrink-0 rounded-lg bg-paper-2" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium text-ink">{c.name}</span>
                      <span className="block truncate text-[12px] text-body">
                        {[c.brand, c.pack_size].filter(Boolean).join(" · ")}
                        {c.current_price_pence != null && ` · now ${money(c.current_price_pence)}`}
                      </span>
                    </span>
                  </button>
                ))}
                {term && results.length === 0 && (
                  <p className="py-4 text-center text-sm text-body">Nothing found for “{term}”.</p>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => setSearching((s) => !s)}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-[13px] font-semibold text-ink hover:bg-paper-2"
            >
              {searching ? <><X size={15} /> Back to suggestions</> : <><Search size={15} /> Search for something else</>}
            </button>
            <button
              disabled={busy}
              onClick={() => decide("not_stocked")}
              className="rounded-full border border-line bg-white px-5 py-2.5 text-[13px] font-semibold text-ink hover:bg-paper-2 disabled:opacity-50"
            >
              We don’t stock this
            </button>
            <button
              disabled={busy}
              onClick={() => decide("skip")}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-[13px] font-semibold text-body hover:bg-paper-2 disabled:opacity-50"
            >
              <SkipForward size={15} /> Skip for now
            </button>
          </div>
        </>
      )}
    </AdminShell>
  );
}
