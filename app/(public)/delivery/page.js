import { Truck, MapPin, CalendarDays, PackageCheck } from "lucide-react";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import PremiumButton from "@/components/PremiumButton";

export const metadata = { title: "Delivery" };

const points = [
  { icon: MapPin, title: "Where we deliver", text: "Leicester and the surrounding Midlands. Expanding regularly — ask if you're nearby." },
  { icon: CalendarDays, title: "Delivery days", text: "Each area has regular route days, so you can plan stock around a dependable schedule." },
  { icon: Truck, title: "Our own vehicles", text: "Deliveries arrive on our vans, handled by our team — not a courier." },
  { icon: PackageCheck, title: "Checked on arrival", text: "Orders are checked with you at the door, so any issue is sorted on the spot." },
];

export default function DeliveryPage() {
  return (
    <>
      <PageHero
        eyebrow="Delivery"
        title="Reliable delivery, on your schedule"
        sub="Regular routes across Leicester and the Midlands, delivered by our own team."
      />
      <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="grid gap-5 md:grid-cols-2">
          {points.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 0.07}>
              <div className="card h-full rounded-2xl p-8">
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
          <p className="text-body">Not sure if we cover your area?</p>
          <div className="mt-5">
            <PremiumButton href="/contact" size="lg">Check with the team</PremiumButton>
          </div>
        </Reveal>
      </div>
    </>
  );
}
