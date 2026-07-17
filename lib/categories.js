// ---------------------------------------------------------------------------
// Category definitions + small display helpers.
//
// This file is safe to import from client components (header, product cards)
// because it contains NO product data — the full 4,000-product catalogue
// lives in lib/catalogue.js and stays on the server.
// ---------------------------------------------------------------------------

export const categories = [
  { slug: "lagers-craft-beers", name: "Lagers & Craft Beers", icon: "beer",
    description: "Premium world lagers and craft beers — the core of every bar and shop." },
  { slug: "ales-bitters-stouts", name: "Ales, Bitters & Stouts", icon: "beer",
    description: "Classic ales, smooth bitters and rich stouts from trusted breweries." },
  { slug: "cider", name: "Cider", icon: "apple",
    description: "Traditional and fruit ciders in cans and bottles, ready for the fridge." },
  { slug: "spirits", name: "Spirits", icon: "martini",
    description: "Whisky, vodka, gin, rum, tequila and cognac — the back-bar essentials." },
  { slug: "liqueurs-speciality", name: "Liqueurs & Speciality", icon: "flask",
    description: "Cream liqueurs, shots, aperitifs and speciality pours for every cocktail list." },
  { slug: "rtds", name: "RTDs & Cocktails", icon: "cup-soda",
    description: "Ready-to-drink cans, bottles and pre-mixed cocktails that sell themselves." },
  { slug: "wine", name: "Wine", icon: "wine",
    description: "Red, white, rosé and fortified wines for restaurants, bars and retail." },
  { slug: "champagne-prosecco", name: "Champagne & Prosecco", icon: "sparkles",
    description: "Sparkling wine, prosecco and champagne for celebrations big and small." },
  { slug: "kegs", name: "Kegs", icon: "cylinder",
    description: "Kegs and PerfectDraft — draught beer for venues and home bars." },
  { slug: "miniatures", name: "Miniatures", icon: "martini",
    description: "5cl miniatures — perfect for gifts, favours and minibars." },
  { slug: "gift-sets", name: "Gift Sets", icon: "gift",
    description: "Ready-made drinks gifts, hampers and presentation sets." },
  { slug: "soft-drinks", name: "Soft Drinks & Mixers", icon: "glass-water",
    description: "Cans, bottles, juices and mixers — the fastest movers in any venue." },
  { slug: "energy-drinks", name: "Energy Drinks", icon: "zap",
    description: "High-demand energy brands in single cans and multipacks." },
  { slug: "snacks", name: "Snacks", icon: "popcorn",
    description: "Crisps, nuts and bar snacks to complete your order." },
  { slug: "hot-beverages", name: "Hot Beverages", icon: "coffee",
    description: "Coffee, tea and hot chocolate for cafés and venues." },
  { slug: "no-low-alcohol", name: "No & Low Alcohol", icon: "leaf",
    description: "The fastest growing range in the trade — great taste, no compromise." },
  { slug: "bar-supplies", name: "Bar Supplies & Accessories", icon: "package",
    description: "Glassware, branded accessories and everything else behind the bar." },
];

export function getCategory(slug) {
  return categories.find((c) => c.slug === slug) || null;
}

// "24 x 330ml" + "Bottles" → "24 x 330ml Bottles"
export function getFormat(product) {
  if (!product.pack_size) return product.vessel || "";
  if (!product.vessel) return product.pack_size;
  return `${product.pack_size} ${product.vessel}`;
}
