"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ChevronDown, Search, ShoppingBasket, Menu, X, UserRound, Phone,
} from "lucide-react";
import { categories } from "@/lib/categories";

const navLinks = [
  { href: "/brochures", label: "Brochures" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [rangesOpen, setRangesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Add a soft shadow once the page scrolls
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus when navigating
  useEffect(() => {
    setRangesOpen(false);
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  function submitSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setQuery("");
    router.push(`/products?q=${encodeURIComponent(q)}`);
  }

  // On catalogue/range pages, show a second row under the header for
  // jumping straight between ranges (Lagers → Cider → Spirits…)
  const showRangeBar =
    pathname === "/products" || pathname.startsWith("/category/");
  const activeRange = pathname.startsWith("/category/")
    ? pathname.split("/")[2]
    : "";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 bg-white transition-shadow duration-300 ${
        scrolled ? "shadow-[0_4px_20px_rgba(23,32,47,0.08)]" : ""
      }`}
    >
      {/* Slim top strip with phone number */}
      <div className="hidden border-b border-line bg-paper-2 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-[12px] text-body sm:px-6">
          <span className="inline-flex items-center gap-1.5">
            <Phone size={12} className="text-gold" /> 0116 289 0111
          </span>
          <span>Wholesale drinks — trade customers only pricing</span>
        </div>
      </div>

      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 border-b border-line px-4 sm:px-6">
        {/* Wordmark */}
        <Link href="/" className="flex items-baseline gap-1.5 font-display text-2xl font-bold tracking-tight">
          <span className="text-ink">Gala</span>
          <span className="text-gold">Drinks</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          <Link
            href="/"
            className="rounded-full px-4 py-2 text-sm font-medium text-ink/80 transition-colors hover:text-gold"
          >
            Home
          </Link>

          {/* Product Ranges dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setRangesOpen(true)}
            onMouseLeave={() => setRangesOpen(false)}
          >
            <button
              onClick={() => setRangesOpen((v) => !v)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                rangesOpen ? "text-gold" : "text-ink/80 hover:text-gold"
              }`}
            >
              Product Ranges
              <ChevronDown
                size={15}
                className={`transition-transform duration-300 ${rangesOpen ? "rotate-180" : ""}`}
              />
            </button>

            <div
              className={`absolute left-1/2 top-full w-[560px] -translate-x-1/2 pt-3 transition-all duration-300 ${
                rangesOpen
                  ? "pointer-events-auto translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-2 opacity-0"
              }`}
            >
              <div className="card rounded-2xl p-4 shadow-[0_24px_60px_rgba(23,32,47,0.15)]">
                <div className="grid grid-cols-2 gap-1">
                  {categories.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/category/${c.slug}`}
                      className="rounded-xl px-4 py-2.5 text-sm text-body transition-colors hover:bg-gold-pale/60 hover:text-gold"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
                <div className="mt-3 border-t border-line pt-3">
                  <Link
                    href="/products"
                    className="block rounded-xl px-4 py-2.5 text-sm font-semibold text-gold transition-colors hover:bg-gold-pale/60"
                  >
                    View all products →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-ink/80 transition-colors hover:text-gold"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          {/* Search */}
          <div className="hidden items-center md:flex">
            <form
              onSubmit={submitSearch}
              className={`flex items-center overflow-hidden rounded-full border transition-all duration-300 ${
                searchOpen ? "w-56 border-line bg-paper-2" : "w-0 border-transparent"
              }`}
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products…"
                className="w-full bg-transparent px-4 py-2 text-sm text-ink placeholder:text-body/60 focus:outline-none"
              />
            </form>
            <button
              aria-label="Search"
              onClick={() => setSearchOpen((v) => !v)}
              className="rounded-full p-2.5 text-ink/70 transition-colors hover:text-gold"
            >
              <Search size={19} />
            </button>
          </div>

          {/* Trade login */}
          <Link
            href="/trade-login"
            className="hidden items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-navy-700 sm:flex"
          >
            <UserRound size={16} />
            Trade Login
          </Link>

          {/* Basket */}
          <Link
            aria-label="Basket"
            href="/cart"
            className="rounded-full p-2.5 text-ink/70 transition-colors hover:text-gold"
          >
            <ShoppingBasket size={20} />
          </Link>

          {/* Mobile menu toggle */}
          <button
            aria-label="Menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-full p-2.5 text-ink lg:hidden"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`overflow-hidden bg-white transition-all duration-500 lg:hidden ${
          mobileOpen ? "max-h-[80vh] overflow-y-auto border-b border-line" : "max-h-0"
        }`}
      >
        <div className="space-y-1 px-4 py-4">
          <form onSubmit={submitSearch} className="mb-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="w-full rounded-full border border-line bg-paper-2 px-4 py-2.5 text-sm text-ink placeholder:text-body/60 focus:outline-none"
            />
          </form>

          <Link href="/" className="block rounded-xl px-4 py-2.5 text-sm font-medium text-ink">
            Home
          </Link>
          <div className="px-4 pt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
            Product Ranges
          </div>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="block rounded-xl px-4 py-2 text-sm text-body"
            >
              {c.name}
            </Link>
          ))}
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="block rounded-xl px-4 py-2.5 text-sm font-medium text-ink">
              {l.label}
            </Link>
          ))}
          <Link
            href="/trade-login"
            className="mt-2 block rounded-full bg-ink px-5 py-3 text-center text-sm font-semibold text-white"
          >
            Trade Login
          </Link>
        </div>
      </div>

      {/* Range jump bar — only on catalogue/range pages */}
      {showRangeBar && (
        <div className="border-b border-line bg-white">
          <nav
            aria-label="Product ranges"
            className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <Link
              href="/products"
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                pathname === "/products"
                  ? "bg-ink text-white"
                  : "text-body hover:bg-gold-pale/60 hover:text-gold"
              }`}
            >
              All Products
            </Link>
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                  activeRange === c.slug
                    ? "bg-ink text-white"
                    : "text-body hover:bg-gold-pale/60 hover:text-gold"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
