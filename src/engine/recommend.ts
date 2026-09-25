import { one, num, has } from "./answers";
import { pickHabits, redFlags, SIGNAL_REASON, summarise } from "./advice";
import { CATALOGUE } from "./catalogue";
import { pruneAnswers } from "./flow";
import { goalLabel } from "./goals";
import { deriveProfile } from "./profile";
import { checkPlan, checkProduct } from "./safety";
import type {
  Answers,
  EngineResult,
  Exclusion,
  GoalId,
  Product,
  Profile,
  Recommendation,
  SignalId,
} from "./types";

/** How much a goal's signals count, by the rank the person gave that goal. */
const RANK_WEIGHT = [1, 0.82, 0.68];
/** Signals that only come from lifestyle answers count for less. */
const LIFESTYLE_WEIGHT = 0.4;
/** Minimum match before a product can be the pick for a goal. */
const GOAL_THRESHOLD = 0.15;
/** Minimum overall match for an add-on. */
const ADDON_THRESHOLD = 0.25;

interface Scored {
  product: Product;
  score: number;
  contributions: { signal: SignalId; value: number }[];
  cautions: string[];
}

function signalWeight(p: Profile, s: SignalId) {
  const g = p.signalGoal[s];
  if (!g) return LIFESTYLE_WEIGHT;
  return RANK_WEIGHT[p.goals.indexOf(g)] ?? 0.5;
}

function scoreProduct(product: Product, p: Profile): Omit<Scored, "cautions"> {
  const contributions: Scored["contributions"] = [];
  for (const [s, affinity] of Object.entries(product.supports) as [SignalId, number][]) {
    const strength = p.signals[s] ?? 0;
    if (strength <= 0) continue;
    contributions.push({ signal: s, value: strength * affinity * signalWeight(p, s) });
  }
  contributions.sort((a, b) => b.value - a.value);
  let score = contributions.reduce((sum, c) => sum + c.value, 0);
  if (product.traits.premium && p.planSize !== "complete") score *= 0.75;
  // Prefer unsweetened options for people watching sugar.
  if (product.traits.mayContainSugar && watchingSugar(p)) score *= 0.8;
  return { product, score, contributions };
}

function goalScore(s: Scored, goal: GoalId, p: Profile) {
  return s.contributions.filter((c) => p.signalGoal[c.signal] === goal).reduce((sum, c) => sum + c.value, 0);
}

function audienceFits(product: Product, p: Profile) {
  const a = product.audience;
  if (!a) return true;
  if (a.sex && p.sex !== "undisclosed" && a.sex !== p.sex) return false;
  if (a.minAge && p.age !== null && p.age < a.minAge) return false;
  return true;
}

/** Signals that describe opposite situations; only the stronger one may explain a pick. */
const OPPOSITES: [SignalId, SignalId][] = [["joints_mild", "joints_longterm"]];

function reasonsFor(s: Scored): string[] {
  const out: string[] = [];
  const used: SignalId[] = [];
  const top = s.contributions[0]?.value ?? 0;
  for (const c of s.contributions.slice(0, 3)) {
    // A secondary reason has to matter, or it reads as filler.
    if (used.length > 0 && c.value < top * 0.35) break;
    if (OPPOSITES.some(([a, b]) => (c.signal === a && used.includes(b)) || (c.signal === b && used.includes(a)))) continue;
    const text = s.product.reasons?.[c.signal] ?? SIGNAL_REASON[c.signal];
    if (text && !out.includes(text)) {
      out.push(text);
      used.push(c.signal);
    }
    if (out.length === 2) break;
  }
  return out;
}

/** People working on sugar, weight or post-meal crashes. */
function watchingSugar(p: Profile) {
  return (
    p.conditions.includes("diabetes") ||
    p.goals.includes("blood_sugar") ||
    p.goals.includes("weight") ||
    (p.signals.energy_crash ?? 0) >= 0.5
  );
}

