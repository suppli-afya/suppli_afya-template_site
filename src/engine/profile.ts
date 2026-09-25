import { firstName, has, list, num, one } from "./answers";
import { GOALS_BY_ID } from "./goals";
import type { Answers, GoalId, PlanSize, PregnancyStatus, Profile, Sex, SignalId } from "./types";

/**
 * Turns raw answers into a profile of weighted signals.
 *
 * A signal is a need expressed as 0..1 (e.g. `constipation: 0.8`). Signals
 * that come from a goal the person chose remember that goal, so the scorer can
 * weight them by how highly the goal was ranked. Signals that come only from
 * lifestyle answers (low veg, alcohol) have no goal and count for less: they
 * shape add-ons and habits rather than the headline plan.
 */
export function deriveProfile(a: Answers): Profile {
  const signals: Partial<Record<SignalId, number>> = {};
  const signalGoal: Partial<Record<SignalId, GoalId>> = {};

  const goals = list(a, "goals").filter((g): g is GoalId => g in GOALS_BY_ID);
  const rank = (g: GoalId) => goals.indexOf(g);

  const add = (s: SignalId, value: number, goal?: GoalId) => {
    const v = Math.max(0, Math.min(1, value));
    if ((signals[s] ?? 0) < v) signals[s] = v;
    if (goal) {
      const existing = signalGoal[s];
      if (existing === undefined || rank(goal) < rank(existing)) signalGoal[s] = goal;
    }
  };

  const age = num(a, "age");
  const sex = (one(a, "sex") as Sex) ?? "undisclosed";

  // ---- energy
  if (goals.includes("energy")) {
    const level = num(a, "energy_level") ?? 3;
    const byLevel: Record<number, number> = { 1: 1, 2: 0.85, 3: 0.6, 4: 0.35, 5: 0.2 };
    add("energy_low", byLevel[level] ?? 0.6, "energy");
    if (has(a, "energy_dips", "morning")) add("energy_morning", 0.75, "energy");
    if (has(a, "energy_dips", "afternoon")) add("energy_low", (signals.energy_low ?? 0) + 0.1, "energy");
    if (has(a, "energy_dips", "after_meals")) {
      add("energy_crash", 0.85, "energy");
      add("blood_sugar", 0.35, "energy");
    }
    if (has(a, "energy_dips", "all_day")) add("energy_low", 0.95, "energy");
  }

  // ---- immunity
  if (goals.includes("immunity")) {
    const freq = { often: 1, sometimes: 0.65, rarely: 0.3 }[one(a, "sick_often") ?? ""] ?? 0.5;
    add("immunity_frequent", freq, "immunity");
    const rec = { slow: 0.9, week: 0.6, quick: 0.25 }[one(a, "recovery") ?? ""] ?? 0.4;
    add("slow_recovery", rec, "immunity");
  }

  // ---- digestion
  if (goals.includes("digestion")) {
    if (has(a, "gut_issues", "bloating")) add("bloating", 0.8, "digestion");
    if (has(a, "gut_issues", "constipation")) {
      add("constipation", { sometimes: 0.5, weekly: 0.8, daily: 1 }[one(a, "constipation_freq") ?? ""] ?? 0.7, "digestion");
    }
    if (has(a, "gut_issues", "loose")) {
      add("loose_stools", { sometimes: 0.5, weekly: 0.8, often: 1 }[one(a, "loose_freq") ?? ""] ?? 0.7, "digestion");
    }
    if (has(a, "gut_issues", "reflux")) {
      add("reflux", { sometimes: 0.4, weekly: 0.7, often: 1 }[one(a, "reflux_freq") ?? ""] ?? 0.6, "digestion");
    }
    if (has(a, "gut_issues", "piles")) add("piles", 0.9, "digestion");
    if (has(a, "gut_issues", "none")) add("bloating", 0.35, "digestion");
  }

  // ---- joints & bones
  if (goals.includes("joints")) {
    const jointTrouble = ["pain", "stiffness", "arthritis", "strain"].some((x) => has(a, "joint_issues", x));
    if (jointTrouble) {
      const dur = one(a, "joint_duration");
      const mild = { recent: 0.9, months: 0.6, years: 0.3 }[dur ?? ""] ?? 0.6;
      const longterm = { recent: 0.2, months: 0.6, years: 0.95 }[dur ?? ""] ?? 0.5;
      add("joints_mild", mild, "joints");
      add("joints_longterm", longterm, "joints");
      if (has(a, "joint_issues", "arthritis")) add("joints_longterm", 0.95, "joints");
      if (has(a, "joint_issues", "strain")) {
        add("joints_mild", 0.8, "joints");
        add("active", 0.5, "joints");
      }
      if (age !== null && age >= 55) add("joints_longterm", (signals.joints_longterm ?? 0) + 0.2, "joints");
    }
    if (has(a, "joint_issues", "bones")) add("bones", 0.9, "joints");
    const risk = one(a, "bone_risk");
    if (risk === "yes") add("bones", 0.9, "joints");
    if (risk === "unsure") add("bones", 0.45, "joints");
    if (sex === "female" && age !== null && age >= 45) add("bones", 0.6, "joints");
    if (age !== null && age >= 60) add("bones", 0.6, "joints");
  }

  // ---- heart
  if (goals.includes("heart")) {
    if (has(a, "heart_concerns", "bp")) add("bp", 0.9, "heart");
    if (has(a, "heart_concerns", "cholesterol")) add("cholesterol", 0.9, "heart");
    if (has(a, "heart_concerns", "circulation")) add("circulation", 0.9, "heart");
    if (has(a, "heart_concerns", "family")) add("heart_family", 0.8, "heart");
    if (has(a, "heart_concerns", "general")) {
      add("circulation", 0.45, "heart");
      add("heart_family", 0.45, "heart");
    }
  }

  // ---- blood sugar
  if (goals.includes("blood_sugar")) {
    const status = one(a, "sugar_status");
    const level = { diabetic: 1, borderline: 0.9, family: 0.55, cravings: 0.45 }[status ?? ""] ?? 0.5;
    add("blood_sugar", level, "blood_sugar");
    if (status === "cravings") add("sugar_cravings", 0.9, "blood_sugar");
  }

  // ---- weight
  if (goals.includes("weight")) {
    const w = { little: 0.5, some: 0.8, lots: 1, tone: 0.35 }[one(a, "weight_goal") ?? ""] ?? 0.6;
    add("weight", w, "weight");
    if (has(a, "weight_struggles", "cravings")) add("sugar_cravings", 0.8, "weight");
    if (has(a, "weight_struggles", "portions")) add("portions", 0.9, "weight");
    if (has(a, "weight_struggles", "digestion")) {
      add("bloating", 0.5, "weight");
      add("constipation", 0.45, "weight");
    }
    if (has(a, "weight_struggles", "stress")) add("stress", 0.5, "weight");
  }

  // ---- sleep & stress
  if (goals.includes("sleep_stress")) {
    const lvl = num(a, "stress_level") ?? 3;
    add("stress", ({ 1: 0.15, 2: 0.35, 3: 0.6, 4: 0.8, 5: 1 } as Record<number, number>)[lvl] ?? 0.6, "sleep_stress");
    const troubles = ["falling", "waking", "tired"].filter((x) => has(a, "sleep_quality", x)).length;
    if (troubles > 0) add("sleep_poor", 0.55 + 0.2 * troubles, "sleep_stress");
  }

  // ---- focus
  if (goals.includes("focus")) {
    if (has(a, "focus_issues", "concentration")) add("focus", 0.9, "focus");
    if (has(a, "focus_issues", "memory")) add("memory", 0.9, "focus");
    if (has(a, "focus_issues", "fog")) {
      add("focus", 0.7, "focus");
      add("memory", 0.45, "focus");
    }
    if (has(a, "focus_issues", "general")) {
      add("focus", 0.45, "focus");
      add("memory", 0.45, "focus");
    }
  }

  // ---- skin & ageing
  if (goals.includes("skin_ageing")) {
    if (has(a, "skin_concerns", "dull")) add("skin", 0.8, "skin_ageing");
    if (has(a, "skin_concerns", "dry")) add("skin", 0.7, "skin_ageing");
    if (has(a, "skin_concerns", "breakouts")) add("skin", 0.6, "skin_ageing");
    if (has(a, "skin_concerns", "lines")) {
      add("ageing", 0.8, "skin_ageing");
      add("skin", 0.5, "skin_ageing");
    }
    if (has(a, "skin_concerns", "ageing")) add("ageing", 0.8, "skin_ageing");
    if (age !== null && age >= 40) add("ageing", 0.5, "skin_ageing");
  }

  // ---- liver
  if (goals.includes("liver")) {
    if (has(a, "liver_reasons", "alcohol")) {
      add("liver", 0.8, "liver");
      add("alcohol", 0.8, "liver");
    }
    if (has(a, "liver_reasons", "fatty")) add("liver", 1, "liver");
    if (has(a, "liver_reasons", "meds")) add("liver", 0.6, "liver");
    if (has(a, "liver_reasons", "general")) add("liver", 0.5, "liver");
  }

  // ---- men
  if (goals.includes("mens_health")) {
    if (has(a, "men_concerns", "prostate")) add("prostate", 0.95, "mens_health");
    if (has(a, "men_concerns", "vitality")) add("male_vitality", 0.9, "mens_health");
    if (has(a, "men_concerns", "performance")) add("performance", 0.95, "mens_health");
  }

  // ---- women
  if (goals.includes("womens_health")) {
    if (has(a, "women_concerns", "cycle")) add("women_cycle", 0.9, "womens_health");
    if (has(a, "women_concerns", "intimate")) add("intimate", 0.95, "womens_health");
    if (has(a, "women_concerns", "menopause")) add("menopause", 0.9, "womens_health");
    if (has(a, "women_concerns", "energy")) add("women_energy", 0.8, "womens_health");
    if (has(a, "women_concerns", "bones")) add("bones", 0.8, "womens_health");
  }

  // ---- lifestyle (no goal attached)
  const veg = one(a, "veg");
  if (veg === "none") add("low_veg", 1);
  if (veg === "few") add("low_veg", 0.6);
  if (one(a, "sugary") === "daily") add("sugar_cravings", 0.5);
  const activeDays = one(a, "active");
  if (activeDays === "some" || activeDays === "most") add("active", 0.6);
  const alcohol = one(a, "alcohol");
  if (alcohol === "moderate") {
    add("alcohol", 0.6);
    add("liver", 0.5);
  }
  if (alcohol === "heavy") {
    add("alcohol", 0.9);
    add("liver", 0.8);
  }
  const smokes = one(a, "smoke") === "yes";
  if (smokes) add("smoker", 0.9);
  const sleepHours = one(a, "sleep_hours");
  if (sleepHours === "lt5") add("sleep_poor", 0.6);
  if (sleepHours === "5to6") add("sleep_poor", 0.4);

  // ---- safety answers, merged with anything said earlier
  const conditions = list(a, "conditions").filter((x) => x !== "none");
  const medications = list(a, "medications").filter((x) => x !== "none");
  if (one(a, "sugar_status") === "diabetic" && !conditions.includes("diabetes")) conditions.push("diabetes");
  if (one(a, "sugar_meds") === "yes" && !medications.includes("diabetes_meds")) medications.push("diabetes_meds");
  const restrictions = list(a, "restrictions").filter((x) => x !== "none");

  const pregnancy = (one(a, "pregnancy") as PregnancyStatus) ?? "none";

  return {
    name: firstName(a),
    age,
    sex,
    pregnancy: sex === "male" ? "none" : pregnancy,
    goals,
    signals,
    signalGoal,
    conditions,
    medications,
    restrictions,
    planSize: ((one(a, "plan_size") as PlanSize) ?? "focused") as PlanSize,
    experience: (one(a, "experience") as Profile["experience"]) ?? null,
    lifestyle: {
      meals: one(a, "meals"),
      veg,
      sugaryDrinks: one(a, "sugary"),
      water: one(a, "water"),
      activeDays,
      sleepHours,
      alcohol,
      smokes,
    },
  };
}
