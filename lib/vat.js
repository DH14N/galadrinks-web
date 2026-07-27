// ---------------------------------------------------------------------------
// VAT helpers.
//
// Prices are held and shown EX-VAT (the trade norm — business customers
// reclaim VAT). VAT is worked out per line and added at the basket.
//
// Rates are whole percentages: 20 = 20%, 0 = zero-rated.
// Everything is in pence, and rounded per line, which is how invoices
// are normally calculated.
// ---------------------------------------------------------------------------

export const DEFAULT_VAT_RATE = 20;

// VAT on a single line (already multiplied by quantity)
export function vatOn(netPence, rate = DEFAULT_VAT_RATE) {
  const r = Number.isFinite(Number(rate)) ? Number(rate) : DEFAULT_VAT_RATE;
  return Math.round((netPence * r) / 100);
}

// Ex-VAT price with VAT added — used for the small "inc VAT" line
export function incVat(netPence, rate = DEFAULT_VAT_RATE) {
  return netPence + vatOn(netPence, rate);
}

// Totals a basket/order. Each line needs: qty, unit_price_pence, vat_rate
export function totalsFor(lines) {
  let net = 0;
  let vat = 0;

  for (const line of lines) {
    const lineNet = (line.qty || 0) * (line.unit_price_pence || 0);
    net += lineNet;
    vat += vatOn(lineNet, line.vat_rate);
  }

  return { net, vat, gross: net + vat };
}

export const money = (pence) => "£" + ((pence || 0) / 100).toFixed(2);
