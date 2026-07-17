// ---------------------------------------------------------------------------
// Imports the Shopify product export CSVs into lib/products-data.json.
//
// Run with:  node scripts/import-products.mjs
//
// - Only imports products that are Published AND Status=active
// - NEVER copies prices into the output (the public site must not have them)
// - Extracts ABV, pack size and unit size from the title/description text
// - Maps Shopify "Type"/tags onto the site's category slugs
// ---------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";

const FILES = ["products_export_1.csv", "products_export_2.csv"];
const OUT = path.join("lib", "products-data.json");

// ----------------------------------------------------------------- CSV parse
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// ------------------------------------------------------------------- helpers
function slugify(s) {
  return s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function stripHtml(html) {
  return (html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&#8217;/g, "'")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// "24 x 330ml" style pack, or a single "70cl" size
function extractSizes(text) {
  const pack = text.match(/(\d{1,3})\s*[xX×]\s*(\d+(?:\.\d+)?)\s*(ml|cl|lt?r?|litre)s?\b/);
  if (pack) {
    const unit = `${pack[2]}${pack[3].toLowerCase().startsWith("l") ? "L" : pack[3].toLowerCase()}`;
    return {
      pack_size: `${pack[1]} x ${unit}`,
      unit_size: unit,
      case_size: pack[1],
    };
  }
  const single = text.match(/(\d+(?:\.\d+)?)\s*(cl|ml|lt?r?|litre)s?\b/i);
  if (single) {
    const unit = `${single[1]}${single[2].toLowerCase().startsWith("l") ? "L" : single[2].toLowerCase()}`;
    return { pack_size: unit, unit_size: unit, case_size: "" };
  }
  return { pack_size: "", unit_size: "", case_size: "" };
}

function extractAbv(title, description, tags) {
  // Explicit ABV wording is trusted anywhere ("46% ABV", "Alc Vol: 43%",
  // "ABV: 37.5") — a bare "88%" is NOT, because descriptions are full of
  // percentages that aren't alcohol ("88% juice", "45% fewer calories").
  for (const text of [title, description, tags]) {
    if (!text) continue;
    const m =
      text.match(/(\d{1,2}(?:\.\d{1,2})?)\s*%\s*(?:abv|alc|vol)/i) ||
      text.match(/(?:abv|alc(?:ohol)?\s*vol(?:ume)?)[.:\s]*(\d{1,2}(?:\.\d{1,2})?)/i);
    if (m) {
      const n = parseFloat(m[1]);
      if (n > 0 && n <= 96) return `${m[1]}%`;
    }
  }
  // A bare percentage is only trusted in the TITLE, and not when it's
  // part of "% extra / % off / % less" style offers
  const m = (title || "").match(/(\d{1,2}(?:\.\d{1,2})?)\s*%(?!\s*(?:extra|off|fewer|less|free|more|juice|recycled))/i);
  if (m) {
    const n = parseFloat(m[1]);
    if (n > 0 && n <= 96) return `${m[1]}%`;
  }
  return "";
}

// Work out whether it comes in cans, bottles or a keg (for the Format line)
function inferVessel(text, caseSize) {
  const hay = text.toLowerCase();
  const plural = caseSize && parseInt(caseSize, 10) > 1;
  if (/\bkegs?\b|perfect ?draft/.test(hay)) return "Keg";
  if (/\bcans?\b/.test(hay)) return plural ? "Cans" : "Can";
  if (/\bbottles?\b|\b70cl\b|\b75cl\b|\b1lt?\b/.test(hay)) return plural ? "Bottles" : "Bottle";
  return "";
}

// ------------------------------------------------------ country inference
// 1) Drink styles that legally/traditionally come from one place
const STYLE_COUNTRIES = [
  ["Scotland", /scotch|islay|speyside|highland single malt|single malt scotch/],
  ["Ireland", /irish whiskey|irish cream|irish stout|poitin|poteen/],
  ["France", /champagne|cognac|armagnac|calvados|bordeaux|provence|burgundy|beaujolais|chablis|sancerre/],
  ["Italy", /prosecco|amaretto|limoncello|sambuca|aperitivo|chianti|pinot grigio delle|montepulciano|barolo|spumante/],
  ["Spain", /\bcava\b|rioja|sangria/],
  ["Mexico", /tequila|mezcal/],
  ["USA", /bourbon|tennessee whiskey|kentucky/],
  ["Portugal", /\bporto\b|douro|vinho verde|madeira/],
  ["Japan", /japanese whisky|\bsake\b|shochu/],
  ["Greece", /\bouzo\b|metaxa/],
  ["Brazil", /cachaca|cachaça/],
  ["Peru", /\bpisco\b/],
];

// 2) Well-known brands → country of origin
const BRAND_COUNTRIES = {
  // Beers & ciders
  guinness: "Ireland", murphys: "Ireland", magners: "Ireland", bulmers: "Ireland",
  peroni: "Italy", "birra-moretti": "Italy", menabrea: "Italy",
  corona: "Mexico", modelo: "Mexico", "sol": "Mexico", pacifico: "Mexico",
  budweiser: "USA", coors: "USA", "miller": "USA", "brooklyn-brewery": "USA", "goose-island": "USA",
  heineken: "Netherlands", amstel: "Netherlands", grolsch: "Netherlands",
  "stella-artois": "Belgium", leffe: "Belgium", hoegaarden: "Belgium", duvel: "Belgium",
  carlsberg: "Denmark", somersby: "Denmark",
  kronenbourg: "France", "kronenbourg-1664": "France",
  "san-miguel": "Spain", "estrella-damm": "Spain", "estrella-galicia": "Spain", mahou: "Spain",
  becks: "Germany", warsteiner: "Germany", erdinger: "Germany", paulaner: "Germany",
  krombacher: "Germany", bitburger: "Germany", "franziskaner": "Germany",
  tyskie: "Poland", zywiec: "Poland", lech: "Poland", okocim: "Poland",
  asahi: "Japan", sapporo: "Japan", kirin: "Japan",
  tsingtao: "China", chang: "Thailand", singha: "Thailand", tiger: "Singapore",
  cobra: "India", kingfisher: "India", efes: "Turkey", mythos: "Greece",
  "red-stripe": "Jamaica", staropramen: "Czech Republic", "pilsner-urquell": "Czech Republic",
  budvar: "Czech Republic", "1664": "France",
  brewdog: "Scotland", tennents: "Scotland", "innis-and-gunn": "Scotland",
  "camden-town-brewery": "England", beavertown: "England", fullers: "England",
  "greene-king": "England", "timothy-taylor": "England", "shepherd-neame": "England",
  thatchers: "England", westons: "England", aspall: "England", strongbow: "England",
  "old-mout": "England", inches: "England",
  kopparberg: "Sweden", rekorderlig: "Sweden",
  // Spirits & liqueurs
  smirnoff: "United Kingdom", gordons: "United Kingdom", beefeater: "England",
  "bombay-sapphire": "England", sipsmith: "England", "whitley-neill": "England",
  "jj-whitley": "England", greenalls: "England", plymouth: "England",
  warners: "England", "chase": "England",
  tanqueray: "Scotland", hendricks: "Scotland", "johnnie-walker": "Scotland",
  "famous-grouse": "Scotland", bells: "Scotland", glenfiddich: "Scotland",
  glenmorangie: "Scotland", glenlivet: "Scotland", "the-glenlivet": "Scotland",
  macallan: "Scotland", laphroaig: "Scotland", talisker: "Scotland",
  "highland-park": "Scotland", balvenie: "Scotland", dalmore: "Scotland",
  jura: "Scotland", oban: "Scotland", dewars: "Scotland", drambuie: "Scotland",
  jameson: "Ireland", bushmills: "Ireland", "tullamore-dew": "Ireland",
  baileys: "Ireland", paddy: "Ireland", powers: "Ireland",
  "jack-daniels": "USA", "jim-beam": "USA", "makers-mark": "USA",
  "buffalo-trace": "USA", "wild-turkey": "USA", "woodford-reserve": "USA",
  bulleit: "USA", "southern-comfort": "USA",
  absolut: "Sweden", "grey-goose": "France", ciroc: "France",
  hennessy: "France", "remy-martin": "France", courvoisier: "France",
  martell: "France", "grand-marnier": "France", cointreau: "France", chambord: "France",
  bacardi: "Puerto Rico", "captain-morgan": "Jamaica", "havana-club": "Cuba",
  kraken: "Trinidad & Tobago", malibu: "Barbados",
  "jose-cuervo": "Mexico", patron: "Mexico", "el-jimador": "Mexico",
  olmeca: "Mexico", cazcabel: "Mexico",
  jagermeister: "Germany", disaronno: "Italy", aperol: "Italy",
  campari: "Italy", martini: "Italy", frangelico: "Italy", galliano: "Italy",
  "tia-maria": "Italy", archers: "United Kingdom", sourz: "United Kingdom",
  zubrowka: "Poland", belvedere: "Poland", chopin: "Poland",
  "russian-standard": "Russia", "au-vodka": "Wales", fireball: "Canada",
  // Champagne / sparkling / wine
  "moet-and-chandon": "France", "veuve-clicquot": "France", "laurent-perrier": "France",
  bollinger: "France", taittinger: "France", lanson: "France", "pol-roger": "France",
  mumm: "France", "piper-heidsieck": "France", "dom-perignon": "France", krug: "France",
  "whispering-angel": "France",
  freixenet: "Spain", "campo-viejo": "Spain", faustino: "Spain",
  bottega: "Italy", mionetto: "Italy", zonin: "Italy",
  barefoot: "USA", gallo: "USA", "blossom-hill": "USA", "echo-falls": "USA",
  "yellow-tail": "Australia", hardys: "Australia", "jacobs-creek": "Australia",
  lindemans: "Australia", penfolds: "Australia", "wolf-blass": "Australia", mcguigan: "Australia",
  "casillero-del-diablo": "Chile", "concha-y-toro": "Chile", "santa-rita": "Chile", frontera: "Chile",
  "oyster-bay": "New Zealand", "villa-maria": "New Zealand", brancott: "New Zealand",
  kumala: "South Africa", "blue-nun": "Germany", "black-tower": "Germany",
  mateus: "Portugal", trivento: "Argentina",
  // Softs & energy
  "red-bull": "Austria", monster: "USA", "irn-bru": "Scotland",
  "fever-tree": "England", fentimans: "England", appletiser: "South Africa",
  "san-pellegrino": "Italy", evian: "France", perrier: "France",
  "highland-spring": "Scotland",
};

// ------------------------------------------------------ brand owners
// The major drinks groups behind well-known brands (for the Brand
// Owner filter). Brands not listed simply have no owner recorded.
const BRAND_OWNERS = {
  // Diageo
  guinness: "Diageo", smirnoff: "Diageo", gordons: "Diageo", tanqueray: "Diageo",
  "captain-morgan": "Diageo", baileys: "Diageo", "johnnie-walker": "Diageo",
  ciroc: "Diageo", bells: "Diageo", talisker: "Diageo", archers: "Diageo",
  pimms: "Diageo", "pimm-s": "Diageo", oban: "Diageo",
  // Pernod Ricard
  absolut: "Pernod Ricard", jameson: "Pernod Ricard", beefeater: "Pernod Ricard",
  malibu: "Pernod Ricard", "havana-club": "Pernod Ricard", martell: "Pernod Ricard",
  "chivas-regal": "Pernod Ricard", glenlivet: "Pernod Ricard",
  "the-glenlivet": "Pernod Ricard", kahlua: "Pernod Ricard",
  // Bacardi Ltd
  bacardi: "Bacardí", "grey-goose": "Bacardí", "bombay-sapphire": "Bacardí",
  martini: "Bacardí", dewars: "Bacardí", patron: "Bacardí",
  // Brown-Forman
  "jack-daniels": "Brown-Forman", "woodford-reserve": "Brown-Forman",
  // Suntory Global Spirits
  "jim-beam": "Suntory", "makers-mark": "Suntory", laphroaig: "Suntory",
  sourz: "Suntory",
  // William Grant & Sons
  glenfiddich: "William Grant & Sons", balvenie: "William Grant & Sons",
  hendricks: "William Grant & Sons", "tullamore-dew": "William Grant & Sons",
  "monkey-shoulder": "William Grant & Sons",
  // Campari Group
  campari: "Campari Group", aperol: "Campari Group", "wild-turkey": "Campari Group",
  courvoisier: "Campari Group", "grand-marnier": "Campari Group",
  // Heineken
  heineken: "Heineken", amstel: "Heineken", "birra-moretti": "Heineken",
  strongbow: "Heineken", bulmers: "Heineken", "old-mout": "Heineken",
  inches: "Heineken", "inch-s": "Heineken", cruzcampo: "Heineken",
  tiger: "Heineken", sol: "Heineken", "red-stripe": "Heineken",
  desperados: "Heineken", fosters: "Heineken",
  // AB InBev
  budweiser: "AB InBev", "stella-artois": "AB InBev", corona: "AB InBev",
  becks: "AB InBev", leffe: "AB InBev", hoegaarden: "AB InBev",
  "camden-town-brewery": "AB InBev", "goose-island": "AB InBev",
  "bud-light": "AB InBev",
  // Molson Coors
  carling: "Molson Coors", coors: "Molson Coors", madri: "Molson Coors",
  staropramen: "Molson Coors", "sharps-brewery": "Molson Coors",
  aspall: "Molson Coors", worthington: "Molson Coors",
  // Carlsberg Britvic
  carlsberg: "Carlsberg Britvic", "san-miguel": "Carlsberg Britvic",
  somersby: "Carlsberg Britvic", brooklyn: "Carlsberg Britvic",
  hobgoblin: "Carlsberg Britvic", wychwood: "Carlsberg Britvic",
  tetleys: "Carlsberg Britvic", pepsi: "Carlsberg Britvic",
  "7up": "Carlsberg Britvic", tango: "Carlsberg Britvic",
  robinsons: "Carlsberg Britvic", j2o: "Carlsberg Britvic",
  britvic: "Carlsberg Britvic", "r-whites": "Carlsberg Britvic",
  // Asahi
  peroni: "Asahi", asahi: "Asahi", grolsch: "Asahi", fullers: "Asahi",
  meantime: "Asahi", "dark-star": "Asahi",
  // LVMH / Moët Hennessy
  "moet-and-chandon": "Moët Hennessy", "veuve-clicquot": "Moët Hennessy",
  hennessy: "Moët Hennessy", "dom-perignon": "Moët Hennessy",
  krug: "Moët Hennessy", belvedere: "Moët Hennessy",
  glenmorangie: "Moët Hennessy", ardbeg: "Moët Hennessy",
  // Edrington
  "famous-grouse": "Edrington", macallan: "Edrington", "highland-park": "Edrington",
  // Whyte & Mackay
  jura: "Whyte & Mackay", dalmore: "Whyte & Mackay",
  // Halewood
  "whitley-neill": "Halewood", "jj-whitley": "Halewood",
  "dead-mans-fingers": "Halewood", "dead-man-s-fingers": "Halewood",
  // Rémy Cointreau
  "remy-martin": "Rémy Cointreau", cointreau: "Rémy Cointreau",
  // Mast-Jägermeister
  jagermeister: "Mast-Jägermeister",
  // Disaronno International
  disaronno: "Disaronno International", "tia-maria": "Disaronno International",
  // Wine groups
  barefoot: "E&J Gallo", gallo: "E&J Gallo",
  "blossom-hill": "Treasury Wine Estates", "wolf-blass": "Treasury Wine Estates",
  lindemans: "Treasury Wine Estates", penfolds: "Treasury Wine Estates",
  hardys: "Accolade Wines", "echo-falls": "Accolade Wines", kumala: "Accolade Wines",
  "casillero-del-diablo": "Concha y Toro", frontera: "Concha y Toro",
  freixenet: "Henkell Freixenet", mionetto: "Henkell Freixenet",
  "jacobs-creek": "Pernod Ricard", "campo-viejo": "Pernod Ricard",
  // Softs & snacks
  "coca-cola": "Coca-Cola", fanta: "Coca-Cola", sprite: "Coca-Cola",
  schweppes: "Coca-Cola", appletiser: "Coca-Cola",
  "irn-bru": "AG Barr", rubicon: "AG Barr", boost: "AG Barr", barr: "AG Barr",
  lucozade: "Suntory", ribena: "Suntory",
  "red-bull": "Red Bull", rockstar: "PepsiCo", walkers: "PepsiCo",
  doritos: "PepsiCo", cheetos: "PepsiCo", pipers: "PepsiCo",
  kp: "KP Snacks", mccoys: "KP Snacks", "hula-hoops": "KP Snacks",
  butterkist: "KP Snacks", nobbys: "KP Snacks", discos: "KP Snacks",
  "san-pellegrino": "Nestlé", buxton: "Nestlé", nescafe: "Nestlé",
};

// ------------------------------------------------------ specifications
// Gluten free, vegan, PMP etc — from the shop's dietary metafield
// plus clear wording in the title/tags.
function extractSpecs(title, tags, dietary) {
  const specs = new Set();
  const hay = `${title} ${tags} ${dietary}`.toLowerCase();
  if (/gluten[- ]?free/.test(hay)) specs.add("Gluten Free");
  if (/\bvegan\b/.test(hay)) specs.add("Vegan");
  if (/\borganic\b/.test(hay)) specs.add("Organic");
  if (/sugar[- ]?free|no added sugar|zero sugar|\bdiet\b/.test(hay)) specs.add("Low & No Sugar");
  if (/\bpmp\b|price[- ]?marked|\bpm ?£/.test(hay)) specs.add("Price-Marked Pack");
  if (/limited edition/.test(hay)) specs.add("Limited Edition");
  return [...specs];
}

// 3) Plain geography words as a last resort
const GEO_WORDS = [
  ["Scotland", /scottish|scotland/],
  ["Ireland", /\birish\b|ireland/],
  ["England", /\benglish\b|england/],
  ["Wales", /\bwelsh\b|\bwales\b/],
  ["France", /\bfrench\b|\bfrance\b/],
  ["Italy", /italian|\bitaly\b/],
  ["Spain", /spanish|\bspain\b/],
  ["Germany", /\bgerman\b|germany/],
  ["Netherlands", /\bdutch\b|netherlands|holland/],
  ["Belgium", /belgian|belgium/],
  ["Poland", /\bpolish\b|\bpoland\b/],
  ["Sweden", /swedish|\bsweden\b/],
  ["Japan", /japanese|\bjapan\b/],
  ["China", /chinese|\bchina\b/],
  ["Thailand", /\bthai\b|thailand/],
  ["India", /\bindian\b|\bindia\b/],
  ["Mexico", /mexican|\bmexico\b/],
  ["USA", /\bamerican\b|\busa\b|united states/],
  ["Jamaica", /jamaican|jamaica/],
  ["Cuba", /\bcuban\b|\bcuba\b/],
  ["Australia", /australian|australia/],
  ["New Zealand", /new zealand|marlborough/],
  ["Chile", /chilean|\bchile\b/],
  ["Argentina", /argentin/],
  ["South Africa", /south african|south africa/],
  ["Portugal", /portuguese|portugal/],
  ["Greece", /\bgreek\b|greece/],
  ["Turkey", /turkish|turkey/],
  ["Austria", /austrian|austria/],
];

function inferCountry(brandSlug, text) {
  const hay = text.toLowerCase();
  for (const [country, re] of STYLE_COUNTRIES) {
    if (re.test(hay)) return country;
  }
  if (BRAND_COUNTRIES[brandSlug]) return BRAND_COUNTRIES[brandSlug];
  for (const [country, re] of GEO_WORDS) {
    if (re.test(hay)) return country;
  }
  return "";
}

// ------------------------------------------------------ category mapping
// Checked in order — first match wins.
const CATEGORY_RULES = [
  ["no-low-alcohol", /alcohol[- ]free|non[- ]alcoholic|de[- ]alcohol|0\.0%/],
  ["kegs", /\bkegs?\b|perfect draft|perfectdraft/],
  ["miniatures", /miniature|minature|\b5cl\b/],
  ["gift-sets", /gift ?set|giftset|hamper|gift box|advent calendar/],
  // NB: "\bstraws?\b" not "straw" (strawberry!), and "cap" must not match
  // the "screw cap" tag that bottles carry.
  ["bar-supplies", /\bglass(es|ware)?\b(?!\s?bottles?)|(?<!screw\s?)(?<!flip\s?)\bcaps?\b|bar mat|barmat|coaster|opener|ice bucket|\bjug\b|\btray\b|\bstraws?\b|t-shirt|towel|sign\b|pump clip|greeting|note card|accessor|optic|pourer|shaker|bar blade|umbrella|tankard|chalice|pint pot|snifter|goblet|stein|growler|lanyard|beerline|line cleaner|keyring/],
  ["champagne-prosecco", /champagne|prosecco|sparkling|\bcava\b|cremant|crémant|moscato spumante/],
  ["wine", /red wine|white wine|rose wine|rosé|\bwine\b|\bport\b|sherry|vermouth|\bsake\b|sangria|fortified|sauvignon|chardonnay|merlot|cabernet|shiraz|syrah|pinot|grigio|malbec|riesling|tempranillo|zinfandel|viognier|moscato|rosado|\bchenin\b|\bvino\b|\bbianco\b|fruit fusion|md 20\/20/],
  ["cider", /cider|perry\b/],
  ["rtds", /pre[- ]?mix(ed)?|ready to drink|\brtd\b|hard seltzer|seltzer|alcopop|cocktail in a|canned cocktail|\bcocktail\b/],
  ["liqueurs-speciality", /liqueur|schnapps|sambuca|amaretto|aperitivo|aperol|cream liqueur|absinthe|bitters\b|pastis|ouzo|limoncello|advocaat|triple sec|curacao|cassis|campari|baileys|soplica|pimm'?s\b|cactus jack|\bshots?\b/],
  ["spirits", /\bgin\b|vodka|whisky|whiskey|scotch|bourbon|\brum\b|tequila|mezcal|cognac|brandy|armagnac|calvados|grappa|\bspirit\b|soju|arak|raki|cachaca|cachaça|pisco|lubelska|\brye\b|single barrel|\balcohol\b/],
  ["hot-beverages", /horlicks|ovaltine/],
  ["energy-drinks", /energy drink|\benergy\b|red bull|monster|relentless|rockstar|lucozade|prime hydration/],
  ["hot-beverages", /coffee|\btea\b|hot chocolate|cappuccino|espresso/],
  ["snacks", /crisps|snack|\bnuts\b|scratchings|pretzels|popcorn|biltong|jerky|chocolate bar|sweets|candy/],
  // Soft drinks BEFORE the beer rules: tags like "Ginger Beer & Mixers"
  // must not drag a lemonade into the lager section.
  ["soft-drinks", /soft drink|mixer|tonic|lemonade|\bcola\b|juice|cordial|syrup|\bwater\b|squash|ginger beer|ginger ale|\bsoda\b|kombucha|milkshake|smoothie|fizzy|7 ?up|pepsi|coca[- ]?cola|fanta|sprite|dr ?pepper|\btango\b|appletiser|\bj2o\b|irn[- ]?bru|rubicon|vimto|ribena|shloer|schweppes|capri[- ]?sun|fruit shoot|supermalt|malt drink/],
  ["ales-bitters-stouts", /stout|\bale\b|\bales\b|bitter\b|porter|\bmild\b/],
  ["lagers-craft-beers", /lager|pilsner|pils\b|\bbeer\b|\bipa\b|pale ale|helles|weissbier|wheat beer/],
];

// Brands whose whole range belongs to one category. Checked AFTER the
// product Type (so "Appletiser Glass" still counts as an accessory)
// but BEFORE the title/tags text matching.
const BRAND_CATEGORIES = {
  "7up": "soft-drinks", pepsi: "soft-drinks", "coca-cola": "soft-drinks",
  fanta: "soft-drinks", sprite: "soft-drinks", "dr-pepper": "soft-drinks",
  tango: "soft-drinks", schweppes: "soft-drinks", j2o: "soft-drinks",
  britvic: "soft-drinks", robinsons: "soft-drinks", ribena: "soft-drinks",
  vimto: "soft-drinks", appletiser: "soft-drinks", rubicon: "soft-drinks",
  "old-jamaica": "soft-drinks", "san-pellegrino": "soft-drinks",
  "highland-spring": "soft-drinks", evian: "soft-drinks", volvic: "soft-drinks",
  buxton: "soft-drinks", "irn-bru": "soft-drinks", fentimans: "soft-drinks",
  "fever-tree": "soft-drinks", frobishers: "soft-drinks", belvoir: "soft-drinks",
  shloer: "soft-drinks", bottlegreen: "soft-drinks", "franklin-and-sons": "soft-drinks",
  ka: "soft-drinks", lilt: "soft-drinks", oasis: "soft-drinks",
  "red-bull": "energy-drinks", monster: "energy-drinks", relentless: "energy-drinks",
  rockstar: "energy-drinks", boost: "energy-drinks", lucozade: "energy-drinks",
  prime: "energy-drinks",
  "red-stripe": "lagers-craft-beers", wkd: "rtds",
  walkers: "snacks", mccoys: "snacks", kp: "snacks", nobbys: "snacks",
  pipers: "snacks", kettle: "snacks", pringles: "snacks", seabrook: "snacks",
  tayto: "snacks", "hula-hoops": "snacks",
};

// Products whose shop Type is outright wrong — e.g. Dragon Soop is typed
// "Energy Drink" but is a 7.5% caffeinated alcoholic drink. Checked first,
// unless the product is clearly a branded accessory (glass, cap, etc.).
const NAME_OVERRIDES = [
  // Kegs first — a keg is a keg even when its shop Type just says "Beer"
  ["kegs", /\bkegs?\b|perfect ?draft|brewlock|draught ?master/i],
  ["no-low-alcohol", /lyre'?s|non[- ]?alcoholic|alcohol[- ]free|low alcohol|\b0\.[05]\s?%|\b0[.,]0\b/i],
  ["rtds", /dragon soop|four loko|\bhooch\b|alcoholic ginger beer|alcoholic beverage|\bvk\b|smirnoff ice/i],
  // (miniatures are excluded so a 5cl Baileys still counts as a miniature)
  ["liqueurs-speciality", /(baileys|soplica|jeeves punch|schnapps)(?!.*(miniature|minature|\b5cl\b))/i],
  // "Fine Champagne" on a cognac label is a cognac grade, not champagne
  ["spirits", /smirnoff espresso|\bcognac\b|\barmagnac\b/i],
  // Sparkling water is not sparkling wine
  ["soft-drinks", /\b(sparkling|spring|mineral) water\b/i],
  ["soft-drinks", /(supermalt|mighty malt|malt drink)(?!.*stout)/i],
  // Cocktail syrups/mixers/purees mention cocktails but aren't alcoholic
  ["soft-drinks", /\bsyrups?\b|monin|cocktail mixer|pur[eé]e/i],
  ["gift-sets", /cocktail (set|bundle)/i],
  // Perry is pear cider; several beers arrive tagged/typed as cider
  ["cider", /\bcider\b|\bperry\b|\bcyder\b|babycham/i],
  ["ales-bitters-stouts", /\bstout\b|\bporter\b|meantime|strong ale|ale beer\b/i],
  ["lagers-craft-beers", /sagres|cerveja|curveja|cerveza|estrella daura/i],
];
// "Glass Bottle(s)" is packaging, not glassware — hence the lookahead
const ACCESSORY_GUARD = /glass(?!\s?bottles?)|\bmug\b|\bcap\b|bar mat|coaster|t-shirt|towel|\bsign\b|\btray\b|keyring|bar blade/i;

// Hardware & merchandise checked before EVERYTHING — "BLADE Dome" mentions
// kegs but is a dispenser part, not a keg.
const HARDWARE_OVERRIDE = /\bdome\b|tap handle|dispenser|drip tray|\bco2\b|gas cylinder|coupler|beerline|line cleaner|pump clip|lanyard|keyring|bar runner|\baccessory\b|font kit|scratch card|poster\b|\bmachine\b|(?<!with )ice jacket|starter (pack|bundle|set|kit)|draught system|draft system|countertop/i;

// Match against the most reliable signal first:
//   0. name overrides for known data errors (above)
//   1. the product Type ("Single Malt Scotch Whisky", "Glass"…)
//   2. the brand, for single-category brands (7UP is never a lager)
//   3. the title
//   4. the tags (noisiest — a whisky tagged "gift box" is still a whisky)
function mapCategory(type, tags, title, brandSlug) {
  if (HARDWARE_OVERRIDE.test(title)) return "bar-supplies";
  // Gift sets/packs often include glasses, so this check comes before
  // the accessory guard ("in gift box" is just a boxed bottle though)
  if (/gift ?set|giftset|gift ?pack/i.test(title)) return "gift-sets";
  if (!ACCESSORY_GUARD.test(title)) {
    for (const [slug, re] of NAME_OVERRIDES) {
      if (re.test(title)) return slug;
    }
  }
  const passes = [type, null, title, tags]; // null = brand table slot
  for (let i = 0; i < passes.length; i++) {
    if (i === 1) {
      if (BRAND_CATEGORIES[brandSlug]) return BRAND_CATEGORIES[brandSlug];
      continue;
    }
    const lower = (passes[i] || "").toLowerCase();
    if (!lower) continue;
    for (const [slug, re] of CATEGORY_RULES) {
      if (re.test(lower)) return slug;
    }
  }
  return null;
}

// ------------------------------------------------------------------ main
const products = new Map(); // handle → product
const unmapped = new Map();
let skipped = { notActive: 0, giftCard: 0, noTitle: 0 };

for (const file of FILES) {
  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  const header = rows[0];
  const col = Object.fromEntries(header.map((h, i) => [h, i]));
  const get = (r, name) => (col[name] != null ? r[col[name]] || "" : "");

  for (const r of rows.slice(1)) {
    const handle = get(r, "Handle");
    if (!handle) continue;

    const existing = products.get(handle);

    // Image-only continuation rows: attach the first/best image
    if (existing) {
      const img = get(r, "Image Src");
      const pos = parseInt(get(r, "Image Position") || "99", 10);
      if (img && pos < existing._imgPos) {
        existing.image_url = img;
        existing._imgPos = pos;
      }
      continue;
    }

    const title = get(r, "Title");
    if (!title) continue; // continuation row for a product we skipped

    if (get(r, "Status") !== "active" || get(r, "Published") !== "true") {
      skipped.notActive++;
      products.set(handle, null); // remember so continuation rows are skipped
      continue;
    }
    if (get(r, "Gift Card").toUpperCase() === "TRUE") {
      skipped.giftCard++;
      products.set(handle, null);
      continue;
    }

    const type = get(r, "Type");
    const tags = get(r, "Tags");
    const body = get(r, "Body (HTML)");
    const description = stripHtml(body);

    let vendor = get(r, "Vendor") || "Gala Drinks";
    // Tidy inconsistent vendor names ("amstel" → "Amstel")
    if (vendor === vendor.toLowerCase()) {
      vendor = vendor.replace(/\b[a-z]/g, (c) => c.toUpperCase());
    }
    const brandSlug = slugify(vendor);

    const category = mapCategory(type, tags, title, brandSlug);
    if (!category) {
      unmapped.set(type || "(no type)", (unmapped.get(type || "(no type)") || 0) + 1);
    }

    const sizeText = `${title} ${description}`;
    const sizes = extractSizes(sizeText);
    const abv = extractAbv(title, description, tags);
    const barcode = get(r, "Variant Barcode").replace(/^'+/, "");
    const sku = get(r, "Variant SKU").replace(/^'+/, "");

    // Prefer the shop's own metafields; infer the rest where we can
    const country =
      get(r, "Country (product.metafields.shopify.country)") ||
      inferCountry(brandSlug, `${type} ${title} ${tags}`);
    const vessel =
      get(r, "Package type (product.metafields.shopify.package-type)") ||
      inferVessel(title, sizes.case_size);
    const owner = BRAND_OWNERS[brandSlug] || "";
    const specs = extractSpecs(
      title,
      tags,
      get(r, "Dietary preferences (product.metafields.shopify.dietary-preferences)")
    );

    const prod = {
      slug: handle,
      name: title,
      brand: vendor,
      brandSlug,
      category: category || "bar-supplies",
      pack_size: sizes.pack_size,
      unit_size: sizes.unit_size,
      case_size: sizes.case_size,
      abv,
      country,
      vessel,
      image_url: get(r, "Image Src"),
      description,
      sku,
      barcode,
      owner,
      specs,
      _imgPos: parseInt(get(r, "Image Position") || "99", 10) || 99,
    };
    products.set(handle, prod);
  }
}

// Tidy up: drop helper fields and empty strings to keep the JSON small
const list = [...products.values()]
  .filter(Boolean)
  .map((p) => {
    delete p._imgPos;
    for (const k of Object.keys(p)) {
      if (p[k] === "" || (Array.isArray(p[k]) && p[k].length === 0)) delete p[k];
    }
    return p;
  })
  .sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync(OUT, JSON.stringify(list));

// ------------------------------------------------------------------ report
const byCat = {};
for (const p of list) byCat[p.category] = (byCat[p.category] || 0) + 1;

console.log(`Imported ${list.length} products → ${OUT}`);
console.log(`Skipped: ${skipped.notActive} not active/published, ${skipped.giftCard} gift cards`);
console.log(`With images: ${list.filter((p) => p.image_url).length}`);
console.log(`With ABV: ${list.filter((p) => p.abv).length}, with pack size: ${list.filter((p) => p.pack_size).length}`);
console.log(`With country: ${list.filter((p) => p.country).length}, with vessel: ${list.filter((p) => p.vessel).length}`);
console.log("\nBy category:");
for (const [c, n] of Object.entries(byCat).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${c}: ${n}`);
}
if (unmapped.size) {
  console.log("\nUnmapped types (fell back to bar-supplies):");
  for (const [t, n] of [...unmapped.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25)) {
    console.log(`  ${t}: ${n}`);
  }
}
console.log(`\nFile size: ${(fs.statSync(OUT).size / 1024 / 1024).toFixed(1)} MB`);
