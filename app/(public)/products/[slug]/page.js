import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Lock, ChevronRight, Wine, Beer, Martini, CupSoda, GlassWater, Zap, Globe, Apple,
  Popcorn, Coffee, Package, Leaf, FlaskConical, Percent, Boxes, Hash, Tag,
  Cylinder, Gift, Barcode,
} from "lucide-react";
import PremiumButton from "@/components/PremiumButton";
import ProductGrid from "@/components/ProductGrid";
import Reveal from "@/components/Reveal";
import { getCategory, getFormat } from "@/lib/categories";
import { getProduct, getProductsInCategory } from "@/lib/catalogue";

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

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: (product.description || "").slice(0, 160),
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const category = getCategory(product.category);
  const Icon = categoryIcons[product.category] || Beer;
  const related = getProductsInCategory(product.category)
    .filter((p) => p.slug !== product.slug)
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-[130px] sm:px-6">
      {/* Breadcrumb */}
      <Reveal>
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-body">
          <Link href="/" className="hover:text-gold">Home</Link>
          <ChevronRight size={14} />
          <Link href="/products" className="hover:text-gold">Products</Link>
          <ChevronRight size={14} />
          <Link href={`/category/${category.slug}`} className="hover:text-gold">
            {category.name}
          </Link>
          <ChevronRight size={14} />
          <span className="text-ink">{product.name}</span>
        </nav>
      </Reveal>

      <div className="mt-10 grid gap-12 lg:grid-cols-2">
        {/* Product image / placeholder */}
        <Reveal>
          <div className="relative flex h-[420px] items-center justify-center overflow-hidden rounded-3xl border border-line bg-white">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-contain p-10"
              />
            ) : (
              <Icon size={120} strokeWidth={0.8} className="text-gold/40" />
            )}
          </div>
        </Reveal>

        {/* Details */}
        <Reveal delay={0.1}>
          <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-gold">
            {product.brand}
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-2 text-lg text-body">{product.pack_size}</p>

          {/* Specification grid — ABV, format, country and more.
              Only rows we actually have data for are shown. */}
          <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
            {[
              product.abv && product.abv !== "0%"
                ? { icon: Percent, label: "ABV", value: product.abv }
                : null,
              getFormat(product)
                ? { icon: Package, label: "Format", value: getFormat(product) }
                : null,
              product.country
                ? { icon: Globe, label: "Country", value: product.country }
                : null,
              product.case_size
                ? { icon: Boxes, label: "Case size", value: `${product.case_size} units` }
                : null,
              { icon: Tag, label: "Brand", value: product.brand },
              product.sku ? { icon: Hash, label: "SKU", value: product.sku } : null,
              product.barcode
                ? { icon: Barcode, label: "Barcode", value: product.barcode }
                : null,
            ]
              .filter(Boolean)
              .map(({ icon: SpecIcon, label, value }) => (
                <div key={label} className="bg-white p-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-body">
                    <SpecIcon size={13} className="text-gold" /> {label}
                  </div>
                  <div className="mt-1.5 text-sm font-semibold text-ink">{value}</div>
                </div>
              ))}
          </div>

          <p className="mt-7 leading-relaxed text-body">{product.description}</p>

          {/* Locked price panel */}
          <div className="card mt-9 rounded-2xl p-7">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gold-pale text-gold">
                <Lock size={18} />
              </span>
              <div>
                <div className="font-display text-lg font-semibold text-ink">
                  Login to view price
                </div>
                <div className="text-sm text-body">
                  Pricing is available to approved trade customers only.
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <PremiumButton href="/trade-login">Trade Login</PremiumButton>
              <PremiumButton href="/contact" variant="outline">
                Apply for a Trade Account
              </PremiumButton>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div className="mt-24">
          <Reveal>
            <h2 className="font-display text-2xl font-bold text-ink">
              More from {category.name}
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="mt-8">
            <ProductGrid products={related} />
          </Reveal>
        </div>
      )}
    </div>
  );
}
