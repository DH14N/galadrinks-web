import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// The suppliers/brands shown in the "Brands we stock" strip.
//
// To add a logo: drop an image into  public/brands/  named after the
// slug below, e.g.  public/brands/heineken.png
// (.png, .svg, .jpg and .webp all work — transparent PNG or SVG is best.)
//
// Any brand without a logo file simply shows its name as text, so the
// strip always looks complete.
// ---------------------------------------------------------------------------

export const STOCKED_BRANDS = [
  { name: "AB InBev", slug: "ab-inbev" },
  { name: "Diageo", slug: "diageo" },
  { name: "Heineken", slug: "heineken" },
  { name: "Coca-Cola", slug: "coca-cola" },
  { name: "Britvic", slug: "britvic" },
  { name: "Carlsberg Marston's", slug: "carlsberg-marstons" },
  { name: "Walkers", slug: "walkers" },
  { name: "Folkington's", slug: "folkingtons" },
  { name: "Kopparberg", slug: "kopparberg" },
  { name: "Schweppes", slug: "schweppes" },
  { name: "Thatchers", slug: "thatchers" },
  { name: "Ty Nant", slug: "ty-nant" },
];

// Looks in public/brands for a file matching each slug (server-side only)
export function getStockedBrands() {
  let files = [];
  try {
    files = fs.readdirSync(path.join(process.cwd(), "public", "brands"));
  } catch {
    files = []; // folder not created yet — everything falls back to text
  }

  return STOCKED_BRANDS.map((brand) => {
    const match = files.find(
      (f) => f.replace(/\.[^.]+$/, "").toLowerCase() === brand.slug
    );
    return { ...brand, logo: match ? `/brands/${match}` : null };
  });
}
