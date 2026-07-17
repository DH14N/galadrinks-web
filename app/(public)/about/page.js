import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import PremiumButton from "@/components/PremiumButton";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Us"
        title="A family drinks business built on trust"
        sub="Gala Drinks supplies restaurants, bars, takeaways and shops with everything they pour, mix and serve."
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 pb-14 text-body sm:px-6">
        <Reveal>
          <p className="leading-relaxed">
            We started with a simple belief: wholesale should be personal. Big
            enough to stock everything you need, small enough to know your name,
            your order and your delivery day.
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <p className="leading-relaxed">
            Today we deliver across Leicester and the Midlands, supplying
            hundreds of product lines — from world lagers and premium spirits to
            soft drinks, snacks and bar supplies. Every account gets its own
            pricing and a team that picks up the phone.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="leading-relaxed">
            Whether you run a restaurant, a bar, a shop or an events business,
            we’d love to look after your drinks.
          </p>
        </Reveal>
      </div>
      <Reveal className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">
        <div className="flex flex-wrap gap-4">
          <PremiumButton href="/contact">Get in touch</PremiumButton>
          <PremiumButton href="/products" variant="outline">Browse the range</PremiumButton>
        </div>
      </Reveal>
    </>
  );
}
