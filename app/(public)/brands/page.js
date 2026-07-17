import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { brands } from "@/lib/catalogue";

export const metadata = { title: "Brands" };

export default function BrandsPage() {
  return (
    <>
      <PageHero
        eyebrow="Brands"
        title="The brands we stock"
        sub="Household names and specialist labels, all from one supplier."
      />
      <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {brands.map((b, i) => (
            <Reveal key={b.slug} delay={Math.min(i * 0.04, 0.3)}>
              <Link
                href={`/brands/${b.slug}`}
                className="card flex h-28 items-center justify-center rounded-2xl px-4 text-center font-display text-base font-semibold text-ink transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:text-gold"
              >
                {b.name}
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </>
  );
}
