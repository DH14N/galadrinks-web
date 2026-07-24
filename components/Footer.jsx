import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin } from "lucide-react";
import { categories } from "@/lib/categories";

export default function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div>
          {/* White tile so the dark logo reads on the navy footer */}
          <div className="inline-flex rounded-2xl bg-white px-4 py-3">
            <Image
              src="/logo.png"
              alt="Gala Drinks — Wholesale Drinks Supplier"
              width={128}
              height={80}
              className="h-20 w-auto"
            />
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
            Wholesale drinks, delivered with service you can trust. Supplying
            restaurants, bars, shops and venues across the region.
          </p>
          <div className="mt-6 space-y-2 text-sm text-white/70">
            <div className="flex items-center gap-2.5">
              <Phone size={15} className="text-gold-light" /> 0116 289 0111
            </div>
            <div className="flex items-center gap-2.5">
              <Mail size={15} className="text-gold-light" /> sales@galadrinks.co.uk
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin size={15} className="mt-0.5 shrink-0 text-gold-light" />
              <span>6 Vitruvius Way, Meridian Business Park, Leicester</span>
            </div>
          </div>
        </div>

        {/* Ranges */}
        <div>
          <h4 className="text-[12px] font-semibold uppercase tracking-[0.2em] text-gold-light">
            Product Ranges
          </h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            {categories.slice(0, 7).map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="text-white/60 transition-colors hover:text-gold-light">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/products" className="font-medium text-white transition-colors hover:text-gold-light">
                View all products →
              </Link>
            </li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-[12px] font-semibold uppercase tracking-[0.2em] text-gold-light">
            Company
          </h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/about" className="text-white/60 transition-colors hover:text-gold-light">About Gala Drinks</Link></li>
            <li><Link href="/services" className="text-white/60 transition-colors hover:text-gold-light">Services</Link></li>
            <li><Link href="/delivery" className="text-white/60 transition-colors hover:text-gold-light">Delivery</Link></li>
            <li><Link href="/brochures" className="text-white/60 transition-colors hover:text-gold-light">Brochures</Link></li>
            <li><Link href="/contact" className="text-white/60 transition-colors hover:text-gold-light">Contact</Link></li>
          </ul>
        </div>

        {/* Trade */}
        <div>
          <h4 className="text-[12px] font-semibold uppercase tracking-[0.2em] text-gold-light">
            Trade Customers
          </h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/trade-login" className="text-white/60 transition-colors hover:text-gold-light">Trade Login</Link></li>
            <li><Link href="/contact" className="text-white/60 transition-colors hover:text-gold-light">Apply for a Trade Account</Link></li>
            <li><Link href="/cart" className="text-white/60 transition-colors hover:text-gold-light">Basket</Link></li>
            <li><Link href="/orders" className="text-white/60 transition-colors hover:text-gold-light">Your Orders</Link></li>
          </ul>
          <p className="mt-6 rounded-xl border border-white/15 p-4 text-[12px] leading-relaxed text-white/60">
            Prices are only visible to approved trade customers. Log in to see
            prices and order online.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-[12px] text-white/50 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} Gala Drinks. All rights reserved.</span>
          <span>Wholesale drinks supplier — trade only pricing.</span>
        </div>
      </div>
    </footer>
  );
}
