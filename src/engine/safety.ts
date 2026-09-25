import type { PlanStatus, Product, Profile } from "./types";

/**
 * Safety rules.
 *
 * These are conservative on purpose. The health check is a sales entry point,
 * but the fastest way to lose a customer (and a distributor's reputation) is
 * a recommendation that hurts someone. When in doubt we leave a product out
 * or tell the person to check with a doctor, and we say why in plain words.
 *
 * Rules read product traits, not product ids, so fixing the catalogue fixes
 * the rules. This is not a substitute for clinical review; see docs/ENGINE.md.
 */

export interface SafetyVerdict {
  exclude?: string;
  cautions: string[];
}

const hasMed = (p: Profile, m: string) => p.medications.includes(m);
const hasCond = (p: Profile, c: string) => p.conditions.includes(c);
const restricts = (p: Profile, r: string) => p.restrictions.includes(r);

export function checkProduct(product: Product, p: Profile): SafetyVerdict {
  const t = product.traits;
  const cautions: string[] = [];
  const out = (reason: string): SafetyVerdict => ({ exclude: reason, cautions: [] });

  // Allergies and dietary rules
  if (t.shellfish && restricts(p, "shellfish"))
    return out("It contains ingredients made from shellfish, and you told us you're allergic.");
  if (t.pork && restricts(p, "pork")) return out("One of its ingredients comes from pork, which you avoid.");
  if ((t.pork || t.shellfish) && restricts(p, "vegetarian"))
    return out("It contains animal-derived ingredients, and you're vegetarian or vegan.");
  if (t.soy && restricts(p, "soy")) return out("It's made from soy, and you told us you're allergic.");
  if (t.caffeine && restricts(p, "caffeine")) return out("It's made with coffee, and caffeine doesn't agree with you.");

  // Blood clotting
  const onThinners = hasMed(p, "thinners") || hasCond(p, "bleeding");
  if (t.clotting === "strong" && onThinners)
    return out(
      hasMed(p, "thinners")
        ? "It can affect blood clotting, which matters with the blood thinners you take."
        : "It can affect blood clotting, which matters with a bleeding or clotting disorder.",
    );

  // Stimulants and the heart
  const heartOrBp = hasCond(p, "bp") || hasCond(p, "heart") || hasMed(p, "bp_meds");
  if (t.stimulant && heartOrBp)
    return out("It contains a mild stimulant, which isn't advised with high blood pressure or heart problems.");
  if (t.sexualHealth && hasCond(p, "heart"))
    return out("Performance products aren't advised with heart disease unless your doctor has agreed.");

  // Cautions: still recommended, but with a clear note
  if (t.clotting === "mild" && onThinners)
    cautions.push("Reishi may thin the blood slightly. Check with your doctor first because of your blood thinners.");
  if (t.moodMedInteraction && hasMed(p, "mood"))
    cautions.push("Ginkgo can interact with some antidepressants and sleeping pills. Check with your pharmacist first.");
  if (t.lowersBloodSugar && hasMed(p, "diabetes_meds"))
    cautions.push(
      "This can lower blood sugar, adding to your diabetes medicine. Tell your doctor before starting and check your sugar more often in the first weeks.",
    );
  if (t.sexualHealth && (hasCond(p, "bp") || hasMed(p, "bp_meds")))
    cautions.push("Check with your doctor first because of your blood pressure.");
  if (t.mayLowerBp && hasMed(p, "bp_meds"))
    cautions.push("It may add to the effect of your blood pressure medicine. Keep an eye on your readings.");
  if (t.immuneActive && hasCond(p, "autoimmune"))
    cautions.push("Mushroom extracts act on the immune system. With an autoimmune condition, check with your doctor first.");
  if (t.immuneActive && hasCond(p, "cancer"))
    cautions.push("If you're having cancer treatment, your oncologist should approve this first.");
  if (t.caffeine && hasCond(p, "ulcers")) cautions.push("Coffee can irritate stomach ulcers. Have it with food, or skip it.");
  if (t.caffeine && (p.signals.sleep_poor ?? 0) >= 0.5)
    cautions.push("It contains caffeine. Have it before midday so it doesn't get in the way of your sleep.");
  const watchingSugar =
    hasCond(p, "diabetes") ||
    p.goals.includes("blood_sugar") ||
    p.goals.includes("weight") ||
    (p.signals.energy_crash ?? 0) >= 0.5;
  if (t.mayContainSugar && watchingSugar)
    cautions.push("4 in 1 sachets usually include sugar and creamer. Check the label, or ask about a sugar-free option.");
  if (t.porkUnconfirmed && restricts(p, "pork"))
    cautions.push("Ask your distributor to confirm where the chondroitin comes from, since you avoid pork.");

  return { cautions };
}

export interface PlanSafety {
  status: PlanStatus;
  notes: string[];
}

/** Plan-level checks: situations where the whole plan needs a professional's input. */
export function checkPlan(p: Profile): PlanSafety {
  if (p.pregnancy !== "none") {
    const what =
      p.pregnancy === "pregnant" ? "pregnant" : p.pregnancy === "breastfeeding" ? "breastfeeding" : "trying for a baby";
    return {
      status: "clinic-first",
      notes: [
        `Because you're ${what}, we haven't put together a product plan. Most supplements haven't been tested in pregnancy, and what's right for you should be agreed with your clinic.`,
      ],
    };
  }

  const notes: string[] = [];
  if (hasCond(p, "kidney"))
    notes.push("Because of your kidney condition, check every product with your doctor first. Some herbs are cleared by the kidneys.");
  if (hasCond(p, "liver")) notes.push("Because of your liver condition, check every product with your doctor first.");
  if (hasCond(p, "cancer"))
    notes.push("If you're having cancer treatment, please don't add anything without your oncologist's approval.");
  if (hasMed(p, "arvs"))
    notes.push("Some herbal products can change how ARVs work. Show this plan to your clinic before you start anything.");

  const otherMeds = p.medications.filter((m) => m !== "arvs");
  if (otherMeds.length > 0 && notes.length === 0)
    notes.push("You take regular medicine, so show this plan to your pharmacist or doctor before you start.");

  return { status: notes.length > 0 ? "review" : "ready", notes };
}
