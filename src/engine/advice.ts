import { goalLabel } from "./goals";
import type { Habit, Profile, SignalId } from "./types";

/** Fallback "because you said…" lines, used when a product has no specific reason. */
export const SIGNAL_REASON: Record<SignalId, string> = {
  energy_low: "You said your energy is low most days.",
  energy_crash: "You said your energy drops after big meals.",
  energy_morning: "You said you struggle to get going in the morning.",
  immunity_frequent: "You get sick more often than you'd like.",
  slow_recovery: "It takes you a while to recover when you're sick.",
  bloating: "You mentioned bloating.",
  constipation: "You mentioned constipation.",
  loose_stools: "You mentioned loose stools.",
  reflux: "You mentioned heartburn.",
  piles: "You mentioned piles.",
  joints_mild: "Your joint discomfort is fairly recent.",
  joints_longterm: "You've had joint problems for a while.",
  bones: "You want to look after your bones.",
  cramps: "You get cramps after being active.",
  bp: "You're keeping an eye on your blood pressure.",
  cholesterol: "You're watching your cholesterol.",
  circulation: "You mentioned cold hands or feet, or numbness.",
  heart_family: "Heart problems run in your family.",
  blood_sugar: "You want to keep your blood sugar in a healthy range.",
  sugar_cravings: "You mentioned sugar cravings.",
  weight: "You'd like to lose some weight.",
  portions: "You said portions and hunger make it hard.",
  stress: "You've been under a lot of stress.",
  sleep_poor: "You're not sleeping as well as you'd like.",
  focus: "You find it hard to concentrate.",
  memory: "You'd like help with your memory.",
  skin: "You'd like healthier-looking skin.",
  ageing: "Ageing well is one of your goals.",
  prostate: "You mentioned prostate or urination problems.",
  male_vitality: "You'd like more energy and drive.",
  performance: "You asked about performance.",
  women_cycle: "You mentioned painful or irregular periods.",
  women_energy: "You mentioned low energy.",
  intimate: "You asked about intimate comfort.",
  menopause: "You mentioned menopause symptoms.",
  liver: "You want to look after your liver.",
  alcohol: "You drink alcohol most weeks.",
  smoker: "You smoke, which uses up antioxidants faster.",
  low_veg: "You don't eat many vegetables most days.",
  active: "You're active most weeks.",
};

/** Things that should be checked by a doctor, whatever else happens. */
export function redFlags(p: Profile, answers: { loose?: string | null; reflux?: string | null; energyLevel?: number | null; sugarStatus?: string | null; heartBp?: boolean; fatty?: boolean }): string[] {
  const out: string[] = [];
  const s = p.signals;
  if (answers.loose === "often")
    out.push("Loose stools more than once a week should be checked by a doctor, especially if it's been going on for a while.");
  if (answers.reflux === "often") out.push("Heartburn on most days is worth mentioning to a doctor.");
  if ((s.piles ?? 0) > 0) out.push("If you ever notice bleeding, see a doctor. It's usually piles, but it should be checked.");
  if ((s.prostate ?? 0) > 0 && p.age !== null && p.age >= 45)
    out.push("Men over 45 with urinary symptoms should ask their doctor about a PSA test. It's a simple blood test.");
  if (answers.sugarStatus && answers.sugarStatus !== "diabetic" && !p.conditions.includes("diabetes"))
    out.push("A quick blood sugar test at a pharmacy or clinic will tell you where you stand.");
  if (answers.heartBp && !p.conditions.includes("bp") && !p.medications.includes("bp_meds"))
    out.push("Get your blood pressure checked. Most pharmacies can do it in a few minutes.");
  if (answers.fatty) out.push("Keep up with any follow-up tests your doctor asked for.");
  if (answers.energyLevel === 1)
    out.push("Constant tiredness can have simple causes like low iron or a thyroid problem. A basic blood test can rule these out.");
  if ((s.intimate ?? 0) > 0)
    out.push("If itching, unusual discharge or odour lasts more than a few days, visit a clinic. It may need treatment.");
  return out;
}

