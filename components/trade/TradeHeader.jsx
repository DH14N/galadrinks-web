"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingBasket, LogOut, Package, ClipboardList, Menu, X,
  BadgePercent, UserRound, ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { basketCount } from "@/lib/basket";

// Header for the signed-in trade area: shows who's logged in, the basket
// count, and a way out. Deliberately simpler than the public header.
export default function TradeHeader({ customer }) {
  const router = useRouter();
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const update = () => setCount(basketCount());
    update();
    window.addEventListener("gala-basket-changed", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("gala-basket-changed", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  async function signOut() {
    sessionStorage.removeItem("gala_admin_ok");
    await supabase.auth.signOut();
    router.replace("/trade-login");
  }

  const links = [
    { href: "/trade/products", label: "Products", icon: Package },
    { href: "/trade/offers", label: "Monthly offers", icon: BadgePercent },
    { href: "/trade/orders", label: "Your orders", icon: ClipboardList },
    { href: "/trade/account", label: "Account", icon: UserRound },
  ];

  const linkClass = (href) =>
    `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
      pathname === href ? "bg-gold-pale text-gold" : "text-ink/80 hover:text-gold"
    }`;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-white">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/trade/products" className="flex shrink-0 items-center">
          <Image
            src="/logo.png"
            alt="Gala Drinks"
            width={112}
            height={70}
            priority
            className="h-[60px] w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={linkClass(href)}>
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {customer && (
            <div className="hidden text-right lg:block">
              <div className="text-[13px] font-semibold leading-tight text-ink">
                {customer.name}
              </div>
              <div className="text-[11px] text-body">Account {customer.number}</div>
            </div>
          )}

          <Link
            href="/trade/basket"
            aria-label="Basket"
            className="relative rounded-full p-2.5 text-ink/70 transition-colors hover:text-gold"
          >
            <ShoppingBasket size={21} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>

          {customer?.isAdmin && (
            <Link
              href="/admin"
              className="hidden items-center gap-2 rounded-full bg-gold-pale px-4 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-white lg:inline-flex"
            >
              <ShieldCheck size={15} />
              Staff area
            </Link>
          )}

          <button
            onClick={signOut}
            className="hidden items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-gold hover:text-gold sm:inline-flex"
          >
            <LogOut size={15} />
            Sign out
          </button>

          <button
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="rounded-full p-2.5 text-ink md:hidden"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-white px-4 py-3 md:hidden">
          {customer && (
            <div className="px-2 pb-2 text-[13px] text-body">
              {customer.name} — account {customer.number}
            </div>
          )}
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`block ${linkClass(href)}`}>
              <Icon size={16} />
              {label}
            </Link>
          ))}
          {customer?.isAdmin && (
            <Link href="/admin" className={`block ${linkClass("/admin")}`}>
              <ShieldCheck size={16} />
              Staff area
            </Link>
          )}
          <button
            onClick={signOut}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-medium text-ink"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
