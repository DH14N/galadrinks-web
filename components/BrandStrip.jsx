import Reveal from "@/components/Reveal";

// "Brands we stock" logo strip. Each brand shows its logo if one has
// been added to public/brands, otherwise its name as a text wordmark.
export default function BrandStrip({ brands = [] }) {
  if (!brands.length) return null;

  return (
    <section className="border-t border-line bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <div className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold">
            Brands We Stock
          </div>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            The names your customers ask for
          </h2>
          <p className="mt-4 text-base leading-relaxed text-body">
            We supply the big brands and the specialists — all from one
            delivery, on one invoice.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {brands.map((brand, i) => (
            <Reveal key={brand.slug} delay={Math.min(i * 0.04, 0.3)} className="h-full">
              <div className="card flex h-24 items-center justify-center rounded-2xl px-4 transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg">
                {brand.logo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    loading="lazy"
                    className="max-h-12 w-auto max-w-full object-contain"
                  />
                ) : (
                  <span className="text-center font-display text-base font-semibold leading-tight text-ink">
                    {brand.name}
                  </span>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
