// ---------------------------------------------------------------------------
// Ranking website products against a line from Sage.
//
// SERVER ONLY. This never decides a match on its own — a person confirms
// every one on the matching screen. Two attempts at automatic matching both
// produced wrong answers that looked confident ("Absolut Vodka" £14.99 onto
// a 5cl miniature, "Amaretto, Disaronno 70cl" onto a branded glass), and a
// wrong price is worse than no price. All this does is put the right answer
// near the top so confirming it is one click.
// ---------------------------------------------------------------------------

// Sage descriptions are typed short and abbreviated
const ABBREV = {
  btl: "bottle", btls: "bottle", bot: "bottle", bott: "bottle",
  cn: "can", cns: "can", cans: "can", bottles: "bottle",
  med: "medium", swt: "sweet", drt: "dry", org: "original",
  lt: "light", lgt: "light", pk: "pack", cs: "case", ctn: "carton",
  absinth: "absinthe", whisky: "whiskey", liquor: "liqueur",
  drft: "draught", nrb: "bottle",
};

const STOP = new Set(["the", "of", "and", "a", "with", "in", "new", "x"]);

// Things that look like a product but aren't the drink: glassware, gift
// sets, miniatures. These outrank the real product surprisingly often
// because their names are short, so they're pushed down unless the Sage
// description actually asks for one.
const NOVELTY = /\b(glass|glasses|miniature|gift|bundle|pack of|tasting set|merchandise|t-shirt|towel|mat|font|badge|umbrella)\b/i;

const COMBINING = /[̀-ͯ]/g;

function normalise(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(COMBINING, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9.]+/g, " ")
    .trim();
}

// Every volume mentioned, converted to millilitres so 70cl and 700ml match
export function sizesIn(text) {
  const out = new Set();
  const t = normalise(text);
  const re = /(\d+(?:\.\d+)?)\s*(cl|ml|ltr|lt|l|g|gal)\b/g;
  let m;
  while ((m = re.exec(t))) {
    const v = parseFloat(m[1]);
    if (m[2] === "cl") out.add(Math.round(v * 10));
    else if (m[2] === "ml") out.add(Math.round(v));
    else if (m[2] === "l" || m[2] === "lt" || m[2] === "ltr") out.add(Math.round(v * 1000));
    else out.add(Math.round(v * 4546));         // gallons, for kegs
  }
  return out;
}

// The "24" in "24x330ml"
function packsIn(text) {
  const out = new Set();
  const re = /(\d+)\s*x\s*(\d+)/g;
  let m;
  while ((m = re.exec(normalise(text)))) out.add(parseInt(m[1], 10));
  return out;
}

export function tokensIn(text) {
  const out = new Set();
  for (let w of normalise(text).split(" ")) {
    if (!w || w.length < 2) continue;
    w = ABBREV[w] || w;
    if (STOP.has(w)) continue;
    if (/^\d+(\.\d+)?(cl|ml|ltr|lt|l|g)?$/.test(w)) continue;   // sizes handled separately
    out.add(w);
  }
  return out;
}

// Words shared by hundreds of products ("vodka") say much less about a match
// than rare ones ("aotearoa"), so each word is weighted by how unusual it is.
export function buildIndex(products) {
  const docs = products.map((p) => {
    const text = [p.name, p.brand, p.pack_size, p.unit_size].filter(Boolean).join(" ");
    return {
      product: p,
      toks: tokensIn(text),
      sizes: sizesIn(text),
      packs: packsIn(text),
      novelty: NOVELTY.test(p.name || ""),
    };
  });

  const seen = new Map();
  for (const d of docs) for (const t of d.toks) seen.set(t, (seen.get(t) || 0) + 1);

  const n = docs.length || 1;
  const idf = new Map();
  for (const [t, c] of seen) idf.set(t, Math.log(n / (1 + c)) + 1);
  const fallback = Math.log(n) + 1;

  const byToken = new Map();
  docs.forEach((d, i) => {
    for (const t of d.toks) {
      if (!byToken.has(t)) byToken.set(t, []);
      byToken.get(t).push(i);
    }
  });

  return { docs, idf, fallback, byToken };
}

