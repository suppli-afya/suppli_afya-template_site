import type { Storefront } from "@/storefront/types";
import { kate } from "./kate";

/**
 * Every storefront this deploy serves, at /<slug>. Add a distributor by adding their config
 * here; `npm test` validates each one against the engine's catalogue.
 *
 * This is the single place storefronts are loaded from. When distributors manage their page
 * from the Suppli Afya portal, replace the array with a fetch here and nothing else changes.
 */
export const STOREFRONTS: Storefront[] = [kate];

export function storefrontBySlug(slug: string): Storefront | null {
  return STOREFRONTS.find((s) => s.slug === slug) ?? null;
}

/** The storefront shown at "/". */
export function defaultStorefront(): Storefront {
  const slug = process.env.NEXT_PUBLIC_DEFAULT_STOREFRONT;
  return (slug && storefrontBySlug(slug)) || STOREFRONTS[0];
}
