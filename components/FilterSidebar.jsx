"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";

// Collapsible filter section — all collapsed until opened
function Section({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line py-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="font-display text-sm font-semibold text-ink">{title}</span>
        <ChevronDown
          size={16}
          className={`text-body transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="mt-3 space-y-1.5">{children}</div>}
    </div>
  );
}

// One checkbox row with a count badge
function Option({ label, count, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 text-sm text-body transition-colors hover:text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 accent-[#a87c24]"
      />
      <span className="flex-1 truncate">{label}</span>
      <span className="shrink-0 text-[11px] text-body/60">{count}</span>
    </label>
  );
}

// Left-hand filters for the catalogue pages: Brand, Country, Packaging
// and ABV strength. Selections live in the URL, so the server filters
// the full catalogue and results are shareable/bookmarkable.
export default function FilterSidebar({ basePath, baseParams = {}, facets, selected }) {
  const router = useRouter();
  const [openMobile, setOpenMobile] = useState(false);

  const activeCount =
    selected.brands.length + selected.countries.length +
    selected.packs.length + selected.abv.length +
    selected.owners.length + selected.specs.length;

  function pushWith(next) {
    const sp = new URLSearchParams();
    if (baseParams.q) sp.set("q", baseParams.q);
    if (baseParams.sort && baseParams.sort !== "default") sp.set("sort", baseParams.sort);
    if (baseParams.per) sp.set("per", baseParams.per);
    if (baseParams.category) sp.set("category", baseParams.category);
    if (next.brands.length) sp.set("brand", next.brands.join(","));
    if (next.countries.length) sp.set("country", next.countries.join(","));
    if (next.packs.length) sp.set("pack", next.packs.join(","));
    if (next.abv.length) sp.set("abv", next.abv.join(","));
    if (next.owners.length) sp.set("owner", next.owners.join(","));
    if (next.specs.length) sp.set("spec", next.specs.join(","));
    const qs = sp.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  }

  function toggle(key, value) {
    const cur = new Set(selected[key]);
    if (cur.has(value)) cur.delete(value);
    else cur.add(value);
    pushWith({ ...selected, [key]: [...cur] });
  }

  function clearAll() {
    pushWith({ brands: [], countries: [], packs: [], abv: [], owners: [], specs: [] });
  }

  // Long lists scroll inside the section instead of growing the sidebar
  const scrollList = "max-h-56 overflow-y-auto pr-1";

  const panel = (
    <>
      <div className="flex items-center justify-between pb-1">
        <span className="flex items-center gap-2 font-display text-base font-semibold text-ink">
          <SlidersHorizontal size={16} className="text-gold" /> Filters
        </span>
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-[12px] font-medium text-gold hover:underline"
          >
            <X size={12} /> Clear all ({activeCount})
          </button>
        )}
      </div>

      {facets.packs.length > 0 && (
        <Section title="Packaging">
          {facets.packs.map(([name, count]) => (
            <Option
              key={name}
              label={name}
              count={count}
              checked={selected.packs.includes(name)}
              onChange={() => toggle("packs", name)}
            />
          ))}
        </Section>
      )}

      {facets.abv.length > 0 && (
        <Section title="Strength (ABV)">
          {facets.abv.map((band) => (
            <Option
              key={band.key}
              label={band.label}
              count={band.count}
              checked={selected.abv.includes(band.key)}
              onChange={() => toggle("abv", band.key)}
            />
          ))}
        </Section>
      )}

      {facets.specs.length > 0 && (
        <Section title="Specification">
          {facets.specs.map(([name, count]) => (
            <Option
              key={name}
              label={name}
              count={count}
              checked={selected.specs.includes(name)}
              onChange={() => toggle("specs", name)}
            />
          ))}
        </Section>
      )}

      {facets.brands.length > 1 && (
        <Section title="Brand">
          <div className={scrollList}>
            {facets.brands.map((b) => (
              <Option
                key={b.slug}
                label={b.name}
                count={b.count}
                checked={selected.brands.includes(b.slug)}
                onChange={() => toggle("brands", b.slug)}
              />
            ))}
          </div>
        </Section>
      )}

      {facets.owners.length > 1 && (
        <Section title="Brand Owner">
          <div className={scrollList}>
            {facets.owners.map(([name, count]) => (
              <Option
                key={name}
                label={name}
                count={count}
                checked={selected.owners.includes(name)}
                onChange={() => toggle("owners", name)}
              />
            ))}
          </div>
        </Section>
      )}

      {facets.countries.length > 1 && (
        <Section title="Country">
          <div className={scrollList}>
            {facets.countries.map(([name, count]) => (
              <Option
                key={name}
                label={name}
                count={count}
                checked={selected.countries.includes(name)}
                onChange={() => toggle("countries", name)}
              />
            ))}
          </div>
        </Section>
      )}
    </>
  );

  return (
    <aside className="w-full">
      {/* Mobile: filters collapse behind a toggle button */}
      <button
        onClick={() => setOpenMobile((v) => !v)}
        className="card mb-4 flex w-full items-center justify-between rounded-full px-5 py-3 text-sm font-medium text-ink lg:hidden"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-gold" />
          Filters{activeCount > 0 && ` (${activeCount})`}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-300 ${openMobile ? "rotate-180" : ""}`}
        />
      </button>

      <div className={`card rounded-2xl p-5 ${openMobile ? "block" : "hidden"} lg:block`}>
        {panel}
      </div>
    </aside>
  );
}