function weight(index, t) {
  return index.idf.get(t) ?? index.fallback;
}

// "11 gallon" works out at 50,006ml and the catalogue says "50 Lt" — the
// same keg. Sizes are compared with a little slack so rounding like that
// doesn't look like a mismatch.
function sizesAgree(a, b) {
  for (const x of a) {
    for (const y of b) {
      if (Math.abs(x - y) <= Math.max(x, y) * 0.02) return true;
    }
  }
  return false;
}

// One letter out — "Disarrono" for "Disaronno". The catalogue came from a
// shop export and has typos like this in it, which otherwise hide the
// correct product completely.
function nearlyEqual(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;

  // Two letters swapped round — "Disarrono" for "Disaronno", the commonest
  // typing slip of the lot.
  if (a.length === b.length) {
    const diff = [];
    for (let k = 0; k < a.length; k++) if (a[k] !== b[k]) diff.push(k);
    if (diff.length === 2 && diff[1] === diff[0] + 1 &&
        a[diff[0]] === b[diff[1]] && a[diff[1]] === b[diff[0]]) return true;
  }

  let i = 0, j = 0, slips = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++slips > 1) return false;
    if (a.length === b.length) { i++; j++; }
    else if (a.length > b.length) i++;
    else j++;
  }
  return slips + (a.length - i) + (b.length - j) <= 1;
}

function scoreOne(index, query, doc) {
  let shared = 0;
  for (const t of query.toks) {
    if (doc.toks.has(t)) {
      shared += weight(index, t);
    } else if (t.length >= 6) {
      for (const d of doc.toks) {
        if (d.length >= 6 && nearlyEqual(t, d)) { shared += weight(index, t) * 0.7; break; }
      }
    }
  }
  if (!shared) return 0;

  let total = 0;
  const union = new Set([...query.toks, ...doc.toks]);
  for (const t of union) total += weight(index, t);
  let s = total ? shared / total : 0;

  // A size on both sides that disagrees is a strong signal it's the wrong
  // one — that's the 70cl-vs-5cl-miniature mistake.
  if (query.sizes.size && doc.sizes.size) {
    s *= sizesAgree(query.sizes, doc.sizes) ? 1.18 : 0.5;
  }
  if (query.packs.size && doc.packs.size) {
    s *= [...query.packs].some((v) => doc.packs.has(v)) ? 1.1 : 0.75;
  }
  if (doc.novelty && !NOVELTY.test(query.raw)) s *= 0.3;

  // Where Sage gives a price, a candidate priced nothing like it is
  // usually the wrong size or a miniature. The website's own prices are
  // retail and unreliable, so this only nudges — it never decides.
  const theirs = doc.product?.trade_price_pence;
  if (query.pricePence > 0 && theirs > 0) {
    const ratio = theirs / query.pricePence;
    if (ratio < 0.5 || ratio > 4) s *= 0.8;
  }

  return Math.min(s, 1);
}

// The best candidates for one Sage description, best first.
export function rankCandidates(index, description, limit = 6, pricePence = 0) {
  const query = {
    raw: description || "",
    toks: tokensIn(description),
    sizes: sizesIn(description),
    packs: packsIn(description),
    pricePence: pricePence || 0,
  };
  if (!query.toks.size) return [];

  const considered = new Set();
  for (const t of query.toks) for (const i of index.byToken.get(t) || []) considered.add(i);

  const scored = [];
  for (const i of considered) {
    const s = scoreOne(index, query, index.docs[i]);
    if (s > 0.05) scored.push({ score: s, product: index.docs[i].product });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

// Plain text search, for when none of the suggestions are right.
export function searchProductsByName(index, term, limit = 12) {
  const needle = normalise(term);
  if (needle.length < 2) return [];
  const words = needle.split(" ").filter(Boolean);

  const hits = [];
  for (const d of index.docs) {
    const hay = normalise([d.product.name, d.product.brand].filter(Boolean).join(" "));
    if (words.every((w) => hay.includes(w))) {
      hits.push({ score: 1 / (1 + hay.length), product: d.product });
    }
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}
