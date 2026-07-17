"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";

// Search box + sort dropdown for the catalogue pages.
// Changing either updates the URL — the server then filters the
// full catalogue and sends back just one page of results.
export default function CatalogueControls({ basePath, q = "", sort = "name", category = "" }) {
  const router = useRouter();
  const [query, setQuery] = useState(q);

  function apply(overrides = {}) {
    const next = { q: query.trim(), sort, category, ...overrides };
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.sort && next.sort !== "name") params.set("sort", next.sort);
    if (next.category) params.set("category", next.category);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
        className="card flex flex-1 items-center gap-3 rounded-full px-5 transition-colors focus-within:border-gold"
      >
        <Search size={17} className="shrink-0 text-gold" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by product, brand or SKU… (press Enter)"
          className="w-full bg-transparent py-3 text-sm text-ink placeholder:text-body/50 focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-ink px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-navy-700"
        >
          Search
        </button>
      </form>

      {/* Sort */}
      <div className="card flex items-center gap-3 rounded-full px-5">
        <SlidersHorizontal size={16} className="shrink-0 text-gold" />
        <select
          value={sort}
          onChange={(e) => apply({ sort: e.target.value })}
          className="bg-transparent py-3 text-sm text-ink focus:outline-none"
        >
          <option value="name">Sort: Name A–Z</option>
          <option value="brand">Sort: Brand A–Z</option>
        </select>
      </div>
    </div>
  );
}
