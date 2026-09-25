/**
 * A storefront is one distributor's page: who they are, what they sell at what price,
 * how they deliver and get paid. Everything distributor-specific lives in one of these
 * objects (see src/storefronts/); components never hard-code a distributor.
 *
 * Product facts (names, ingredients, safety traits) come from the engine's catalogue,
 * which is shared by every distributor. A storefront only adds its own prices and packs.
 */

/**
 * `preview`: the page is shown with a small "Preview" ribbon, and nothing is sent to a real
 * WhatsApp number (messages are shown on screen instead). `live`: everything is real.
 */
export type StorefrontStatus = "preview" | "live";

export interface DistributorProfile {
  /** Full name, as customers know them. */
  name: string;
  firstName: string;
  /** What they do, in a few words. Shown under their name. */
  role: string;
  /** A real photo of the distributor. Without one, their initials are used. */
  photo?: { src: string; alt: string } | null;
  /** One or two sentences in their own words. */
  intro?: string | null;
  /** Where they are based, e.g. "Nairobi". */
  area?: string | null;
  /** Languages they're happy to chat in. */
  languages?: string[];
  /** When they usually answer messages, in their own words. */
  hours?: string | null;
  /** International format without "+", e.g. 254712345678. null: messages are shown, never sent. */
  whatsapp: string | null;
  /** For a "Call" button. Same format as `whatsapp`. */
  phone?: string | null;
}

export interface Offer {
  /** This distributor's price for one pack, in whole Kenyan shillings. */
  price: number;
  /** What's in one pack, from the label, e.g. "60 capsules". Leave out until checked. */
  pack?: string | null;
  /** false: on the price list but out of stock right now. */
  inStock?: boolean;
}

export interface DeliveryArea {
  id: string;
  label: string;
  /** Delivery fee in KES. null: the distributor confirms it with the customer. */
  fee: number | null;
  /** Usual delivery time in plain words, e.g. "Same or next day". */
  time?: string | null;
}

export type PaymentMethod = "mpesa" | "cash";

export interface Theme {
  /** Buttons, selection, highlights. Must carry white text (4.5:1). */
  accent: string;
  /** Hover and pressed states of the accent. */
  accentStrong: string;
  /** Tinted backgrounds. */
  accentSoft: string;
  /** Text on the accent. */
  onAccent: string;
}

export interface Storefront {
  /** URL name: the storefront is served at /<slug>. */
  slug: string;
  status: StorefrontStatus;
  /**
   * What is still a placeholder, in plain words ("Prices", "WhatsApp number"). Listed in the
   * preview ribbon so nobody mistakes a template value for a fact. Empty once everything is confirmed.
   */
  pending: string[];
  distributor: DistributorProfile;
  theme: Theme;
  catalogue: {
    currency: "KES";
    /** When the price list was last checked (ISO date). Shown to customers. */
    updated: string;
    /** Product ids shown first, in this order. */
    featured: string[];
    /** Engine product id → this distributor's offer. Products not listed aren't sold here. */
    offers: Record<string, Offer>;
  };
  fulfilment: {
    delivery: { areas: DeliveryArea[]; note?: string | null } | null;
    pickup: { label: string; detail?: string | null } | null;
  };
  payment: {
    methods: PaymentMethod[];
    /** Shown after an order is sent. null: the distributor sends payment details when confirming. */
    mpesa?: { kind: "till" | "paybill"; number: string; account?: string | null; name?: string | null } | null;
  };
  /**
   * The distributor's slug in the Suppli Afya app (their /d/<slug> link). When set, selector
   * results that the customer sends also land in the distributor's portal as a prospect.
   */
  suppliSlug?: string | null;
}
