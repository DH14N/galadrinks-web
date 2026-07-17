"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgePercent, Lock, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Reveal from "@/components/Reveal";
import PremiumButton from "@/components/PremiumButton";

// Homepage "This Month's Offers" section.
// Logged-in trade customers see the offer cards (fetched securely from
// /api/offers). Everyone else sees a locked band inviting them to log in.
export default function MonthlyOffers() {
  const [status, setStatus] = useState("checking"); // checking | anon | authed
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session) {
        if (!cancelled) setStatus("anon");
        return;
      }

      // Logged in — ask the server for this month's offers
      const res = await fetch("/api/offers", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (cancelled) return;

      if (!res.ok) {
        setStatus("anon");
        return;
      }
      const json = await res.json();
      setOffers(json.offers || []);
      setStatus("authed");
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // While we check the login, keep the space empty (no flash of wrong state)
  if (status === "checking") return null;

  // ------------------------------------------------ Logged out: locked band
  if (status === "anon") {
    return (
      <section className="border-b border-line py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <div className="card flex flex-col items-start gap-6 rounded-3xl p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold-pale text-gold">
                  <Lock size={22} strokeWidth={1.8} />
                </span>
                <div>
                  <h2 className="font-display text-xl font-semibold text-ink">
                    This month&rsquo;s offers
                  </h2>
                  <p className="mt-1 text-sm text-body">
                    Our latest trade-only deals are reserved for customers. Log
                    in to see what&rsquo;s on offer this month.
                  </p>
                </div>
              </div>
              <PremiumButton href="/trade-login">Trade Login</PremiumButton>
            </div>
          </Reveal>
        </div>
      </section>
    );
  }

  // ------------------------------------------------ Logged in: the offers
  if (!offers.length) return null;

  return (
    <section className="border-b border-line py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold-pale px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-gold">
              <BadgePercent size={14} /> Trade customers only
            </div>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              This Month&rsquo;s Offers
            </h2>
            <p className="mt-2 text-body">
              Deals for this month — order online or call it through.
            </p>
          </div>
          <PremiumButton href="/trade/products" variant="outline">
            Go to ordering <ArrowRight size={16} />
          </PremiumButton>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer, i) => (
            <Reveal key={offer.slug} delay={Math.min(i * 0.06, 0.3)} className="h-full">
              <Link
                href={`/products/${offer.slug}`}
                className="group card flex h-full flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg"
              >
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gold-pale px-3 py-1.5 text-[12px] font-semibold text-gold">
                  <BadgePercent size={13} /> {offer.deal}
                </span>
                <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
                  {offer.brand}
                </div>
                <h3 className="mt-1 font-display text-lg font-semibold text-ink transition-colors group-hover:text-gold">
                  {offer.name}
                </h3>
                <p className="mt-1 flex-1 text-sm text-body">{offer.format}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gold">
                  View product <ArrowRight size={15} />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
