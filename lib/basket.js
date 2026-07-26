// ---------------------------------------------------------------------------
// The basket, kept in the browser between visits.
//
// It deliberately stores ONLY product ids and quantities — never prices.
// Prices are always fetched fresh from the server, and recalculated again
// when the order is placed, so a stale or edited basket can never affect
// what a customer is charged.
// ---------------------------------------------------------------------------

const KEY = "gala_basket";

function read() {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((i) => typeof i?.product_id === "string" && Number.isFinite(Number(i.qty)))
      .map((i) => ({ product_id: i.product_id, qty: Math.max(1, Math.floor(Number(i.qty))) }));
  } catch {
    return [];
  }
}

function write(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
  // Let the header (and any other listener) update its count
  window.dispatchEvent(new CustomEvent("gala-basket-changed"));
  return items;
}

export function getBasket() {
  return read();
}

export function basketCount() {
  return read().reduce((sum, i) => sum + i.qty, 0);
}

export function addToBasket(productId, qty = 1) {
  const items = read();
  const found = items.find((i) => i.product_id === productId);
  if (found) found.qty = Math.min(999, found.qty + qty);
  else items.push({ product_id: productId, qty: Math.min(999, Math.max(1, qty)) });
  return write(items);
}

export function setQty(productId, qty) {
  const items = read();
  const found = items.find((i) => i.product_id === productId);
  if (!found) return items;
  const n = Math.floor(Number(qty));
  if (!Number.isFinite(n) || n < 1) return removeFromBasket(productId);
  found.qty = Math.min(999, n);
  return write(items);
}

export function removeFromBasket(productId) {
  return write(read().filter((i) => i.product_id !== productId));
}

export function clearBasket() {
  return write([]);
}
