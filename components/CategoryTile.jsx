import Link from "next/link";
import {
  Beer, Wine, Martini, CupSoda, GlassWater, Coffee, Zap,
  Popcorn, Globe, Leaf, Sparkles, Apple, Package, ArrowRight, FlaskConical,
  Cylinder, Gift,
} from "lucide-react";

const icons = {
  beer: Beer,
  wine: Wine,
  martini: Martini,
  "cup-soda": CupSoda,
  "glass-water": GlassWater,
  coffee: Coffee,
  zap: Zap,
  popcorn: Popcorn,
  globe: Globe,
  leaf: Leaf,
  sparkles: Sparkles,
  apple: Apple,
  package: Package,
  flask: FlaskConical,
  cylinder: Cylinder,
  gift: Gift,
};

export default function CategoryTile({ category }) {
  const Icon = icons[category.icon] || Beer;

  return (
    // "flex flex-col" also makes the link a block element — without it the
    // card background breaks apart (links are inline by default).
    <Link
      href={`/category/${category.slug}`}
      className="group card flex h-full flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg"
    >
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold-pale text-gold transition-transform duration-300 group-hover:scale-110">
        <Icon size={22} strokeWidth={1.8} />
      </div>

      <h3 className="font-display text-lg font-semibold text-ink">
        {category.name}
      </h3>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-body">
        {category.description}
      </p>

      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gold transition-transform duration-300 group-hover:translate-x-1">
        Browse range <ArrowRight size={15} />
      </span>
    </Link>
  );
}