/** Short deterministic reference so a WhatsApp message can be matched to a check later. */
export function referenceFor(answers: Answers, salt = ""): string {
  const src = JSON.stringify(answers) + salt;
  let h = 2166136261;
  for (let i = 0; i < src.length; i++) {
    h ^= src.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  let n = h >>> 0;
  for (let i = 0; i < 4; i++) {
    code += alphabet[n % alphabet.length];
    n = Math.floor(n / alphabet.length);
  }
  return `SA-${code}`;
}

export function recommend(rawAnswers: Answers, opts: { salt?: string } = {}): EngineResult {
  const answers = pruneAnswers(rawAnswers);
  const profile = deriveProfile(answers);
  const plan = checkPlan(profile);

  const scored: Scored[] = [];
  const excludedAll: (Exclusion & { score: number })[] = [];
  for (const product of CATALOGUE) {
    if (!audienceFits(product, profile)) continue;
    const base = scoreProduct(product, profile);
    const verdict = checkProduct(product, profile);
    if (verdict.exclude) {
      excludedAll.push({ product, reason: verdict.exclude, score: base.score });
      continue;
    }
    scored.push({ ...base, cautions: verdict.cautions });
  }

  const core: Recommendation[] = [];
  const addons: Recommendation[] = [];
  const planNotes = [...plan.notes];
  const usedGroups = new Set<string>();
  const unmet: GoalId[] = [];

  const take = (s: Scored, role: Recommendation["role"], covers: GoalId[]) => {
    if (s.product.group) usedGroups.add(s.product.group);
    const rec: Recommendation = {
      product: s.product,
      score: Math.round(s.score * 100) / 100,
      role,
      covers,
      reasons: reasonsFor(s),
      cautions: s.cautions,
    };
    (role === "core" ? core : addons).push(rec);
  };
  const picked = (id: string) => core.some((r) => r.product.id === id) || addons.some((r) => r.product.id === id);

  if (plan.status !== "clinic-first") {
    // One headline product per goal, in the order the person ranked them.
    for (const goal of profile.goals) {
      const options = scored
        .filter((s) => s.product.goals.includes(goal))
        .map((s) => ({ s, g: goalScore(s, goal, profile) }))
        .filter((x) => x.g > GOAL_THRESHOLD)
        .sort((a, b) => b.g + 0.35 * (b.s.score - b.g) - (a.g + 0.35 * (a.s.score - a.g)));

      if (options.length === 0) {
        unmet.push(goal);
        continue;
      }
      const best = options[0];
      const existing = core.find((r) => r.product.id === best.s.product.id);
      if (existing) {
        existing.covers.push(goal);
        continue;
      }
      const choice = options.find((x) => !picked(x.s.product.id) && !(x.s.product.group && usedGroups.has(x.s.product.group)));
      if (!choice) {
        // Everything suitable is already in the plan through another goal.
        const covering = core.find((r) => options.some((o) => o.s.product.id === r.product.id));
        if (covering) covering.covers.push(goal);
        continue;
      }
      take(choice.s, "core", [goal]);
    }

    // A complete plan can carry one more strong match as a core product.
    if (profile.planSize === "complete") {
      const extra = scored
        .filter((s) => !picked(s.product.id) && !(s.product.group && usedGroups.has(s.product.group)) && s.score >= 0.45)
        .sort((a, b) => b.score - a.score)[0];
      if (extra) {
        const covers = profile.goals.filter((g) => goalScore(extra, g, profile) > GOAL_THRESHOLD);
        take(extra, "core", covers);
      }
    }

    // Trim to the size the person asked for, keeping the highest-ranked goals.
    const coreLimit = { one: 1, focused: 3, complete: 4 }[profile.planSize];
    const trimmed = core.splice(coreLimit);
    for (const r of trimmed) {
      if (r.product.group) usedGroups.delete(r.product.group);
    }

    // Add-ons: good matches that didn't make the core plan, including ones
    // driven by lifestyle (e.g. low vegetables, alcohol).
    const addonLimit = profile.planSize === "complete" ? 3 : 2;
    const addonPool = [
      ...trimmed.map((r) => scored.find((s) => s.product.id === r.product.id)!).filter(Boolean),
      ...scored,
    ];
    const seen = new Set<string>();
    for (const s of addonPool.sort((a, b) => b.score - a.score)) {
      if (addons.length >= addonLimit) break;
      if (seen.has(s.product.id)) continue;
      seen.add(s.product.id);
      if (picked(s.product.id)) continue;
      if (s.product.group && usedGroups.has(s.product.group)) continue;
      if (s.score < ADDON_THRESHOLD) continue;
      const covers = profile.goals.filter((g) => goalScore(s, g, profile) > GOAL_THRESHOLD);
      take(s, "addon", covers);
    }

    for (const goal of unmet) {
      planNotes.push(
        `We couldn't find a ${goalLabel(goal).toLowerCase()} product that suits your answers. Your distributor can talk you through other options.`,
      );
    }
  } else if (profile.sex !== "male") {
    planNotes.push(
      "If your clinic agrees, FemiCalcium D3 is BF Suma's calcium and vitamin D product for pregnancy and breastfeeding. It's worth asking about at your next visit.",
    );
  }

  // Only show exclusions that would otherwise have been relevant.
  const excluded = excludedAll
    .filter((e) => e.score >= 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ product, reason }) => ({ product, reason }));

  const seeDoctor = redFlags(profile, {
    loose: one(answers, "loose_freq"),
    reflux: one(answers, "reflux_freq"),
    energyLevel: num(answers, "energy_level"),
    sugarStatus: profile.goals.includes("blood_sugar") ? one(answers, "sugar_status") : null,
    heartBp: has(answers, "heart_concerns", "bp"),
    fatty: has(answers, "liver_reasons", "fatty"),
  });

  return {
    profile,
    status: plan.status,
    core,
    addons,
    excluded,
    habits: pickHabits(profile),
    seeDoctor,
    planNotes,
    heard: summarise(profile),
    ref: referenceFor(answers, opts.salt),
  };
}
