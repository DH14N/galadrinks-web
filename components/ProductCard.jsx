import Link from "next/link";
import {
  Lock, Wine, Beer, Martini, CupSoda, GlassWater, Zap, Apple,
  Popcorn, Coffee, Package, Leaf, FlaskConical, Cylinder, Gift,
} from "lucide-react";
import { getCategory, getFormat } from "@/lib/categories";

// Placeholder artwork per category until real product photos are added.
const categoryIcons = {
  "lagers-craft-beers": Beer,
  "ales-bitters-stouts": Beer,
  cider: Apple,
  spirits: Martini,
  rtds: CupSoda,
  wine: Wine,
  "champagne-prosecco": Wine,
  "soft-drinks": GlassWater,
  "energy-drinks": Zap,
  "liqueurs-speciality": FlaskConical,
  kegs: Cylinder,
  miniatures: Martini,
  "gift-sets": Gift,
  snacks: Popcorn,
  "hot-beverages": Coffee,
  "bar-supplies": Package,
  "no-low-alcohol": Leaf,
};

// Public product card — shows product details but NEVER a price.
export default function ProductCard({ product }) {
  const Icon = categoryIcons[product.category] || Beer;
  const category = getCategory(product.category);

  return (
    <div className="group card flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg">
      {/* Image / placeholder */}
      <Link
        href={`/products/${product.slug}`}
        className="relative flex h-44 items-center justify-center overflow-hidden border-b border-line bg-white"
      >
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <Icon
            size={52}
            strokeWidth={1}
            className="text-gold/40 transition-transform duration-500 group-hover:scale-110"
          />
        )}
        <span className="absolute left-3 top-3 rounded-full border border-line bg-white/90 px-3 py-1 text-[11px] font-medium text-body">
          {category?.name}
        </span>
      </Link>

      {/* Details */}
      <div className="flex flex-1 flex-col p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
          {product.brand}
        </div>
        <Link href={`/products/${product.slug}`}>
          <h3 className="mt-1 font-display text-base font-semibold leading-snug text-ink transition-colors group-hover:text-gold">
            {product.name}
          </h3>
        </Link>

        <div className="mt-3 flex flex-wrap gap-2 empty:hidden">
          {getFormat(product) && (
            <span className="rounded-full border border-line px-2.5 py-1 text-[11px] text-body">
              {getFormat(product)}
            </span>
          )}
          {product.abv && product.abv !== "0%" && (
            <span className="rounded-full border border-line px-2.5 py-1 text-[11px] text-body">
              {product.abv} ABV
            </span>
          )}
        </div>

        {/* Price area — locked for public visitors */}
        <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gold-pale text-gold">
            <Lock size={14} />
          </span>
          <div>
            <div className="text-sm font-medium text-ink">Login to view price</div>
            <div className="text-[11px] text-body">Trade customers only</div>
          </div>
        </div>

        <Link
          href={`/products/${product.slug}`}
          className="mt-4 inline-flex items-center justify-center rounded-full border border-line px-4 py-2.5 text-sm font-medium text-ink transition-all duration-300 hover:border-gold hover:bg-gold-pale/60 hover:text-gold"
        >
          View product
        </Link>
      </div>
    </div>
  );
}
