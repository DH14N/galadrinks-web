import { FileDown } from "lucide-react";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";

export const metadata = { title: "Brochures" };

const brochures = [
  { title: "Full Product Range", desc: "The complete Gala Drinks catalogue, organised by category." },
  { title: "Monthly Offers", desc: "This month's featured lines and seasonal specials." },
  { title: "Soft Drinks & Minerals", desc: "Cans, bottles, mixers and price-marked packs." },
  { title: "Spirits & Wine List", desc: "The back-bar range for restaurants and bars." },
];

export default function BrochuresPage() {
  return (
    <>
      <PageHero
        eyebrow="Downloads"
        title="Brochures & price lists"
        sub="Download the latest brochures below. Prices are shown to approved trade customers only — log in or contact the team for pricing."
      />
      <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="grid gap-5 md:grid-cols-2">
          {brochures.map((b, i) => (
            <Reveal key={b.title} delay={i * 0.07}>
              <div className="group card flex items-center gap-5 rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40">
                <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gold-pale text-gold transition-transform duration-300 group-hover:scale-110">
                  <FileDown size={24} strokeWidth={1.6} />
                </span>
                <span className="flex-1">
                  <span className="block font-display text-lg font-semibold text-ink">{b.title}</span>
                  <span className="mt-1 block text-sm text-body">{b.desc}</span>
                </span>
                <span className="rounded-full border border-line px-4 py-2 text-[12px] text-body">
                  PDF coming soon
                </span>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.2} className="mt-10">
          <p className="text-sm text-body">
            Brochure PDFs will appear here once uploaded. Speak to the team on{" "}
            <span className="text-ink">0116 289 0111</span> for a printed copy.
          </p>
        </Reveal>
      </div>
    </>
  );
}
