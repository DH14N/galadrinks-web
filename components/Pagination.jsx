import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Builds the href for a given page, keeping current filters in the URL
function pageHref(basePath, params, page) {
  const sp = new URLSearchParams(params);
  if (page > 1) sp.set("page", String(page));
  else sp.delete("page");
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export default function Pagination({ basePath, params = {}, page, totalPages }) {
  if (totalPages <= 1) return null;

  // Show up to 5 numbered links centred on the current page
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const numbers = [];
  for (let i = start; i <= Math.min(totalPages, start + 4); i++) numbers.push(i);

  const linkCls =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-line bg-white px-3 text-sm text-ink transition-colors hover:border-gold hover:text-gold";

  return (
    <nav className="mt-12 flex flex-wrap items-center justify-center gap-2" aria-label="Pages">
      {page > 1 && (
        <Link href={pageHref(basePath, params, page - 1)} className={linkCls} aria-label="Previous page">
          <ChevronLeft size={16} />
        </Link>
      )}

      {numbers[0] > 1 && <span className="px-1 text-body">…</span>}
      {numbers.map((num) =>
        num === page ? (
          <span
            key={num}
            className="inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-ink px-3 text-sm font-semibold text-white"
          >
            {num}
          </span>
        ) : (
          <Link key={num} href={pageHref(basePath, params, num)} className={linkCls}>
            {num}
          </Link>
        )
      )}
      {numbers[numbers.length - 1] < totalPages && <span className="px-1 text-body">…</span>}

      {page < totalPages && (
        <Link href={pageHref(basePath, params, page + 1)} className={linkCls} aria-label="Next page">
          <ChevronRight size={16} />
        </Link>
      )}
    </nav>
  );
}
