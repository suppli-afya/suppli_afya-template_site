import { PRODUCTS_BY_ID } from "@/engine";
import type { Storefront } from "./types";

/**
 * Everything that can be wrong with a storefront's configuration, in plain words.
 * `npm test` runs this over every storefront, so a typo in a product id or a price
 * never reaches a customer.
 */
export function validateStorefront(sf: Storefront): string[] {
  const problems: string[] = [];
  const say = (m: string) => problems.push(`${sf.slug || "(no slug)"}: ${m}`);

  if (!/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(sf.slug)) say("slug must be lowercase letters, numbers and dashes");
  if (["api", "privacy", "_next"].includes(sf.slug)) say(`"${sf.slug}" is a reserved path`);

  const d = sf.distributor;
  if (!d.name.trim() || !d.firstName.trim()) say("distributor name and first name are required");
  if (!d.role.trim()) say("distributor role is required");
  for (const [field, value] of [
    ["whatsapp", d.whatsapp],
    ["phone", d.phone],
  ] as const) {
    if (value != null && !/^[1-9]\d{9,14}$/.test(value)) say(`${field} must be digits in international format, e.g. 254712345678`);
  }
  if (sf.status === "live") {
    if (!d.whatsapp) say("a live storefront needs a WhatsApp number");
    if (sf.pending.length) say(`a live storefront can't have pending placeholders (${sf.pending.join(", ")})`);
  }

  const offers = Object.entries(sf.catalogue.offers);
  if (!offers.length) say("the price list is empty");
  for (const [id, offer] of offers) {
    if (!PRODUCTS_BY_ID[id]) say(`"${id}" is not a product in the catalogue`);
    if (!Number.isInteger(offer.price) || offer.price < 50 || offer.price > 500_000) say(`${id}: price must be whole shillings`);
  }
  const seen = new Set<string>();
  for (const id of sf.catalogue.featured) {
    if (!sf.catalogue.offers[id]) say(`featured "${id}" is not on the price list`);
    if (seen.has(id)) say(`featured "${id}" is listed twice`);
    seen.add(id);
  }
  if (Number.isNaN(Date.parse(sf.catalogue.updated))) say("catalogue.updated must be a date (YYYY-MM-DD)");

  const areas = sf.fulfilment.delivery?.areas ?? [];
  if (!areas.length && !sf.fulfilment.pickup) say("offer delivery, pickup, or both");
  if (new Set(areas.map((a) => a.id)).size !== areas.length) say("delivery area ids must be unique");
  for (const a of areas) if (a.fee !== null && (!Number.isInteger(a.fee) || a.fee < 0)) say(`delivery fee for ${a.id} must be whole shillings or null`);

  if (!sf.payment.methods.length) say("list at least one payment method");
  if (sf.payment.mpesa && !/^\d{5,12}$/.test(sf.payment.mpesa.number)) say("M-Pesa till or paybill number must be digits");

  for (const [key, value] of Object.entries(sf.theme)) {
    if (!/^#[0-9a-f]{6}$/i.test(value)) say(`theme.${key} must be a 6-digit hex colour`);
  }
  if (problems.length === 0 && contrast(sf.theme.accent, sf.theme.onAccent) < 4.5) {
    say("theme.onAccent must be readable on theme.accent (contrast of at least 4.5:1)");
  }
  if (problems.length === 0 && contrast(sf.theme.accent, "#f5f3ee") < 4.5) {
    say("theme.accent must be readable as text on the page background (contrast of at least 4.5:1)");
  }
  return problems;
}

/** WCAG contrast ratio between two hex colours. */
export function contrast(a: string, b: string): number {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
