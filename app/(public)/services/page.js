import { Boxes, Truck, Handshake, BadgePercent, PhoneCall, ClipboardList } from "lucide-react";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import PremiumButton from "@/components/PremiumButton";

export const metadata = { title: "Services" };

const services = [
  { icon: Boxes, title: "Full-range wholesale supply", text: "Beers, spirits, wine, soft drinks, snacks and bar supplies — consolidate your suppliers into one weekly order with one invoice." },
  { icon: Truck, title: "Scheduled delivery", text: "Regular routes with dependable delivery days, so you always know when stock is arriving." },
  { icon: BadgePercent, title: "Trade pricing", text: "Honest wholesale prices across the whole range, reviewed regularly to stay competitive." },
  { icon: Handshake, title: "Dedicated account contact", text: "A real person who knows your business, your usual order and your delivery day." },
  { icon: PhoneCall, title: "Phone & online ordering", text: "Order online at any time, or call it through — whatever suits how you work." },
  { icon: ClipboardList, title: "New venue setup", text: "Opening a new site? We'll help you build a starting range and get first delivery in fast." },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="What we do for the trade"
        sub="Gala Drinks is built around one idea: make stocking your venue effortless."
      />
      <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 0.06}>
              <div className="card h-full rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/40">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold-pale text-gold">
                  <Icon size={22} strokeWidth={1.8} />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-body">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.2} className="mt-14 text-center">
          <PremiumButton href="/contact" size="lg">Apply for a Trade Account</PremiumButton>
        </Reveal>
      </div>
    </>
  );
}
