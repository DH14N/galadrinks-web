"use client";

import { useRouter } from "next/navigation";
import { ArrowUpDown, LayoutGrid } from "lucide-react";

// "Sort by" + "Products per page" row shown above the product grid.
// Both selections live in the URL so they survive page changes.
export default function ResultsBar({ basePath, params = {}, sort = "default", per = 24 }) {
  const router = useRouter();

  function pushWith(overrides) {
    const next = { ...params, sort, per: String(per), ...overrides };
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (!value) continue;
      if (key === "sort" && value === "default") continue;
      if (key === "per" && value === "24") continue;
      if (key === "page") continue; // changing sort/per restarts at page 1
      sp.set(key, value);
    }
    const qs = sp.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  }

  const selectCls =
    "bg-transparent py-2 pr-1 text-sm text-ink focus:outline-none";

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      {/* Sort by */}
      <label className="card flex items-center gap-2 rounded-full px-4">
        <ArrowUpDown size={14} className="shrink-0 text-gold" />
        <span className="text-[12px] font-semibold uppercase tracking-wide text-body">
          Sort by
        </span>
        <select
          value={sort}
          onChange={(e) => pushWith({ sort: e.target.value })}
          className={selectCls}
        >
          <option value="default">Default</option>
          <option value="name">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
        </select>
      </label>

      {/* Products per page */}
      <label className="card flex items-center gap-2 rounded-full px-4">
        <LayoutGrid size={14} className="shrink-0 text-gold" />
        <span className="text-[12px] font-semibold uppercase tracking-wide text-body">
          Per page
        </span>
        <select
          value={String(per)}
          onChange={(e) => pushWith({ per: e.target.value })}
          className={selectCls}
        >
          <option value="24">24</option>
          <option value="48">48</option>
          <option value="96">96</option>
        </select>
      </label>
    </div>
  );
}
