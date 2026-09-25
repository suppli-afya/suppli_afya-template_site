import { firstName, goalChosen, has, hasAny, one } from "./answers";
import { GOALS } from "./goals";
import type { Answers, Question } from "./types";

/**
 * The health check, in the order people see it.
 *
 * Structure follows the Vitable quiz (sections → basics → ranked goals →
 * goal-specific follow-ups → diet and lifestyle), adapted for Kenya and for
 * BF Suma's range. Two sections Vitable doesn't have matter a lot here:
 *   - a safety check (medicines, conditions, allergies, pork/halal), because
 *     herbal products interact with things like blood thinners and ARVs;
 *   - "how would you like to start", because a full BF Suma plan can cost a lot
 *     and the distributor needs to know the customer's appetite.
 *
 * Questions are shown when `showIf` passes. Multiple goals open multiple
 * follow-up groups; they don't create exclusive paths.
 */

const femaleOrUndisclosed = (a: Answers) => hasAny(a, "sex", ["female", "undisclosed"]);

export const QUESTIONS: Question[] = [
  // ------------------------------------------------------------------ intro
  {
    id: "welcome",
    kind: "section",
    section: "intro",
    prompt: "Let's find what actually suits you.",
    helper: (_a, ctx) =>
      `${ctx.distributorFirstName} uses this short health check to understand your goals, routine and health before recommending anything. At the end you'll get a plan that explains what could help and why.`,
    badge: "About 3 minutes",
    cta: "Start",
  },
  {
    id: "disclaimer",
    kind: "section",
    section: "intro",
    prompt: "Before we start",
    helper: (_a, ctx) =>
      `Your answers stay private. They're only shared with ${ctx.distributorFirstName} if you choose to send them at the end.\n\nThis check gives general wellness guidance. It isn't medical advice and it doesn't replace your doctor. If you're pregnant, taking medicine or managing a health condition, we'll point out anything you should confirm with a health professional first.`,
    cta: "I understand",
  },
  {
    id: "first_name",
    kind: "text",
    section: "intro",
    prompt: "What should we call you?",
    helper: "Your first name, or the name your friends use.",
    placeholder: "First name",
    range: { min: 1, max: 20 },
  },
  {
    id: "hello",
    kind: "section",
    section: "about",
    prompt: (a) => `Nice to meet you, ${firstName(a)}.`,
    helper: "A few basics first. They help us leave out anything that wouldn't suit you.",
    cta: "Continue",
  },

  // ------------------------------------------------------------------ about
  {
    id: "sex",
    kind: "single",
    section: "about",
    prompt: "What sex were you assigned at birth?",
    helper: "Some needs differ between bodies. We know this may not match how you identify.",
    options: [
      { id: "female", label: "Female" },
      { id: "male", label: "Male" },
      { id: "undisclosed", label: "Prefer not to say" },
    ],
  },
  {
    id: "age",
    kind: "number",
    section: "about",
    prompt: "How old are you?",
    helper: "Needs change with age, especially for bones, joints and energy.",
    placeholder: "Age",
    range: { min: 18, max: 100 },
  },
  {
    id: "pregnancy",
    kind: "single",
    section: "about",
    prompt: "Are any of these true for you right now?",
    why: "Many supplements haven't been tested in pregnancy, so we're extra careful here.",
    showIf: femaleOrUndisclosed,
    options: [
      { id: "trying", label: "Trying for a baby" },
      { id: "pregnant", label: "Pregnant" },
      { id: "breastfeeding", label: "Breastfeeding" },
      { id: "none", label: "None of these" },
    ],
  },
  {
    id: "experience",
    kind: "single",
    section: "about",
    prompt: "Do you take any supplements at the moment?",
    why: "So we don't double up on anything, and so we know how much to explain.",
    options: [
      { id: "current_bf", label: "Yes, including BF Suma products" },
      { id: "current_other", label: "Yes, other brands" },
      { id: "past", label: "Not now, but I have before" },
      { id: "never", label: "Never. This would be my first" },
    ],
  },

  // ------------------------------------------------------------------ goals
  {
    id: "goals_intro",
    kind: "section",
    section: "goals",
    prompt: "Your goals",
    helper: "Tell us what you'd most like to feel better about. We'll ask one or two short follow-ups for each.",
    cta: "Continue",
  },
  {
    id: "goals",
    kind: "ranked",
    section: "goals",
    prompt: "What would you most like to improve?",
    helper: "Choose up to three, starting with the most important.",
    max: 3,
    min: 1,
    options: GOALS.map((g) => ({
      id: g.id,
      label: g.label,
      hint: g.hint,
      showIf: g.sex
        ? (a: Answers) => one(a, "sex") === g.sex || one(a, "sex") === "undisclosed"
        : undefined,
    })),
  },

  // energy
  {
    id: "energy_level",
    kind: "scale",
    section: "goals",
    prompt: "How would you rate your energy on most days?",
    scaleLabels: ["Very low", "High"],
    goal: "energy",
    showIf: (a) => goalChosen(a, "energy"),
  },
  {
    id: "energy_dips",
    kind: "multi",
    section: "goals",
    prompt: "When does your energy tend to drop?",
    helper: "Choose all that apply.",
    goal: "energy",
    showIf: (a) => goalChosen(a, "energy"),
    options: [
      { id: "morning", label: "When I wake up" },
      { id: "afternoon", label: "Mid-afternoon" },
      { id: "after_meals", label: "After big meals" },
      { id: "all_day", label: "It's low most of the day" },
      { id: "none", label: "It doesn't really drop", exclusive: true },
    ],
  },

  // immunity
  {
    id: "sick_often",
    kind: "single",
    section: "goals",
    prompt: "How often do you get colds, flu or infections in a year?",
    goal: "immunity",
    showIf: (a) => goalChosen(a, "immunity"),
    options: [
      { id: "often", label: "More than four times" },
      { id: "sometimes", label: "Two or three times" },
      { id: "rarely", label: "Rarely" },
    ],
  },
  {
    id: "recovery",
    kind: "single",
    section: "goals",
    prompt: "When you do get sick, how long until you feel like yourself again?",
    goal: "immunity",
    showIf: (a) => goalChosen(a, "immunity"),
    options: [
      { id: "quick", label: "A few days" },
      { id: "week", label: "About a week" },
      { id: "slow", label: "More than a week" },
    ],
  },

  // digestion
  {
    id: "gut_issues",
    kind: "multi",
    section: "goals",
    prompt: "Which of these do you deal with?",
    helper: "Choose all that apply.",
    goal: "digestion",
    showIf: (a) => goalChosen(a, "digestion"),
    options: [
      { id: "bloating", label: "Bloating or gas" },
      { id: "constipation", label: "Constipation" },
      { id: "loose", label: "Loose stools or diarrhoea" },
      { id: "reflux", label: "Heartburn or acid reflux" },
      { id: "piles", label: "Piles (haemorrhoids)" },
      { id: "none", label: "None of these", exclusive: true },
    ],
  },
  {
    id: "constipation_freq",
    kind: "single",
    section: "goals",
    prompt: "How often are you constipated?",
    goal: "digestion",
    showIf: (a) => goalChosen(a, "digestion") && has(a, "gut_issues", "constipation"),
    options: [
      { id: "sometimes", label: "Once in a while" },
      { id: "weekly", label: "Most weeks" },
      { id: "daily", label: "Most days" },
    ],
  },
  {
    id: "loose_freq",
    kind: "single",
    section: "goals",
    prompt: "How often do you have loose stools?",
    goal: "digestion",
    showIf: (a) => goalChosen(a, "digestion") && has(a, "gut_issues", "loose"),
    options: [
      { id: "sometimes", label: "Once in a while" },
      { id: "weekly", label: "About once a week" },
      { id: "often", label: "More than once a week" },
    ],
  },
  {
    id: "reflux_freq",
    kind: "single",
    section: "goals",
    prompt: "How often do you get heartburn?",
    goal: "digestion",
    showIf: (a) => goalChosen(a, "digestion") && has(a, "gut_issues", "reflux"),
    options: [
      { id: "sometimes", label: "Once in a while" },
      { id: "weekly", label: "Once or twice a week" },
      { id: "often", label: "Most days" },
    ],
  },

  // joints & bones
  {
    id: "joint_issues",
    kind: "multi",
    section: "goals",
    prompt: "What's going on with your joints or bones?",
    helper: "Choose all that apply.",
    goal: "joints",
    showIf: (a) => goalChosen(a, "joints"),
    options: [
      { id: "pain", label: "Pain when I walk, climb stairs or kneel" },
      { id: "stiffness", label: "Stiffness in the morning" },
      { id: "arthritis", label: "A doctor has told me I have arthritis" },
      { id: "strain", label: "Aches after sport or the gym" },
      { id: "bones", label: "I'm more worried about my bones than my joints" },
    ],
  },
  {
    id: "joint_duration",
    kind: "single",
    section: "goals",
    prompt: "How long has this been going on?",
    goal: "joints",
    showIf: (a) => goalChosen(a, "joints") && hasAny(a, "joint_issues", ["pain", "stiffness", "arthritis", "strain"]),
    options: [
      { id: "recent", label: "Less than three months" },
      { id: "months", label: "Three months to a year" },
      { id: "years", label: "More than a year" },
    ],
  },
  {
    id: "bone_risk",
    kind: "single",
    section: "goals",
    prompt: "Has a doctor mentioned thin bones, or do weak bones run in your family?",
    goal: "joints",
    showIf: (a) => goalChosen(a, "joints"),
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
      { id: "unsure", label: "Not sure" },
    ],
  },

  // heart
  {
    id: "heart_concerns",
    kind: "multi",
    section: "goals",
    prompt: "Which of these apply to you?",
    helper: "Choose all that apply.",
    goal: "heart",
    showIf: (a) => goalChosen(a, "heart"),
    options: [
      { id: "bp", label: "High blood pressure" },
      { id: "cholesterol", label: "High cholesterol" },
      { id: "circulation", label: "Cold hands or feet, or numbness" },
      { id: "family", label: "Heart problems run in my family" },
      { id: "general", label: "Nothing specific. I want to look after my heart", exclusive: true },
    ],
  },

  // blood sugar
  {
    id: "sugar_status",
    kind: "single",
    section: "goals",
    prompt: "Which of these describes you best?",
    goal: "blood_sugar",
    showIf: (a) => goalChosen(a, "blood_sugar"),
    options: [
      { id: "diabetic", label: "I've been diagnosed with diabetes" },
      { id: "borderline", label: "I've been told my sugar is borderline" },
      { id: "family", label: "Diabetes runs in my family" },
      { id: "cravings", label: "I get strong sugar cravings or crash after meals" },
    ],
  },
  {
    id: "sugar_meds",
    kind: "single",
    section: "goals",
    prompt: "Are you on diabetes medicine or insulin?",
    why: "Some products can lower blood sugar. Alongside medicine, that needs your doctor's input.",
    goal: "blood_sugar",
    showIf: (a) => goalChosen(a, "blood_sugar") && has(a, "sugar_status", "diabetic"),
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
    ],
  },

  // weight
  {
    id: "weight_goal",
    kind: "single",
    section: "goals",
    prompt: "What would you like to happen with your weight?",
    goal: "weight",
    showIf: (a) => goalChosen(a, "weight"),
    options: [
      { id: "little", label: "Lose a little (under 5 kg)" },
      { id: "some", label: "Lose 5 to 15 kg" },
      { id: "lots", label: "Lose more than 15 kg" },
      { id: "tone", label: "Stay the same weight but feel fitter" },
    ],
  },
  {
    id: "weight_struggles",
    kind: "multi",
    section: "goals",
    prompt: "What makes it hard?",
    helper: "Choose all that apply.",
    goal: "weight",
    showIf: (a) => goalChosen(a, "weight"),
    options: [
      { id: "cravings", label: "Snacking and sugar cravings" },
      { id: "portions", label: "Big portions, always hungry" },
      { id: "digestion", label: "Slow digestion, feeling heavy" },
      { id: "time", label: "No time to exercise" },
      { id: "stress", label: "Eating when stressed or tired" },
    ],
  },

  // sleep & stress
  {
    id: "stress_level",
    kind: "scale",
    section: "goals",
    prompt: "How stressed have you felt over the last month?",
    scaleLabels: ["Hardly at all", "A lot"],
    goal: "sleep_stress",
    showIf: (a) => goalChosen(a, "sleep_stress"),
  },
  {
    id: "sleep_quality",
    kind: "multi",
    section: "goals",
    prompt: "How do you usually sleep?",
    helper: "Choose all that apply.",
    goal: "sleep_stress",
    showIf: (a) => goalChosen(a, "sleep_stress"),
    options: [
      { id: "falling", label: "I struggle to fall asleep" },
      { id: "waking", label: "I wake up during the night" },
      { id: "tired", label: "I wake up tired, even after enough hours" },
      { id: "fine", label: "I sleep well", exclusive: true },
    ],
  },

  // focus
  {
    id: "focus_issues",
    kind: "multi",
    section: "goals",
    prompt: "Which of these sound like you?",
    helper: "Choose all that apply.",
    goal: "focus",
    showIf: (a) => goalChosen(a, "focus"),
    options: [
      { id: "concentration", label: "I find it hard to concentrate" },
      { id: "memory", label: "I forget things more than I used to" },
      { id: "fog", label: "My head often feels foggy" },
      { id: "general", label: "I just want to stay sharp", exclusive: true },
    ],
  },

  // skin & ageing
  {
    id: "skin_concerns",
    kind: "multi",
    section: "goals",
    prompt: "What would you like to improve?",
    helper: "Choose all that apply.",
    goal: "skin_ageing",
    showIf: (a) => goalChosen(a, "skin_ageing"),
    options: [
      { id: "dull", label: "Dull or uneven skin" },
      { id: "dry", label: "Dry skin" },
      { id: "lines", label: "Fine lines and firmness" },
      { id: "breakouts", label: "Breakouts" },
      { id: "ageing", label: "Ageing well in general" },
    ],
  },

  // liver
  {
    id: "liver_reasons",
    kind: "multi",
    section: "goals",
    prompt: "What's behind your interest in liver health?",
    helper: "Choose all that apply.",
    goal: "liver",
    showIf: (a) => goalChosen(a, "liver"),
    options: [
      { id: "alcohol", label: "I drink alcohol regularly" },
      { id: "fatty", label: "A doctor mentioned fatty liver or high liver results" },
      { id: "meds", label: "I take a lot of medicine" },
      { id: "general", label: "General care", exclusive: true },
    ],
  },

  // men
  {
    id: "men_concerns",
    kind: "multi",
    section: "goals",
    prompt: "What would you like support with?",
    helper: "Choose all that apply. Your answers stay private.",
    goal: "mens_health",
    showIf: (a) => goalChosen(a, "mens_health"),
    options: [
      { id: "prostate", label: "Prostate or urination (night trips, weak flow)" },
      { id: "vitality", label: "Energy and drive" },
      { id: "performance", label: "Performance in the bedroom" },
    ],
  },

  // women
  {
    id: "women_concerns",
    kind: "multi",
    section: "goals",
    prompt: "What would you like support with?",
    helper: "Choose all that apply. Your answers stay private.",
    goal: "womens_health",
    showIf: (a) => goalChosen(a, "womens_health"),
    options: [
      { id: "cycle", label: "Painful or irregular periods" },
      { id: "intimate", label: "Intimate comfort, odour or irritation" },
      { id: "menopause", label: "Menopause symptoms" },
      { id: "energy", label: "Low energy" },
      { id: "bones", label: "Bone strength" },
    ],
  },

  // ------------------------------------------------------------------ daily life
  {
    id: "life_intro",
    kind: "section",
    section: "life",
    prompt: "Your daily life",
    helper:
      "Your routine often matters as much as any product. These answers also shape the practical tips at the end of your plan.",
    cta: "Continue",
  },
  {
    id: "meals",
    kind: "single",
    section: "life",
    prompt: "How would you describe your meals most days?",
    options: [
      { id: "home", label: "Mostly home-cooked" },
      { id: "out", label: "A lot of eating out or fast food" },
      { id: "irregular", label: "Irregular. I often skip meals" },
      { id: "plant", label: "Vegetarian or mostly plant-based" },
    ],
  },
  {
    id: "veg",
    kind: "single",
    section: "life",
    prompt: "How many servings of vegetables and fruit do you eat on a normal day?",
    helper: "A serving is roughly a handful: sukuma, cabbage, a banana, an orange.",
    options: [
      { id: "none", label: "Almost none" },
      { id: "few", label: "One or two" },
      { id: "plenty", label: "Three or more" },
    ],
  },
  {
    id: "sugary",
    kind: "single",
    section: "life",
    prompt: "How often do you have sugary drinks?",
    helper: "Soda, juice, energy drinks and chai with sugar all count.",
    options: [
      { id: "daily", label: "Every day" },
      { id: "weekly", label: "A few times a week" },
      { id: "rarely", label: "Rarely" },
    ],
  },
  {
    id: "water",
    kind: "single",
    section: "life",
    prompt: "How much water do you drink in a day?",
    options: [
      { id: "low", label: "Less than three glasses" },
      { id: "mid", label: "Three to six glasses" },
      { id: "high", label: "More than six glasses" },
    ],
  },
  {
    id: "active",
    kind: "single",
    section: "life",
    prompt: "On how many days a week are you active for at least 30 minutes?",
    helper: "A brisk walk counts.",
    options: [
      { id: "none", label: "None" },
      { id: "few", label: "One or two" },
      { id: "some", label: "Three or four" },
      { id: "most", label: "Five or more" },
    ],
  },
  {
    id: "sleep_hours",
    kind: "single",
    section: "life",
    prompt: "How many hours do you usually sleep?",
    options: [
      { id: "lt5", label: "Less than five" },
      { id: "5to6", label: "Five to six" },
      { id: "7to8", label: "Seven to eight" },
      { id: "gt8", label: "More than eight" },
    ],
  },
  {
    id: "alcohol",
    kind: "single",
    section: "life",
    prompt: "How many alcoholic drinks do you have in a typical week?",
    helper: "One drink is a beer, a glass of wine or a single tot.",
    why: "Alcohol affects your liver, your sleep and how well you absorb nutrients.",
    options: [
      { id: "none", label: "None" },
      { id: "light", label: "One to seven" },
      { id: "moderate", label: "Eight to fourteen" },
      { id: "heavy", label: "More than fourteen" },
    ],
  },
  {
    id: "smoke",
    kind: "single",
    section: "life",
    prompt: "Do you smoke, vape or use shisha?",
    why: "Smoking uses up antioxidants like vitamin C faster.",
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
    ],
  },

  // ------------------------------------------------------------------ safety
  {
    id: "safety_intro",
    kind: "section",
    section: "safety",
    prompt: "A quick safety check",
    helper:
      "These questions help us leave out anything that might not suit you. If something applies, we'll tell you what to confirm with a doctor or pharmacist.",
    cta: "Continue",
  },
  {
    id: "conditions",
    kind: "multi",
    section: "safety",
    prompt: "Have you been diagnosed with any of these?",
    helper: "Choose all that apply.",
    options: [
      { id: "diabetes", label: "Diabetes" },
      { id: "bp", label: "High blood pressure" },
      { id: "heart", label: "Heart disease" },
      { id: "kidney", label: "Kidney disease" },
      { id: "liver", label: "Liver disease" },
      { id: "ulcers", label: "Stomach ulcers" },
      { id: "bleeding", label: "A bleeding or clotting disorder" },
      { id: "cancer", label: "Cancer (current or recent treatment)" },
      { id: "autoimmune", label: "An autoimmune condition, like lupus" },
      { id: "thyroid", label: "A thyroid condition" },
      { id: "none", label: "None of these", exclusive: true },
    ],
  },
  {
    id: "medications",
    kind: "multi",
    section: "safety",
    prompt: "Do you take any of these regularly?",
    helper: "Choose all that apply.",
    why: "Some herbs change how medicines work. We'd rather be careful.",
    options: [
      { id: "thinners", label: "Blood thinners (warfarin, daily aspirin, clopidogrel)" },
      { id: "bp_meds", label: "Blood pressure medicine" },
      { id: "diabetes_meds", label: "Diabetes medicine or insulin" },
      { id: "arvs", label: "ARVs (HIV treatment)" },
      { id: "mood", label: "Antidepressants or sleeping pills" },
      { id: "hormones", label: "Hormonal contraception or HRT" },
      { id: "other", label: "Other prescription medicine" },
      { id: "none", label: "None of these", exclusive: true },
    ],
  },
  {
    id: "restrictions",
    kind: "multi",
    section: "safety",
    prompt: "Do any of these apply to you?",
    helper: "Choose all that apply.",
    options: [
      { id: "shellfish", label: "Allergic to shellfish or seafood" },
      { id: "soy", label: "Allergic to soy" },
      { id: "pork", label: "I avoid pork (for example, a halal diet)" },
      { id: "vegetarian", label: "Vegetarian or vegan" },
      { id: "caffeine", label: "Caffeine doesn't agree with me" },
      { id: "none", label: "None of these", exclusive: true },
    ],
  },
  {
    id: "plan_size",
    kind: "single",
    section: "safety",
    prompt: "Last one. How would you like to start?",
    helper: (_a, ctx) => `You can always add more later. ${ctx.distributorFirstName} will confirm prices with you.`,
    options: [
      { id: "one", label: "With the one product that matters most" },
      { id: "focused", label: "A focused plan of two or three products" },
      { id: "complete", label: "A complete plan, whatever will help" },
    ],
  },
];

export const SECTIONS: { id: Question["section"]; label: string }[] = [
  { id: "about", label: "About you" },
  { id: "goals", label: "Goals" },
  { id: "life", label: "Daily life" },
  { id: "safety", label: "Safety" },
];

export const QUESTIONS_BY_ID = Object.fromEntries(QUESTIONS.map((q) => [q.id, q])) as Record<string, Question>;
