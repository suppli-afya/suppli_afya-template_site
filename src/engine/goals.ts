import type { GoalId, Sex } from "./types";

export interface GoalMeta {
  id: GoalId;
  label: string;
  hint: string;
  /** Short form for WhatsApp messages and lead cards. */
  short: string;
  sex?: Exclude<Sex, "undisclosed">;
}

export const GOALS: GoalMeta[] = [
  { id: "energy", label: "Energy", hint: "Less tired, fewer slumps", short: "Energy" },
  { id: "immunity", label: "Immunity", hint: "Fewer colds, quicker recovery", short: "Immunity" },
  { id: "digestion", label: "Digestion", hint: "Bloating, regularity, comfort", short: "Digestion" },
  { id: "joints", label: "Joints & bones", hint: "Pain, stiffness, strength", short: "Joints" },
  { id: "heart", label: "Heart & circulation", hint: "Blood pressure, cholesterol", short: "Heart" },
  { id: "blood_sugar", label: "Blood sugar", hint: "Cravings, crashes, diabetes risk", short: "Blood sugar" },
  { id: "weight", label: "Weight", hint: "Lose some, or keep it steady", short: "Weight" },
  { id: "sleep_stress", label: "Sleep & stress", hint: "Switching off, resting well", short: "Sleep & stress" },
  { id: "focus", label: "Focus & memory", hint: "Concentration, staying sharp", short: "Focus" },
  { id: "skin_ageing", label: "Skin & healthy ageing", hint: "Glow, firmness, ageing well", short: "Skin & ageing" },
  { id: "liver", label: "Liver health", hint: "Alcohol, medicine, general care", short: "Liver" },
  { id: "mens_health", label: "Men's health", hint: "Prostate, drive, performance", short: "Men's health", sex: "male" },
  { id: "womens_health", label: "Women's health", hint: "Cycle, intimate care, menopause", short: "Women's health", sex: "female" },
];

export const GOALS_BY_ID = Object.fromEntries(GOALS.map((g) => [g.id, g])) as Record<GoalId, GoalMeta>;

export function goalLabel(id: GoalId) {
  return GOALS_BY_ID[id]?.label ?? id;
}
