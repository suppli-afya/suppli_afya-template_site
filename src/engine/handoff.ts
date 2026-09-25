import { GOALS_BY_ID, goalLabel } from "./goals";
import type { DistributorBrief, EngineContext, EngineResult, GoalId, Profile } from "./types";

const PLAN_SIZE_LABEL = {
  one: "one product to start",
  focused: "a focused plan (2–3 products)",
  complete: "a complete plan",
} as const;

const MED_LABEL: Record<string, string> = {
  thinners: "blood thinners",
  bp_meds: "blood pressure medicine",
  diabetes_meds: "diabetes medicine",
  arvs: "ARVs",
  mood: "antidepressants or sleeping pills",
  hormones: "hormonal contraception or HRT",
  other: "other prescription medicine",
};

const COND_LABEL: Record<string, string> = {
  diabetes: "diabetes",
  bp: "high blood pressure",
  heart: "heart disease",
  kidney: "kidney disease",
  liver: "liver disease",
  ulcers: "stomach ulcers",
  bleeding: "a bleeding disorder",
  cancer: "cancer treatment",
  autoimmune: "an autoimmune condition",
  thyroid: "a thyroid condition",
};

const RESTRICTION_LABEL: Record<string, string> = {
  shellfish: "shellfish allergy",
  soy: "soy allergy",
  pork: "avoids pork",
  vegetarian: "vegetarian",
  caffeine: "no caffeine",
};

/** Things the distributor must know before recommending anything. */
export function safetyFlags(r: EngineResult): string[] {
  return profileFlags(r.profile);
}

export function profileFlags(p: Profile): string[] {
  const flags: string[] = [];
  if (p.pregnancy === "pregnant") flags.push("Pregnant");
  if (p.pregnancy === "breastfeeding") flags.push("Breastfeeding");
  if (p.pregnancy === "trying") flags.push("Trying to conceive");
  for (const m of p.medications) if (MED_LABEL[m]) flags.push(`Takes ${MED_LABEL[m]}`);
  for (const c of p.conditions) if (COND_LABEL[c]) flags.push(`Has ${COND_LABEL[c]}`);
  for (const x of p.restrictions) if (RESTRICTION_LABEL[x]) flags.push(cap(RESTRICTION_LABEL[x]));
  return flags;
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** The message that opens in WhatsApp, written in the customer's voice. */
export function whatsappMessage(r: EngineResult, ctx: EngineContext): string {
  const p = r.profile;
  const lines: string[] = [];
  lines.push(`Hi ${ctx.distributorFirstName}, I've just done the health check.`);
  lines.push("");
  const about = [p.name || "Me", p.age ? String(p.age) : null].filter(Boolean).join(", ");
  lines.push(`*About me:* ${about}`);
  if (p.goals.length) lines.push(`*My goals:* ${p.goals.map((g, i) => `${i + 1}. ${GOALS_BY_ID[g].short}`).join("  ")}`);

  if (r.status === "clinic-first") {
    lines.push(`*Note:* I'm ${p.pregnancy === "trying" ? "trying for a baby" : p.pregnancy}, so the check suggested I speak to my clinic first.`);
  } else if (r.core.length) {
    lines.push(`*Suggested plan:* ${r.core.map((c) => c.product.name).join(", ")}`);
    if (r.addons.length) lines.push(`*Maybe later:* ${r.addons.map((c) => c.product.name).join(", ")}`);
    lines.push(`*I'd like to start with:* ${PLAN_SIZE_LABEL[p.planSize]}`);
  }

  const flags = safetyFlags(r).filter((f) => !/^Pregnant|^Breastfeeding|^Trying/.test(f));
  if (flags.length) lines.push(`*Please note:* ${flags.join("; ")}`);

  lines.push("");
  lines.push(
    r.status === "clinic-first"
      ? "Could you tell me what's safe for me once my clinic agrees?"
      : "Could you tell me the prices and how to get started?",
  );
  lines.push(`Ref: ${r.ref}`);
  return lines.join("\n");
}

export function whatsappLink(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

const OPENERS: Record<GoalId, string> = {
  energy: "you mentioned your energy has been low. That's one of the most common things I help people with",
  immunity: "you mentioned you've been getting sick more often than you'd like",
  digestion: "you mentioned some digestion trouble. That's very common and usually very fixable",
  joints: "you mentioned your joints have been bothering you",
  heart: "you want to look after your heart, which is a good thing to start early",
  blood_sugar: "you want to keep your blood sugar in check",
  weight: "you're working on your weight",
  sleep_stress: "you've been stressed and not sleeping as well as you'd like",
  focus: "you'd like help with focus and memory",
  skin_ageing: "you'd like to look after your skin",
  liver: "you want to look after your liver",
  mens_health: "you had a couple of questions about men's health",
  womens_health: "you had a couple of questions about women's health",
};

/** What lands in the distributor's portal: a lead card with a suggested first message. */
export function distributorBrief(r: EngineResult): DistributorBrief {
  const p = r.profile;
  const flags = safetyFlags(r);
  const first = p.goals[0];
  const name = p.name || "New lead";

  const tips: string[] = [];
  if (p.experience === "never") tips.push("First time taking supplements. Explain how and when to take each product.");
  if (p.experience === "current_bf") tips.push("Already uses BF Suma products. Ask what they take now so nothing doubles up.");
  if (p.planSize === "one") tips.push("Wants to start small. Lead with the first product and mention the rest later.");
  if (p.planSize === "complete") tips.push("Open to a complete plan.");
  if (r.status === "review") tips.push("Plan needs a doctor or pharmacist's OK before starting. Encourage that, then follow up.");
  if (r.status === "clinic-first") tips.push("Clinic first. Don't recommend products until their clinic has agreed.");
  if (r.seeDoctor.length) tips.push(`Also told to see a doctor about: ${r.seeDoctor.length} thing${r.seeDoctor.length > 1 ? "s" : ""}. Worth checking in on.`);

  const planLine =
    r.status === "clinic-first"
      ? "No product plan: clinic first"
      : r.core.length
        ? r.core.map((c) => c.product.name).join(" · ")
        : "No suitable products found";

  return {
    title: [name, p.age].filter(Boolean).join(", "),
    subtitle: p.goals.map((g) => goalLabel(g)).join(" · "),
    tags: p.goals.map((g) => GOALS_BY_ID[g].short),
    planLine,
    preference: {
      one: "Start with one product",
      focused: "Focused plan (2–3)",
      complete: "Complete plan",
    }[p.planSize],
    flags,
    opener: first
      ? `Hi ${p.name || "there"}, thanks for doing the health check. I saw ${OPENERS[first]}. Can I ask you a couple of quick questions before we decide what to start with?`
      : `Hi ${p.name || "there"}, thanks for doing the health check. Can I ask you a couple of quick questions?`,
    tips,
    priority: p.planSize === "complete" || (r.status === "ready" && r.core.length >= 2) ? "high" : "normal",
  };
}
