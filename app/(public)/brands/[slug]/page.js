import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import ProductGrid from "@/components/ProductGrid";
import Reveal from "@/components/Reveal";
import { getBrand, getProductsByBrand } from "@/lib/catalogue";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const brand = getBrand(slug);
  if (!brand) return { title: "Brand not found" };
  return { title: brand.name };
}

export default async function BrandPage({ params }) {
  const { slug } = await params;
  const brand = getBrand(slug);
  if (!brand) notFound();

  const items = getProductsByBrand(slug);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-[140px] sm:px-6">
      <Reveal>
        <nav className="flex items-center gap-1.5 text-sm text-body">
          <Link href="/" className="hover:text-gold">Home</Link>
          <ChevronRight size={14} />
          <Link href="/brands" className="hover:text-gold">Brands</Link>
          <ChevronRight size={14} />
          <span className="text-ink">{brand.name}</span>
        </nav>
        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          {brand.name}
        </h1>
      </Reveal>
      <Reveal delay={0.1} className="mt-12">
        <ProductGrid products={items} />
      </Reveal>
    </div>
  );
}