/** Practical, product-free habits. Picked by relevance, max four. */
export function pickHabits(p: Profile): Habit[] {
  const l = p.lifestyle;
  const g = p.goals;
  const candidates: (Habit & { weight: number })[] = [];
  const push = (weight: number, h: Habit) => candidates.push({ ...h, weight });

  if (l.sugaryDrinks === "daily")
    push(g.includes("blood_sugar") || g.includes("weight") || g.includes("energy") ? 10 : 6, {
      id: "sugar",
      title: "Halve the sugar in your chai",
      detail: "Cut it by half for two weeks. Most people stop noticing, and it's one of the easiest ways to steady your energy and blood sugar.",
    });
  if (l.veg === "none" || l.veg === "few")
    push(g.includes("digestion") || g.includes("weight") ? 9 : 6, {
      id: "veg",
      title: "Add one more serving of greens",
      detail: "Sukuma, managu, terere, cabbage: whatever is fresh at the kibanda. One extra handful a day helps digestion and fills gaps no supplement can.",
    });
  if (l.water === "low")
    push(g.includes("energy") || g.includes("digestion") ? 8 : 5, {
      id: "water",
      title: "Drink more water before anything else",
      detail: "Keep a one-litre bottle nearby and finish it twice a day. Mild dehydration feels a lot like tiredness.",
    });
  if (l.activeDays === "none" || l.activeDays === "few")
    push(g.includes("blood_sugar") || g.includes("weight") || g.includes("heart") ? 9 : 5, {
      id: "walk",
      title: "Walk for 20 minutes after supper",
      detail: "It helps digestion, blood sugar and sleep, and it's easier to keep up than a gym plan.",
    });
  if (l.sleepHours === "lt5" || l.sleepHours === "5to6" || (p.signals.sleep_poor ?? 0) >= 0.6)
    push(g.includes("sleep_stress") || g.includes("energy") ? 9 : 5, {
      id: "sleep",
      title: "Protect your sleep",
      detail: "Go to bed at the same time every night and put the phone away half an hour before. Everything else works better on a rested body.",
    });
  if (l.alcohol === "moderate" || l.alcohol === "heavy")
    push(g.includes("liver") ? 10 : 7, {
      id: "alcohol",
      title: "Take two alcohol-free days a week",
      detail: "Your liver and your sleep will both notice, usually within a couple of weeks.",
    });
  if (l.smokes)
    push(6, {
      id: "smoke",
      title: "Think about cutting down",
      detail: "Smoking works against almost every goal on this list. If you'd like to quit, your nearest health centre can help.",
    });
  if (l.meals === "irregular")
    push(g.includes("energy") || g.includes("blood_sugar") ? 8 : 5, {
      id: "breakfast",
      title: "Don't skip breakfast",
      detail: "Even something small, like eggs or a cup of uji, keeps your energy steadier through the morning.",
    });
  if (l.meals === "out")
    push(4, {
      id: "home",
      title: "Make one meal a day at home",
      detail: "You control the oil, salt and sugar, which matters more than any single product.",
    });
  if ((p.signals.stress ?? 0) >= 0.7)
    push(g.includes("sleep_stress") ? 9 : 4, {
      id: "quiet",
      title: "Give yourself ten quiet minutes",
      detail: "A short walk, prayer or slow breathing at the same time each day helps more than most people expect.",
    });

  return candidates
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4)
    .map((h) => ({ id: h.id, title: h.title, detail: h.detail }));
}

/** Plain summary of what the person told us, for the top of their plan. */
export function summarise(p: Profile): string[] {
  const out: string[] = [];
  if (p.goals.length > 0) {
    const [first, ...rest] = p.goals.map(goalLabel);
    out.push(
      rest.length === 0
        ? `Your main goal is ${first.toLowerCase()}.`
        : `Your main goal is ${first.toLowerCase()}, followed by ${rest.map((r) => r.toLowerCase()).join(" and ")}.`,
    );
  }
  const l = p.lifestyle;
  const bits: string[] = [];
  if (l.sleepHours === "lt5" || l.sleepHours === "5to6") bits.push("you're sleeping less than you need");
  if (l.sugaryDrinks === "daily") bits.push("you have sugary drinks most days");
  if (l.veg === "none") bits.push("vegetables are rare in your meals");
  if (l.activeDays === "none") bits.push("you're not getting much movement");
  if (l.water === "low") bits.push("you drink little water");
  if (bits.length > 0) out.push(`You also told us ${joinList(bits.slice(0, 3))}.`);
  return out;
}

export function joinList(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
