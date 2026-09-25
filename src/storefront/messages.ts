import { whatsappLink, type Product } from "@/engine";
import { kes } from "./money";
import type { Storefront } from "./types";

/**
 * Messages the customer sends to the distributor, pre-written so nobody starts from zero.
 * The selector's own handoff message comes from the engine (engine/handoff.ts); these cover
 * the rest of the page.
 */

export function askMessage(sf: Storefront, product?: Product | null): string {
  const first = sf.distributor.firstName;
  if (!product) return `Hi ${first}, I found your page and I have a question.`;
  const offer = sf.catalogue.offers[product.id];
  return `Hi ${first}, I have a question about ${product.name}${offer ? ` (${kes(offer.price)})` : ""}.`;
}

/** A wa.me link, or null when the storefront has no number yet (preview pages never message a real person). */
export function whatsappHref(sf: Storefront, message: string): string | null {
  if (sf.status !== "live" || !sf.distributor.whatsapp) return null;
  return whatsappLink(sf.distributor.whatsapp, message);
}

export function telHref(sf: Storefront): string | null {
  if (sf.status !== "live" || !sf.distributor.phone) return null;
  return `tel:+${sf.distributor.phone.replace(/\D/g, "")}`;
}
