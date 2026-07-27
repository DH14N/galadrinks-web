"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ClipboardList, Package, Users, LogOut, ShieldAlert, ExternalLink,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// Wraps every admin page: checks the person is signed in AND an admin,
// then renders the sidebar around the page's content.
//
// The real protection is on the server — every admin API checks the
// login token itself. This is just so non-admins see a clear message
// instead of an empty screen.
// Remembering the check for this browser tab keeps navigation instant.
// It's only about what we show — every admin API still verifies the
// login token itself, so a faked value here gains nothing.
const CACHE_KEY = "gala_admin_ok";

function readCache() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
  } catch {
    return null;
  }
}

export default function AdminShell({ title, subtitle, children, actions }) {
  const router = useRouter();
  const pathname = usePathname();

  // Start from what we already know, so pages render immediately
  const cached = typeof window !== "undefined" ? readCache() : null;
  const [state, setState] = useState(cached ? "ok" : "checking");
  const [me, setMe] = useState(cached?.email || null);

  const check = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) { router.replace("/trade-login"); return; }

    const res = await fetch("/api/admin/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      sessionStorage.removeItem(CACHE_KEY);
      router.replace("/trade-login");
      return;
    }
    if (res.status === 403) {
      sessionStorage.removeItem(CACHE_KEY);
      setState("denied");
      return;
    }

    const who = await res.json();
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ email: who.email }));
    setMe(who.email || null);
    setState("ok");
  }, [router]);

  // Re-verify once per page load, but never block on it if we already
  // know the answer from this tab
  useEffect(() => { check(); }, [check]);

  async function signOut() {
    sessionStorage.removeItem(CACHE_KEY);
    await supabase.auth.signOut();
    router.replace("/trade-login");
  }

  if (state === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="text-body">Checking your access…</p>
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="card max-w-md rounded-3xl p-10 text-center">
          <ShieldAlert size={40} className="mx-auto text-gold" strokeWidth={1.5} />
          <h1 className="mt-4 font-display text-xl font-semibold text-ink">
            Admin access only
          </h1>
          <p className="mt-3 text-sm text-body">
            This area is for Gala Drinks staff. If you think you should have
            access, give the office a ring.
          </p>
          <Link
            href="/trade/products"
            className="mt-7 inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-navy-700"
          >
            Back to ordering
          </Link>
        </div>
      </div>
    );
  }

  const nav = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/orders", label: "Orders", icon: ClipboardList },
    { href: "/admin/products", label: "Products & prices", icon: Package },
    { href: "/admin/customers", label: "Customers", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-paper">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-white lg:flex">
        <div className="border-b border-line px-5 py-4">
          <Link href="/admin" className="flex items-center">
            <Image src="/logo.png" alt="Gala Drinks" width={112} height={70} className="h-12 w-auto" />
          </Link>
          <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
            Staff area
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-gold-pale text-gold" : "text-ink/80 hover:bg-paper-2 hover:text-gold"
                }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-line p-3">
          <Link
            href="/trade/products"
            className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-body hover:text-gold"
          >
            <ExternalLink size={16} />
            Customer view
          </Link>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-body hover:text-gold"
          >
            <LogOut size={16} />
            Sign out
          </button>
          {me && <div className="truncate px-4 pt-1 text-[11px] text-body/70">{me}</div>}
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 border-b border-line bg-white lg:hidden">
        <div className="flex items-center gap-1 overflow-x-auto px-3 py-2">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium ${
                  active ? "bg-gold-pale text-gold" : "text-ink/80"
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="lg:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                {title}
              </h1>
              {subtitle && <p className="mt-1.5 text-body">{subtitle}</p>}
            </div>
            {actions}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
