import { products, brands } from "@/lib/catalogue";
import { categories } from "@/lib/categories";

// Sitemap for search engines — every public page on the site.
const BASE = "https://www.galadrinks.co.uk";

export default function sitemap() {
  const staticPages = [
    "", "/products", "/brands", "/brochures", "/services",
    "/about", "/contact", "/delivery", "/trade-login",
  ].map((p) => ({ url: `${BASE}${p}`, changeFrequency: "weekly", priority: p === "" ? 1 : 0.7 }));

  const categoryPages = categories.map((c) => ({
    url: `${BASE}/category/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const brandPages = brands.map((b) => ({
    url: `${BASE}/brands/${b.slug}`,
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  const productPages = products.map((p) => ({
    url: `${BASE}/products/${p.slug}`,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticPages, ...categoryPages, ...brandPages, ...productPages];
}
