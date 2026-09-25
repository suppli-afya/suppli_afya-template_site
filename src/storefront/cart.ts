import type { Product } from "@/engine";
import { findListing, isAvailable } from "./products";
import type { Storefront } from "./types";

/**
 * The customer's order in progress. Only ids and quantities are kept (in the browser); prices
 * always come from the storefront's current price list, so a stale cart can't carry old prices.
 */
export interface CartItem {
  id: string;
  qty: number;
  /** Added from the selector's suggestions, so the distributor can see where it came from. */
  from?: "selector";
}

export type CartAction =
  | { type: "add"; id: string; qty?: number; from?: CartItem["from"] }
  | { type: "set"; id: string; qty: number }
  | { type: "remove"; id: string }
  | { type: "clear" }
  | { type: "replace"; items: CartItem[] };

export const MAX_QTY = 20;

const clampQty = (n: number) => Math.max(1, Math.min(MAX_QTY, Math.round(n) || 1));

export function cartReducer(cart: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "add": {
      const existing = cart.find((i) => i.id === action.id);
      if (existing) {
        return cart.map((i) =>
          i.id === action.id ? { ...i, qty: clampQty(i.qty + (action.qty ?? 1)), from: i.from ?? action.from } : i,
        );
      }
      return [...cart, { id: action.id, qty: clampQty(action.qty ?? 1), ...(action.from ? { from: action.from } : {}) }];
    }
    case "set":
      if (action.qty <= 0) return cart.filter((i) => i.id !== action.id);
      return cart.map((i) => (i.id === action.id ? { ...i, qty: clampQty(action.qty) } : i));
    case "remove":
      return cart.filter((i) => i.id !== action.id);
    case "clear":
      return [];
    case "replace":
      return sanitiseCart(action.items);
  }
}

/** Whatever comes back from storage: keep only well-formed items, merged by id. */
export function sanitiseCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const out: CartItem[] = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const { id, qty, from } = x as Record<string, unknown>;
    if (typeof id !== "string" || typeof qty !== "number" || !Number.isFinite(qty)) continue;
    const item: CartItem = { id, qty: clampQty(qty), ...(from === "selector" ? { from: "selector" as const } : {}) };
    const same = out.find((i) => i.id === id);
    if (same) same.qty = clampQty(same.qty + item.qty);
    else out.push(item);
  }
  return out;
}

export interface PricedLine {
  id: string;
  product: Product;
  qty: number;
  unitPrice: number;
  total: number;
  from?: CartItem["from"];
}

export interface PricedCart {
  lines: PricedLine[];
  /** Number of packs. */
  count: number;
  subtotal: number;
  /** Items that are no longer on the price list or are out of stock. Shown, not charged. */
  unavailable: { id: string; name: string }[];
}

export function priceCart(sf: Storefront, cart: CartItem[]): PricedCart {
  const lines: PricedLine[] = [];
  const unavailable: PricedCart["unavailable"] = [];
  for (const item of cart) {
    const l = findListing(sf, item.id);
    if (!l) continue;
    if (!isAvailable(l)) {
      unavailable.push({ id: item.id, name: l.product.name });
      continue;
    }
    lines.push({
      id: item.id,
      product: l.product,
      qty: item.qty,
      unitPrice: l.offer.price,
      total: l.offer.price * item.qty,
      ...(item.from ? { from: item.from } : {}),
    });
  }
  return {
    lines,
    count: lines.reduce((s, l) => s + l.qty, 0),
    subtotal: lines.reduce((s, l) => s + l.total, 0),
    unavailable,
  };
}
