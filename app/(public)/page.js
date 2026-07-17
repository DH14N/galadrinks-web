import Link from "next/link";
import {
  Truck, Handshake, Boxes, FileDown, Phone, BadgePercent,
  Clock, ShieldCheck, MapPin, ArrowRight, UserRoundPlus,
} from "lucide-react";
import Hero from "@/components/Hero";
import MonthlyOffers from "@/components/MonthlyOffers";
import Reveal from "@/components/Reveal";
import CategoryTile from "@/components/CategoryTile";
import ProductGrid from "@/components/ProductGrid";
import PremiumButton from "@/components/PremiumButton";
import { categories, getFeaturedProducts } from "@/lib/catalogue";

// Small helper for consistent section headings
function SectionHeading({ eyebrow, title, sub }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <div className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold">
        {eyebrow}
      </div>
      <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {title}
      </h2>
      {sub && <p className="mt-4 text-base leading-relaxed text-body">{sub}</p>}
    </Reveal>
  );
}

export default function HomePage() {
  const featured = getFeaturedProducts();

  return (
    <>
      <Hero />

      {/* ------------------------------------------ Three quick panels */}
      <section className="border-b border-line bg-paper-2">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-14 sm:px-6 md:grid-cols-3">
          {[
            {
              icon: BadgePercent,
              title: "Monthly offers",
              text: "Trade-only deals, updated every month for our customers.",
              href: "/trade-login", cta: "Log in to view",
            },
            {
              icon: FileDown,
              title: "Brochures",
              text: "Download the latest product range and price list brochures.",
              href: "/brochures", cta: "View brochures",
            },
            {
              icon: UserRoundPlus,
              title: "Open a trade account",
              text: "Get your customer number, online login and delivery day.",
              href: "/contact", cta: "Apply now",
            },
          ].map(({ icon: Icon, title, text, href, cta }, i) => (
            <Reveal key={title} delay={i * 0.08}>
              <Link
                href={href}
                className="group card flex h-full flex-col rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold-pale text-gold transition-transform duration-300 group-hover:scale-110">
                  <Icon size={22} strokeWidth={1.8} />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-body">{text}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gold">
                  {cta} <ArrowRight size={15} />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------ This month's offers
           Only logged-in trade customers see the deals; everyone else
           sees a locked "log in to view" band. */}
      <MonthlyOffers />

      {/* ------------------------------------------ Welcome intro */}
      <section className="py-20">
        <Reveal className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Welcome to Gala Drinks
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-body">
            We’re an independent wholesale drinks supplier serving restaurants,
            bars, takeaways and shops across Leicester and the Midlands. One
            supplier, one delivery, everything you pour — backed by a team
            that knows your account personally.
          </p>
        </Reveal>
      </section>

      {/* ------------------------------------------ Product ranges */}
      <section className="border-t border-line bg-paper-2 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Product Ranges"
            title="Everything your venue needs, in one order"
            sub="From world lagers to premium spirits, soft drinks and bar supplies — browse the full range, then log in for trade prices."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((c, i) => (
              <Reveal key={c.slug} delay={Math.min(i * 0.05, 0.35)} className="h-full">
                <CategoryTile category={c} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------ Featured products */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Popular Lines"
            title="Best sellers across the trade"
            sub="A taste of the catalogue. Trade customers see live prices on every product."
          />
          <Reveal className="mt-14">
            <ProductGrid products={featured} />
          </Reveal>
          <Reveal className="mt-12 text-center">
            <PremiumButton href="/products" variant="outline" size="lg">
              View the full catalogue <ArrowRight size={17} />
            </PremiumButton>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------ Services */}
      <section className="border-t border-line bg-paper-2 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Services"
            title="More than a wholesaler"
            sub="We look after the details so you can look after your customers."
          />
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Boxes,
                title: "Full-range supply",
                text: "Beer, spirits, wine, soft drinks, snacks and bar supplies — consolidate your suppliers into one weekly order.",
              },
              {
                icon: Truck,
                title: "Reliable delivery",
                text: "Regular routes and dependable delivery days, so your stock arrives when you expect it.",
              },
              {
                icon: Handshake,
                title: "Personal service",
                text: "A real person who knows your account and your usual order — one call away.",
              },
            ].map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 0.1} className="h-full">
                <div className="card h-full rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold-pale text-gold">
                    <Icon size={22} strokeWidth={1.8} />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold text-ink">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-body">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-10 text-center">
            <PremiumButton href="/services" variant="ghost">
              See all our services <ArrowRight size={15} />
            </PremiumButton>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------ About + Why choose */}
      <section className="py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
          <Reveal>
            <div className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold">
              About Gala Drinks
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              A family business built on trust
            </h2>
            <p className="mt-5 leading-relaxed text-body">
              Gala Drinks supplies restaurants, bars, takeaways and shops with
              the full range of drinks they need — delivered reliably, priced
              fairly, and backed by service you can actually reach on the phone.
            </p>
            <p className="mt-4 leading-relaxed text-body">
              Every customer gets a dependable delivery schedule and a team
              that knows the order before you finish saying it.
            </p>
            <div className="mt-8">
              <PremiumButton href="/about" variant="outline">
                Our story <ArrowRight size={16} />
              </PremiumButton>
            </div>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-2">
            {[
              { icon: BadgePercent, title: "Trade pricing", text: "Wholesale prices on every product, visible when you log in." },
              { icon: Boxes, title: "Depth of range", text: "From big brands to specialist world beers — one supplier, one delivery." },
              { icon: Clock, title: "Order in minutes", text: "Repeat your usual order online, any time, from any device." },
              { icon: ShieldCheck, title: "No surprises", text: "Clear invoices, consistent stock and honest communication." },
            ].map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 0.08} className="h-full">
                <div className="card h-full rounded-2xl p-6">
                  <Icon size={22} className="text-gold" strokeWidth={1.8} />
                  <h3 className="mt-4 font-display text-base font-semibold text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-body">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------ Delivery area */}
      <section className="border-t border-line bg-paper-2 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <div className="card flex flex-col items-start gap-8 rounded-3xl p-10 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.25em] text-gold">
                  <MapPin size={14} /> Delivery Area
                </div>
                <h2 className="mt-3 font-display text-3xl font-semibold text-ink">
                  Delivering across Leicester & the Midlands
                </h2>
                <p className="mt-4 text-body">
                  Regular delivery routes throughout the region. Not sure if we
                  cover your area? Get in touch — we’re always adding routes.
                </p>
              </div>
              <PremiumButton href="/delivery" size="lg">
                Check Delivery Days
              </PremiumButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------ Contact CTA */}
      <section className="bg-navy py-20 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Reveal>
            <Phone size={26} className="mx-auto text-gold-light" />
            <h2 className="mt-5 font-display text-3xl font-semibold sm:text-4xl">
              Ready to open a trade account?
            </h2>
            <p className="mt-4 text-white/70">
              Speak to the team on{" "}
              <span className="font-semibold text-white">0116 289 0111</span>{" "}
              or send us your details and we’ll set you up with your own
              customer number and pricing.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <PremiumButton href="/contact" variant="gold" size="lg">
                Apply for a Trade Account
              </PremiumButton>
              <PremiumButton href="/trade-login" variant="outline-light" size="lg">
                Trade Login
              </PremiumButton>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
