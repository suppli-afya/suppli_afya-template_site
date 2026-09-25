import { CATALOGUE, GOALS_BY_ID, PRODUCTS_BY_ID, type GoalId, type Product } from "@/engine";
import type { GoalMeta } from "@/engine/goals";
import type { Offer, Storefront } from "./types";

/**
 * How products are presented on a storefront. Every fact here comes from the engine's
 * catalogue (name, summary, ingredients, traits, supply) or the distributor's offer (price,
 * pack). Nothing is added: no claims, no dose instructions the label doesn't give.
 */

export interface Listing {
  product: Product;
  offer: Offer;
}

export const FORMAT_LABEL: Record<Product["format"], string> = {
  capsules: "Capsules",
  tablets: "Tablets",
  coffee: "Coffee sachets",
  tea: "Tea",
  drink: "Drink sachets",
  wash: "Feminine wash",
  skincare: "Skincare",
};

/** Everything the distributor sells: their featured products first, then the catalogue's order. */
export function listings(sf: Storefront): Listing[] {
  const sold = CATALOGUE.filter((p) => sf.catalogue.offers[p.id]);
  const rank = (id: string) => {
    const i = sf.catalogue.featured.indexOf(id);
    return i < 0 ? Infinity : i;
  };
  return sold
    .map((product, order) => ({ product, offer: sf.catalogue.offers[product.id], order }))
    .sort((a, b) => rank(a.product.id) - rank(b.product.id) || a.order - b.order)
    .map(({ product, offer }) => ({ product, offer }));
}

export function findListing(sf: Storefront, id: string): Listing | null {
  const product = PRODUCTS_BY_ID[id];
  const offer = sf.catalogue.offers[id];
  return product && offer ? { product, offer } : null;
}

/** On the price list and in stock. */
export function isAvailable(l: Listing | null): boolean {
  return Boolean(l && l.offer.inStock !== false);
}

/** The name as it would sit on a pack: "ArthroXtra Tablets" → "ArthroXtra". */
export function shortName(p: Product): string {
  return p.name.replace(/\s+(Capsules|Tablets|Solution|Feminine Cleanser|Skincare)$/i, "");
}

/** First sentence of the catalogue summary, for cards. */
export function oneLiner(p: Product): string {
  const m = p.summary.match(/^.*?[.!?](?=\s|$)/);
  return (m ? m[0] : p.summary).trim();
}

/** How long one pack lasts at the usual label dose, in plain words. */
export function supplyLabel(days: number): string {
  if (days <= 17) return "About two weeks per pack";
  if (days <= 24) return "About three weeks per pack";
  if (days <= 35) return "About a month per pack";
  if (days <= 50) return "About six weeks per pack";
  return "About two months per pack";
}

export function goalsOf(p: Product): GoalMeta[] {
  return p.goals.map((g) => GOALS_BY_ID[g]).filter(Boolean);
}

export function servesGoal(p: Product, goal: GoalId): boolean {
  return p.goals.includes(goal);
}

/** Case- and accent-insensitive search over name, ingredients, format, range and goals. */
export function matchesQuery(p: Product, query: string): boolean {
  const words = normalise(query).split(" ").filter(Boolean);
  if (!words.length) return true;
  const haystack = normalise(
    [p.name, p.line, FORMAT_LABEL[p.format], p.keyIngredients.join(" "), goalsOf(p).map((g) => `${g.label} ${g.hint}`).join(" ")].join(" "),
  );
  return words.every((w) => haystack.includes(w));
}

function normalise(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * "Check before you buy": the product's safety traits in plain words. These mirror the rules
 * the selector applies to a person's own answers (engine/safety.ts); here, with no answers,
 * we simply say what each trait means. Same careful wording, no new claims.
 */
export function checkNotes(p: Product, distributorFirstName: string): string[] {
  const t = p.traits;
  const out: string[] = [];
  if (t.shellfish) out.push("Contains ingredients made from shellfish, so it isn't suitable if you're allergic to shellfish, or vegetarian.");
  if (t.pork) out.push("Contains an ingredient from pork, so it isn't suitable if you avoid pork, or are vegetarian.");
  if (t.porkUnconfirmed) out.push(`Where one ingredient comes from hasn't been confirmed yet. If you avoid pork, ask ${distributorFirstName} first.`);
  if (t.soy) out.push("Made from soy, so it isn't suitable if you're allergic to soy.");
  if (t.caffeine) out.push("Contains caffeine.");
  if (t.mayContainSugar) out.push("Sachets like this usually include sugar and creamer. Check the label if you're watching your sugar.");
  if (t.stimulant) out.push("Contains a mild stimulant, which isn't advised with high blood pressure or heart problems.");
  if (t.clotting === "strong") out.push("Can affect blood clotting, so it isn't advised with blood thinners or a bleeding disorder.");
  if (t.clotting === "mild") out.push("May thin the blood slightly. If you take blood thinners, check with your doctor first.");
  if (t.lowersBloodSugar) out.push("Can lower blood sugar. If you take diabetes medicine, talk to your doctor before starting.");
  if (t.mayLowerBp) out.push("May add to the effect of blood pressure medicine. If you take it, keep an eye on your readings.");
  if (t.moodMedInteraction) out.push("Can interact with some antidepressants and sleeping pills. If you take them, check with your pharmacist first.");
  if (t.immuneActive) out.push("Acts on the immune system. With an autoimmune condition or during cancer treatment, check with your doctor first.");
  if (t.sexualHealth) out.push("Not advised with heart disease unless your doctor agrees. With high blood pressure, check with your doctor first.");
  if (t.topical) out.push("For external use.");
  return out;
}

/** Said on every product: the situations where the selector would send someone to a professional first. */
export const ALWAYS_CHECK =
  "Pregnant, breastfeeding, taking regular medicine or managing a health condition? Check with a doctor or pharmacist before starting any supplement.";
