import type { Product } from "./types";

/**
 * BF Suma product catalogue used by the health check.
 *
 * SOURCE AND STATUS
 * Names, product lines and key ingredients were compiled in September 2026
 * from BF Suma's public shop listings and Kenyan retailer pages. None of it has
 * yet been checked line by line against the official BF Suma Kenya catalogue,
 * so every entry is `verified: false`. Before launch, confirm for each product:
 *   - exact name and pack size
 *   - full ingredient list (especially shellfish, pork, soy, sugar, caffeine)
 *   - label dose, which sets `supplyDays` for reorder reminders
 *   - any manufacturer warnings (pregnancy, medicines)
 *
 * WRITING RULES (see docs/ENGINE.md)
 *   - Say what a product is and what people use it for. Never say it treats,
 *     cures or prevents a disease. Many reseller listings do; we don't.
 *   - Expectations are honest: weeks, not days.
 *   - Traits must be accurate. The safety rules read them.
 */
export const CATALOGUE: Product[] = [
  // ---------------------------------------------------------------- Immune
  {
    id: "refined-yunzhi",
    name: "Refined Yunzhi Essence",
    line: "Immune Booster",
    format: "capsules",
    summary:
      "Capsules of Yunzhi mushroom extract, also known as turkey tail. Yunzhi has a long history of use in Chinese medicine for supporting the immune system.",
    keyIngredients: ["Yunzhi (Coriolus versicolor) extract"],
    goals: ["immunity"],
    supports: { immunity_frequent: 0.9, slow_recovery: 0.75, smoker: 0.3, ageing: 0.25 },
    reasons: {
      immunity_frequent:
        "Yunzhi is one of the most studied mushrooms for immune support, which fits how often you've been getting sick.",
      slow_recovery: "It's commonly used by people who take a long time to bounce back after being unwell.",
    },
    expectation: "Immune support builds slowly. Judge it over two to three months of daily use, not days.",
    traits: { immuneActive: true },
    group: "immune-mushroom",
    supplyDays: 30,
    verified: false,
  },
  {
    id: "ganoderma-spores",
    name: "Pure & Broken Ganoderma Spores",
    line: "Immune Booster",
    format: "capsules",
    summary:
      "Spores of the reishi mushroom (Ganoderma), with the hard outer shell broken so the body can use what's inside. One of BF Suma's core immune products.",
    keyIngredients: ["Broken-wall Ganoderma lucidum spores"],
    goals: ["immunity"],
    supports: { immunity_frequent: 0.85, slow_recovery: 0.85, stress: 0.3, sleep_poor: 0.2, ageing: 0.35 },
    reasons: {
      slow_recovery:
        "Reishi is traditionally used for recovery and resilience, which matches how long it takes you to feel yourself again.",
      immunity_frequent: "Reishi spores are a common choice for people who want to get sick less often.",
    },
    expectation: "Give it eight to twelve weeks. Reishi is a steady, long-term support rather than a quick fix.",
    traits: { immuneActive: true, clotting: "mild" },
    group: "immune-mushroom",
    supplyDays: 30,
    verified: false,
  },
  {
    id: "quad-reishi",
    name: "Quad Reishi Capsules",
    line: "Immune Booster",
    format: "capsules",
    summary: "A blend of four mushroom extracts: Yunzhi, Ganoderma (reishi), Chaga and Antrodia.",
    keyIngredients: ["Yunzhi", "Ganoderma", "Chaga", "Antrodia"],
    goals: ["immunity", "liver"],
    supports: { immunity_frequent: 0.75, slow_recovery: 0.6, liver: 0.55, alcohol: 0.35, ageing: 0.4, smoker: 0.3 },
    reasons: {
      liver: "Antrodia and reishi are both traditionally used to support the liver, alongside general immune support.",
      immunity_frequent: "Four immune mushrooms in one capsule, which suits a broad immune goal.",
    },
    expectation: "A long-term support. Most people take it for at least two to three months.",
    traits: { immuneActive: true, clotting: "mild" },
    group: "immune-mushroom",
    supplyDays: 30,
    verified: false,
  },

  // ---------------------------------------------------------------- Coffees
  {
    id: "cordyceps-coffee",
    name: "4 in 1 Cordyceps Coffee",
    line: "Immune Booster",
    format: "coffee",
    summary:
      "Instant coffee made with cordyceps extract. An easy swap for the coffee you already drink, for people who want steadier energy and stamina.",
    keyIngredients: ["Cordyceps extract", "Coffee"],
    goals: ["energy"],
    supports: { energy_low: 0.75, energy_morning: 0.7, active: 0.45, immunity_frequent: 0.25 },
    reasons: {
      energy_morning: "It replaces your morning cup, so it fits into a routine you already have.",
      energy_low: "Cordyceps is traditionally used for energy and stamina, and it comes in a form that's easy to keep up.",
      active: "Cordyceps is popular with active people for stamina.",
    },
    expectation: "You'll feel the coffee straight away. Any benefit from the cordyceps builds over a few weeks.",
    traits: { caffeine: true, mayContainSugar: true },
    group: "coffee",
    supplyDays: 20,
    verified: false,
  },
  {
    id: "reishi-coffee",
    name: "Reishi Coffee",
    line: "Immune Booster",
    format: "coffee",
    summary: "Coffee made with reishi (Ganoderma) extract and Colombian coffee beans.",
    keyIngredients: ["Reishi extract", "Colombian coffee"],
    goals: ["energy"],
    supports: { energy_low: 0.6, energy_morning: 0.6, stress: 0.3, immunity_frequent: 0.3 },
    reasons: {
      energy_morning: "It replaces your morning cup, with reishi added.",
    },
    expectation: "The coffee works straight away. Reishi is a slow, long-term support.",
    traits: { caffeine: true, mayContainSugar: true },
    group: "coffee",
    supplyDays: 20,
    verified: false,
  },
  {
    id: "nmn-coffee",
    name: "NMN Coffee",
    line: "Immune Booster",
    format: "coffee",
    summary:
      "Instant coffee with added NMN, a compound the body uses to make NAD+, which falls as we age. There's a sugar-free café latte version.",
    keyIngredients: ["NMN (nicotinamide mononucleotide)", "Coffee"],
    goals: ["energy", "skin_ageing"],
    supports: { energy_low: 0.6, energy_morning: 0.6, ageing: 0.5 },
    reasons: {
      ageing: "NMN is linked to energy and healthy ageing, and this is the easiest way to take it daily.",
    },
    expectation: "Research on NMN in people is still early. Treat it as a gentle, long-term support.",
    traits: { caffeine: true },
    group: "coffee",
    supplyDays: 15,
    verified: false,
  },

  // ---------------------------------------------------------------- Heart & blood
  {
    id: "micro2-cycle",
    name: "MicrO2 Cycle Tablets",
    line: "Heart & Blood Fit",
    format: "tablets",
    summary:
      "A traditional Chinese herbal formula of salvia root (danshen), notoginseng and borneol, used to support circulation and the heart.",
    keyIngredients: ["Salvia miltiorrhiza (danshen)", "Panax notoginseng", "Borneol"],
    goals: ["heart"],
    supports: { circulation: 0.95, heart_family: 0.6, cholesterol: 0.5, bp: 0.35 },
    reasons: {
      circulation:
        "Danshen and notoginseng are the classic herbs for circulation, which fits the cold hands, feet or numbness you mentioned.",
      heart_family: "It's a common choice for people who want to look after their heart because of family history.",
      cholesterol: "It's often used alongside diet changes by people watching their cholesterol.",
    },
    expectation:
      "It supports circulation over weeks. It does not replace blood pressure or heart medicine, and you shouldn't stop any medicine to take it.",
    note: "The manufacturer advises against taking it with aspirin, or during pregnancy or breastfeeding.",
    traits: { clotting: "strong", notInPregnancy: true },
    supplyDays: 30,
    verified: false,
  },
  {
    id: "relivin-tea",
    name: "Relivin Tea",
    line: "Heart & Blood Fit",
    format: "tea",
    summary:
      "A herbal tea blend made to help you unwind, often used as part of a routine for healthy blood pressure.",
    keyIngredients: ["Luobuma (dogbane) leaf and herbal blend — confirm against label"],
    goals: ["heart", "sleep_stress"],
    supports: { stress: 0.7, bp: 0.6, sleep_poor: 0.3 },
    reasons: {
      stress: "A cup in the evening is a simple wind-down ritual, which fits how stressed you've been.",
      bp: "It's commonly used as part of a routine for healthy blood pressure, alongside less salt and more movement.",
    },
    expectation: "Most people use it daily as part of a routine. It won't replace blood pressure medicine.",
    traits: { mayLowerBp: true },
    supplyDays: 20,
    verified: false,
  },
  {
    id: "cerebrain",
    name: "CereBrain Tablets",
    line: "Heart & Blood Fit",
    format: "tablets",
    summary: "Ginkgo leaf extract, used to support blood flow to the brain, focus and memory.",
    keyIngredients: ["Ginkgo biloba leaf extract"],
    goals: ["focus"],
    supports: { memory: 0.9, focus: 0.8, circulation: 0.3, ageing: 0.25 },
    reasons: {
      memory: "Ginkgo is the most widely used herb for memory, which is what you said you'd like help with.",
      focus: "Ginkgo supports blood flow to the brain, which is why people use it for concentration.",
    },
    expectation: "Ginkgo takes time. Give it six to eight weeks before deciding whether it's helping.",
    traits: { clotting: "strong", moodMedInteraction: true },
    supplyDays: 20,
    verified: false,
  },
  {
    id: "detoxilive",
    name: "Detoxilive Capsules",
    line: "Heart & Blood Fit",
    format: "capsules",
    summary: "Soy lecithin capsules, used to support the liver and the way the body handles fat.",
    keyIngredients: ["Soy lecithin"],
    goals: ["liver"],
    supports: { liver: 0.9, alcohol: 0.75, cholesterol: 0.35 },
    reasons: {
      alcohol: "Lecithin is used to support the liver, which does most of the work when you drink.",
      liver: "It's BF Suma's main liver product, which matches the goal you picked.",
    },
    expectation: "A long-term support. It works best alongside drinking less, not instead of it.",
    traits: { soy: true },
    supplyDays: 30,
    verified: false,
  },

  // ---------------------------------------------------------------- Joints & bones
  {
    id: "arthroxtra",
    name: "ArthroXtra Tablets",
    line: "Sport Fit",
    format: "tablets",
    summary:
      "Glucosamine and chondroitin, the two main building blocks of joint cartilage. BF Suma's stronger joint formula, aimed at long-standing joint problems and older joints.",
    keyIngredients: ["Glucosamine (375 mg per tablet)", "Chondroitin (300 mg per tablet)"],
    goals: ["joints"],
    supports: { joints_longterm: 1, joints_mild: 0.4 },
    reasons: {
      joints_longterm:
        "You've had joint trouble for a while, and this is the formula BF Suma makes for long-standing problems.",
    },
    expectation:
      "Joint products are slow. Most people need six to eight weeks of daily use before they notice a difference.",
    traits: { shellfish: true, porkUnconfirmed: true },
    group: "glucosamine",
    supplyDays: 30,
    verified: false,
  },
  {
    id: "gluzojoint-f",
    name: "GluzoJoint-F Capsules",
    line: "Sport Fit",
    format: "capsules",
    summary:
      "Glucosamine from shellfish and chondroitin from pork cartilage. The gentler of BF Suma's two joint formulas, for milder or more recent discomfort and active people.",
    keyIngredients: ["Glucosamine (from crustacean shells)", "Chondroitin (from porcine cartilage)"],
    goals: ["joints"],
    supports: { joints_mild: 1, joints_longterm: 0.45, active: 0.35 },
    reasons: {
      joints_mild:
        "Your joint discomfort is fairly recent, and this is the lighter formula BF Suma makes for that stage.",
      active: "It suits active people who want to look after their joints.",
    },
    expectation: "Give it six to eight weeks of daily use. Joint support is gradual.",
    traits: { shellfish: true, pork: true },
    group: "glucosamine",
    supplyDays: 30,
    verified: false,
  },
  {
    id: "zaminocal-plus",
    name: "ZaminoCal Plus Capsules",
    line: "Sport Fit",
    format: "capsules",
    summary:
      "Calcium in an amino-acid form that the body absorbs easily, with zinc, magnesium and selenium, for bones and teeth.",
    keyIngredients: ["Amino acid chelated calcium", "Zinc", "Magnesium", "Selenium"],
    goals: ["joints"],
    supports: { bones: 1, cramps: 0.5, joints_longterm: 0.25 },
    reasons: {
      bones: "Calcium and magnesium are what your bones are made of, which matters given what you told us about your bones.",
      cramps: "Magnesium and calcium are often low in people who get cramps after activity.",
    },
    expectation: "Bone health is a long game. This is something people take for months, not weeks.",
    traits: {},
    group: "calcium",
    supplyDays: 30,
    verified: false,
  },
  {
    id: "femicalcium-d3",
    name: "FemiCalcium D3",
    line: "Women's Beauty",
    format: "capsules",
    summary:
      "Calcium citrate with vitamin D3, made for women. BF Suma positions it for pregnancy and breastfeeding as well as everyday bone support.",
    keyIngredients: ["Calcium citrate (630 mg)", "Vitamin D3"],
    goals: ["joints", "womens_health"],
    supports: { bones: 0.9, menopause: 0.5, cramps: 0.4 },
    reasons: {
      bones: "Calcium with vitamin D, which helps your body actually absorb it. A good fit for women looking after their bones.",
      menopause: "Bone strength matters more around menopause, when calcium loss speeds up.",
    },
    expectation: "Bone support is long-term. Think in months.",
    traits: {},
    audience: { sex: "female" },
    group: "calcium",
    supplyDays: 30,
    verified: false,
  },

  // ---------------------------------------------------------------- Digestion & weight
  {
    id: "veggie-veggie",
    name: "Veggie Veggie",
    line: "Suma Fit",
    format: "drink",
    summary:
      "A drink sachet of fermented fruit and vegetable essence from 120 kinds of produce, with dietary fibre and probiotics.",
    keyIngredients: ["Fermented fruit and vegetable essence", "Nutriose dietary fibre", "Probiotics"],
    goals: ["digestion", "weight"],
    supports: { low_veg: 0.9, constipation: 0.65, bloating: 0.5, weight: 0.45, blood_sugar: 0.2 },
    reasons: {
      low_veg: "You told us you don't get many vegetables most days. This helps fill part of that gap with fibre.",
      constipation: "Fibre is the first thing to fix for regularity, and this is an easy way to get more of it.",
      weight: "Fibre helps you feel full for longer, which makes eating less easier.",
    },
    expectation: "Most people notice a difference in digestion within one to two weeks. Drink plenty of water with it.",
    traits: {},
    supplyDays: 15,
    verified: false,
  },
  {
    id: "probio3",
    name: "Probio3",
    line: "Suma Fit",
    format: "drink",
    summary: "A probiotic with three strains of friendly bacteria, to support a balanced gut.",
    keyIngredients: ["Bifidobacterium and other probiotic strains"],
    goals: ["digestion"],
    supports: { bloating: 0.8, loose_stools: 0.8, reflux: 0.2, immunity_frequent: 0.25 },
    reasons: {
      bloating: "Bloating often comes from an unsettled gut, and probiotics are the usual starting point.",
      loose_stools: "Probiotics help restore balance in the gut, which is why people use them for loose stools.",
    },
    expectation: "Give it two to four weeks. Take it daily for the best chance of it helping.",
    traits: {},
    supplyDays: 30,
    verified: false,
  },
  {
    id: "constirelax",
    name: "ConstiRelax Solution",
    line: "Suma Fit",
    format: "drink",
    summary: "A drink with astragalus and FOS, a prebiotic fibre, to encourage regular bowel movements.",
    keyIngredients: ["Astragalus (Radix Astragali)", "FOS (fructo-oligosaccharides)"],
    goals: ["digestion"],
    supports: { constipation: 1 },
    reasons: {
      constipation: "It's made specifically for constipation, which you said happens often.",
    },
    expectation: "Usually works within days. Drink plenty of water and add fibre to your meals as well.",
    traits: {},
    supplyDays: 20,
    verified: false,
  },
  {
    id: "novel-depile",
    name: "Novel Depile Capsules",
    line: "Suma Fit",
    format: "capsules",
    summary: "A herbal formula for the discomfort of piles (haemorrhoids).",
    keyIngredients: ["Herbal blend — confirm against label"],
    goals: ["digestion"],
    supports: { piles: 1 },
    reasons: {
      piles: "It's BF Suma's product for piles, which you mentioned.",
    },
    expectation: "Pair it with more water and fibre. Straining makes piles worse.",
    note: "Bleeding from the back passage should always be checked by a doctor.",
    traits: {},
    supplyDays: 20,
    verified: false,
  },
  {
    id: "ez-xlim",
    name: "Ez-Xlim",
    line: "Suma Fit",
    format: "capsules",
    summary:
      "Gymnema, white kidney bean extract, chitosan and bitter orange, used to help manage appetite and how much fat and sugar the body takes in from food.",
    keyIngredients: ["Gymnema", "White kidney bean extract", "Chitosan", "Bitter orange (Citrus aurantium)"],
    goals: ["weight"],
    supports: { weight: 0.95, portions: 0.8, sugar_cravings: 0.5 },
    reasons: {
      portions: "You said portions and hunger make it hard. This is designed to help with exactly that.",
      weight: "It's BF Suma's main weight product.",
    },
    expectation:
      "Realistic weight loss is about half a kilo to a kilo a week, and only alongside changes to what you eat.",
    traits: { shellfish: true, stimulant: true, lowersBloodSugar: true },
    supplyDays: 30,
    verified: false,
  },

  // ---------------------------------------------------------------- Blood sugar
  {
    id: "gymeffect",
    name: "GymEffect Capsules",
    line: "Heart & Blood Fit",
    format: "capsules",
    summary:
      "Gymnema, chromium-rich yeast and PQQ, to help keep blood sugar in a healthy range and take the edge off sugar cravings.",
    keyIngredients: ["Gymnema sylvestre", "Chromium-rich yeast", "PQQ"],
    goals: ["blood_sugar"],
    supports: { blood_sugar: 1, sugar_cravings: 0.85, energy_crash: 0.6, weight: 0.25 },
    reasons: {
      sugar_cravings: "Gymnema is known for dulling the taste of sugar, which helps with the cravings you mentioned.",
      blood_sugar: "Gymnema and chromium are the two best-known ingredients for healthy blood sugar.",
      energy_crash: "Energy crashes after meals are often about blood sugar, which is what this supports.",
    },
    expectation: "It supports, it doesn't replace. Keep taking any diabetes medicine exactly as prescribed.",
    traits: { lowersBloodSugar: true },
    group: "glucose",
    supplyDays: 30,
    verified: false,
  },
  {
    id: "glugogone",
    name: "GluGoGone Capsules",
    line: "Heart & Blood Fit",
    format: "capsules",
    summary: "Bitter melon (karela) extract, a traditional plant used to support healthy blood sugar.",
    keyIngredients: ["Bitter melon (Momordica charantia) extract"],
    goals: ["blood_sugar"],
    supports: { blood_sugar: 0.9, energy_crash: 0.4 },
    reasons: {
      blood_sugar: "Bitter melon is one of the oldest plants used for blood sugar, which is what you want to work on.",
    },
    expectation: "It supports, it doesn't replace. Keep taking any diabetes medicine exactly as prescribed.",
    traits: { lowersBloodSugar: true },
    group: "glucose",
    supplyDays: 30,
    verified: false,
  },

  // ---------------------------------------------------------------- Ageing & skin
  {
    id: "nmn-duo",
    name: "NMN Duo Release",
    line: "Immune Booster",
    format: "tablets",
    summary:
      "NMN in a two-stage release tablet, aimed at energy and healthy ageing. One of the premium products in the range.",
    keyIngredients: ["NMN (nicotinamide mononucleotide)"],
    goals: ["skin_ageing", "energy"],
    supports: { ageing: 0.9, energy_low: 0.5 },
    reasons: {
      ageing: "NMN is used for energy and healthy ageing, which is the goal you picked.",
    },
    expectation: "Research on NMN in people is still early. It's a long-term support, and one of the pricier options.",
    traits: { premium: true },
    group: "nmn",
    supplyDays: 30,
    verified: false,
  },
  {
    id: "youth-ever",
    name: "Youth Ever",
    line: "Women's Beauty",
    format: "capsules",
    summary: "Antioxidants from berries with resveratrol and NMN, for skin and healthy ageing.",
    keyIngredients: ["Berry antioxidants", "Resveratrol", "NMN"],
    goals: ["skin_ageing"],
    supports: { skin: 0.8, ageing: 0.8 },
    reasons: {
      skin: "Antioxidants from berries help protect skin, which fits what you'd like to improve.",
      ageing: "Resveratrol and NMN are both used for healthy ageing.",
    },
    expectation: "Skin renews itself roughly every four to six weeks, so give it at least that long.",
    traits: {},
    group: "nmn",
    supplyDays: 30,
    verified: false,
  },
  {
    id: "feminergy",
    name: "Feminergy Capsules",
    line: "Women's Beauty",
    format: "capsules",
    summary:
      "Grape seed extract, a rich source of antioxidants, made for women and used for skin and all-round wellbeing.",
    keyIngredients: ["Grape seed extract"],
    goals: ["womens_health", "skin_ageing"],
    supports: { women_energy: 0.7, women_cycle: 0.45, skin: 0.55 },
    reasons: {
      women_energy: "It's BF Suma's everyday product for women's wellbeing, which fits the energy you mentioned.",
      women_cycle: "Many women take it as part of their monthly routine.",
      skin: "Grape seed antioxidants are also used for skin.",
    },
    expectation: "Give it two to three months to judge.",
    note: "Painful or very irregular periods are worth mentioning to a doctor, especially if they're new.",
    traits: {},
    audience: { sex: "female" },
    supplyDays: 30,
    verified: false,
  },
  {
    id: "femicare",
    name: "FemiCare Feminine Cleanser",
    line: "Women's Beauty",
    format: "wash",
    summary: "A gentle intimate wash with plant oils and vitamins, for everyday freshness and comfort.",
    keyIngredients: ["Plant essential oils", "Vitamins"],
    goals: ["womens_health"],
    supports: { intimate: 1 },
    reasons: {
      intimate: "A gentle wash made for intimate comfort, which is what you asked about.",
    },
    expectation: "Use it for external washing only.",
    note: "If itching, unusual discharge or odour lasts more than a few days, visit a clinic. It may need treatment.",
    traits: { topical: true },
    audience: { sex: "female" },
    supplyDays: 45,
    verified: false,
  },
  {
    id: "youth-essence",
    name: "Youth Essence Skincare",
    line: "Women's Beauty",
    format: "skincare",
    summary: "BF Suma's skincare range: toner, lotion, cream and facial mask.",
    keyIngredients: ["See individual products"],
    goals: ["skin_ageing"],
    supports: { skin: 0.6, ageing: 0.4 },
    reasons: {
      skin: "Supplements work from the inside; a simple routine helps from the outside.",
    },
    expectation: "Use it morning and evening. Sunscreen during the day matters more than any cream.",
    traits: { topical: true },
    supplyDays: 45,
    verified: false,
  },

  // ---------------------------------------------------------------- Men
  {
    id: "prostatrelax",
    name: "ProstatRelax Capsules",
    line: "Men's Power",
    format: "capsules",
    summary: "A patented plant extract to support prostate health and urinary comfort.",
    keyIngredients: ["Patented plant extract — confirm against label"],
    goals: ["mens_health"],
    supports: { prostate: 1 },
    reasons: {
      prostate: "It's BF Suma's prostate product, for the night-time trips and flow problems you mentioned.",
    },
    expectation: "Give it six to eight weeks.",
    note: "Urinary changes in men over 45 should be checked by a doctor. A PSA blood test is quick.",
    traits: {},
    audience: { sex: "male" },
    supplyDays: 30,
    verified: false,
  },
  {
    id: "xpower-man-plus",
    name: "XPower Man Plus Capsules",
    line: "Men's Power",
    format: "capsules",
    summary: "A herbal formula for men's energy, drive and performance.",
    keyIngredients: ["Herbal blend — confirm against label"],
    goals: ["mens_health"],
    supports: { performance: 1, male_vitality: 0.8 },
    reasons: {
      performance: "It's BF Suma's main product for men's performance, which is what you asked about.",
      male_vitality: "It's used by men who want more energy and drive.",
    },
    expectation: "Results vary from man to man. Sleep, alcohol and stress all affect performance too.",
    traits: { sexualHealth: true },
    audience: { sex: "male" },
    group: "xpower",
    supplyDays: 30,
    verified: false,
  },
  {
    id: "xpower-coffee",
    name: "XPower Man Coffee",
    line: "Men's Power",
    format: "coffee",
    summary: "The coffee version of XPower Man, for men who'd rather take it in their morning cup.",
    keyIngredients: ["Coffee", "Herbal blend — confirm against label"],
    goals: ["mens_health"],
    supports: { male_vitality: 0.7, performance: 0.6, energy_morning: 0.3 },
    reasons: {
      male_vitality: "An easy way to fit it into your day, in place of your usual coffee.",
    },
    expectation: "Results vary. Sleep, alcohol and stress all play a part.",
    traits: { sexualHealth: true, caffeine: true, mayContainSugar: true },
    audience: { sex: "male" },
    group: "xpower",
    supplyDays: 20,
    verified: false,
  },
];

export const PRODUCTS_BY_ID: Record<string, Product> = Object.fromEntries(
  CATALOGUE.map((p) => [p.id, p]),
);

/** Products that only suit someone as an extra, never as the headline pick. */
export function isTopical(p: Product) {
  return Boolean(p.traits.topical);
}
