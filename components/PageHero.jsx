import Reveal from "@/components/Reveal";

// Simple heading band shared by the info pages (About, Services, etc.)
export default function PageHero({ eyebrow, title, sub }) {
  return (
    <div className="border-b border-line bg-paper-2 pt-[124px]">
      <Reveal className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6">
        <div className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold">
          {eyebrow}
        </div>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          {title}
        </h1>
        {sub && <p className="mt-5 max-w-2xl text-lg text-body">{sub}</p>}
      </Reveal>
    </div>
  );
}
