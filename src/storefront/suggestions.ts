import type { EngineResult, Recommendation } from "@/engine";
import { findListing, isAvailable, type Listing } from "./products";
import type { Storefront } from "./types";

/**
 * The selector's result, priced from this distributor's list. The engine decides what fits;
 * this only answers "can I buy it here, and for how much?". A suggested product that isn't
 * on the price list stays in the result, with "ask the distributor" instead of a price.
 */
export interface Suggestion {
  rec: Recommendation;
  listing: Listing | null;
  /** On the price list and in stock: can go straight into the order. */
  orderable: boolean;
}

export interface PricedSuggestions {
  core: Suggestion[];
  addons: Suggestion[];
  /** Price of every orderable core product, one pack each. */
  coreTotal: number;
  orderableCore: Suggestion[];
}

export function priceSuggestions(sf: Storefront, result: EngineResult): PricedSuggestions {
  const wrap = (rec: Recommendation): Suggestion => {
    const listing = findListing(sf, rec.product.id);
    return { rec, listing, orderable: isAvailable(listing) };
  };
  const core = result.core.map(wrap);
  const addons = result.addons.map(wrap);
  const orderableCore = core.filter((s) => s.orderable);
  return {
    core,
    addons,
    orderableCore,
    coreTotal: orderableCore.reduce((sum, s) => sum + s.listing!.offer.price, 0),
  };
}
