/**
 * Core types for the Suppli Afya health check engine.
 *
 * The engine is deliberately pure: no React, no network, no storage.
 * Answers go in, a recommendation result comes out. That keeps it testable
 * and lets the same logic run in the browser today and on a server later.
 */

export type Sex = "female" | "male" | "undisclosed";

export type AnswerValue = string | string[] | number;
export type Answers = Record<string, AnswerValue | undefined>;

export type SectionId = "intro" | "about" | "goals" | "life" | "safety";

export type QuestionKind =
  | "section" // interstitial screen, no answer
  | "text"
  | "number"
  | "single"
  | "multi"
  | "ranked" // ordered multi-select, first pick = most important
  | "scale"; // 1..5 single choice rendered as a scale

export interface EngineContext {
  distributorName: string;
  distributorFirstName: string;
}

type Dynamic<T> = T | ((answers: Answers, ctx: EngineContext) => T);

export interface QuestionOption {
  id: string;
  label: string;
  hint?: string;
  /** Selecting this clears every other option (e.g. "None of these"). */
  exclusive?: boolean;
  showIf?: (answers: Answers) => boolean;
}

export interface Question {
  id: string;
  kind: QuestionKind;
  section: SectionId;
  prompt: Dynamic<string>;
  helper?: Dynamic<string>;
  /** Short line shown under "Why we ask". Builds trust, keeps people going. */
  why?: string;
  options?: QuestionOption[];
  /** Max selections for multi / ranked. */
  max?: number;
  min?: number;
  /** Bounds for number inputs. */
  range?: { min: number; max: number };
  placeholder?: string;
  cta?: string;
  badge?: string;
  showIf?: (answers: Answers) => boolean;
  /** Follow-up questions belong to a goal and are asked in the order the person ranked their goals. */
  goal?: GoalId;
  /** Scale labels for 1..5 questions (low end, high end). */
  scaleLabels?: [string, string];
}

export type GoalId =
  | "energy"
  | "immunity"
  | "digestion"
  | "joints"
  | "heart"
  | "blood_sugar"
  | "weight"
  | "sleep_stress"
  | "focus"
  | "skin_ageing"
  | "liver"
  | "mens_health"
  | "womens_health";

export type SignalId =
  | "energy_low"
  | "energy_crash"
  | "energy_morning"
  | "immunity_frequent"
  | "slow_recovery"
  | "bloating"
  | "constipation"
  | "loose_stools"
  | "reflux"
  | "piles"
  | "joints_mild"
  | "joints_longterm"
  | "bones"
  | "cramps"
  | "bp"
  | "cholesterol"
  | "circulation"
  | "heart_family"
  | "blood_sugar"
  | "sugar_cravings"
  | "weight"
  | "portions"
  | "stress"
  | "sleep_poor"
  | "focus"
  | "memory"
  | "skin"
  | "ageing"
  | "prostate"
  | "male_vitality"
  | "performance"
  | "women_cycle"
  | "women_energy"
  | "intimate"
  | "menopause"
  | "liver"
  | "alcohol"
  | "smoker"
  | "low_veg"
  | "active";

export type PregnancyStatus = "trying" | "pregnant" | "breastfeeding" | "none";
export type PlanSize = "one" | "focused" | "complete";

export interface Profile {
  name: string;
  age: number | null;
  sex: Sex;
  pregnancy: PregnancyStatus;
  goals: GoalId[]; // ranked, most important first
  signals: Partial<Record<SignalId, number>>; // 0..1 intensity
  /** Which goal a signal came from (for weighting). Lifestyle signals have none. */
  signalGoal: Partial<Record<SignalId, GoalId>>;
  conditions: string[];
  medications: string[];
  restrictions: string[];
  planSize: PlanSize;
  experience: "current_bf" | "current_other" | "past" | "never" | null;
  lifestyle: {
    meals: string | null;
    veg: string | null;
    sugaryDrinks: string | null;
    water: string | null;
    activeDays: string | null;
    sleepHours: string | null;
    alcohol: string | null;
    smokes: boolean;
  };
}

export type ProductLine =
  | "Immune Booster"
  | "Heart & Blood Fit"
  | "Sport Fit"
  | "Suma Fit"
  | "Men's Power"
  | "Women's Beauty"
  | "Suma Living";

export type ProductFormat =
  | "capsules"
  | "tablets"
  | "coffee"
  | "tea"
  | "drink"
  | "wash"
  | "skincare";

/**
 * Traits drive the safety rules. When the catalogue is corrected, the rules
 * follow automatically, so traits must be kept accurate.
 */
export interface ProductTraits {
  caffeine?: boolean;
  /** Sachet blends that may contain sugar/creamer. Label must be checked. */
  mayContainSugar?: boolean;
  shellfish?: boolean;
  pork?: boolean;
  /** Ingredient source not confirmed; ask before recommending to people who avoid pork. */
  porkUnconfirmed?: boolean;
  soy?: boolean;
  stimulant?: boolean;
  lowersBloodSugar?: boolean;
  /** strong = leave out with blood thinners; mild = caution only. */
  clotting?: "strong" | "mild";
  mayLowerBp?: boolean;
  immuneActive?: boolean;
  sexualHealth?: boolean;
  topical?: boolean;
  premium?: boolean;
  /** Manufacturer says not for pregnancy / breastfeeding. */
  notInPregnancy?: boolean;
  /** Known to interact with antidepressants / sleeping pills (e.g. ginkgo). */
  moodMedInteraction?: boolean;
}

export interface Product {
  id: string;
  name: string;
  line: ProductLine;
  format: ProductFormat;
  /** One or two plain sentences: what it is. No disease claims. */
  summary: string;
  keyIngredients: string[];
  /** Goals this product can serve as a core pick for. */
  goals: GoalId[];
  /** How strongly the product matches each signal, 0..1. */
  supports: Partial<Record<SignalId, number>>;
  /** Product-specific explanation per signal. Falls back to generic text. */
  reasons?: Partial<Record<SignalId, string>>;
  /** Honest expectation-setting. */
  expectation: string;
  /** Extra always-on note, e.g. when to see a doctor. */
  note?: string;
  traits: ProductTraits;
  audience?: { sex?: Exclude<Sex, "undisclosed">; minAge?: number };
  /** Products in the same group do the same job. Never recommend two from one group. */
  group?: string;
  /** Rough days one pack lasts at the usual label dose. Used for reorder timing. Verify against pack. */
  supplyDays: number;
  /** True once checked line-by-line against the official BF Suma Kenya catalogue. */
  verified: boolean;
}

export interface Recommendation {
  product: Product;
  score: number;
  role: "core" | "addon";
  covers: GoalId[];
  reasons: string[];
  cautions: string[];
}

export interface Exclusion {
  product: Product;
  reason: string;
}

export interface Habit {
  id: string;
  title: string;
  detail: string;
}

export type PlanStatus = "ready" | "review" | "clinic-first";

export interface EngineResult {
  profile: Profile;
  status: PlanStatus;
  core: Recommendation[];
  addons: Recommendation[];
  excluded: Exclusion[];
  habits: Habit[];
  seeDoctor: string[];
  planNotes: string[];
  /** Plain-language summary of what we heard. */
  heard: string[];
  ref: string;
}

export interface DistributorBrief {
  title: string;
  subtitle: string;
  tags: string[];
  planLine: string;
  preference: string;
  flags: string[];
  opener: string;
  tips: string[];
  priority: "high" | "normal";
}
