import { describe, expect, it } from "vitest";
import {
  CATALOGUE,
  QUESTIONS,
  distributorBrief,
  isAnswered,
  pruneAnswers,
  recommend,
  toggleOption,
  visibleOptions,
  visibleQuestions,
  whatsappLink,
  whatsappMessage,
  type Answers,
} from "./index";
import { checkProduct } from "./safety";

const ctx = { distributorName: "Grace Wambui", distributorFirstName: "Grace" };

const base: Answers = {
  first_name: "wanjiru",
  sex: "female",
  age: 34,
  pregnancy: "none",
  experience: "never",
  meals: "home",
  veg: "few",
  sugary: "daily",
  water: "low",
  active: "few",
  sleep_hours: "5to6",
  alcohol: "none",
  smoke: "no",
  conditions: ["none"],
  medications: ["none"],
  restrictions: ["none"],
  plan_size: "focused",
};

const ids = (r: ReturnType<typeof recommend>) => r.core.map((c) => c.product.id);
const all = (r: ReturnType<typeof recommend>) => [...r.core, ...r.addons].map((c) => c.product.id);

describe("recommendations", () => {
  it("builds a focused plan with one product per goal", () => {
    const r = recommend({
      ...base,
      goals: ["energy", "joints", "digestion"],
      energy_level: 2,
      energy_dips: ["afternoon", "morning"],
      joint_issues: ["pain"],
      joint_duration: "recent",
      bone_risk: "no",
      gut_issues: ["constipation"],
      constipation_freq: "weekly",
    });
    expect(r.status).toBe("ready");
    expect(r.core).toHaveLength(3);
    expect(ids(r)).toContain("gluzojoint-f");
    expect(ids(r).some((id) => ["constirelax", "veggie-veggie"].includes(id))).toBe(true);
    expect(r.core[0].covers).toContain("energy");
    for (const c of r.core) expect(c.reasons.length).toBeGreaterThan(0);
    expect(r.habits.length).toBeGreaterThan(0);
    expect(r.ref).toMatch(/^SA-[A-Z2-9]{4}$/);
  });

  it("picks the stronger joint formula for long-standing problems", () => {
    const r = recommend({
      ...base,
      age: 62,
      goals: ["joints"],
      joint_issues: ["pain", "arthritis"],
      joint_duration: "years",
      bone_risk: "no",
    });
    expect(ids(r)[0]).toBe("arthroxtra");
  });

  it("never recommends two products from the same group", () => {
    const r = recommend({
      ...base,
      plan_size: "complete",
      goals: ["joints", "womens_health", "energy"],
      joint_issues: ["pain", "bones"],
      joint_duration: "years",
      bone_risk: "yes",
      women_concerns: ["bones", "energy"],
      energy_level: 1,
      energy_dips: ["morning"],
    });
    const groups = [...r.core, ...r.addons].map((c) => c.product.group).filter(Boolean);
    expect(new Set(groups).size).toBe(groups.length);
  });

  it("respects plan size 'one'", () => {
    const r = recommend({
      ...base,
      plan_size: "one",
      goals: ["immunity", "energy"],
      sick_often: "often",
      recovery: "slow",
      energy_level: 2,
      energy_dips: ["all_day"],
    });
    expect(r.core).toHaveLength(1);
    expect(r.core[0].product.goals).toContain("immunity");
  });
});

describe("safety", () => {
  it("puts pregnancy on a clinic-first path with no product plan", () => {
    const r = recommend({ ...base, pregnancy: "pregnant", goals: ["energy"], energy_level: 1, energy_dips: ["all_day"] });
    expect(r.status).toBe("clinic-first");
    expect(r.core).toHaveLength(0);
    expect(r.addons).toHaveLength(0);
    expect(r.planNotes.join(" ")).toMatch(/clinic/i);
  });

  it("leaves out shellfish-derived products for shellfish allergy", () => {
    const r = recommend({
      ...base,
      restrictions: ["shellfish"],
      goals: ["joints", "weight"],
      joint_issues: ["pain"],
      joint_duration: "months",
      bone_risk: "no",
      weight_goal: "some",
      weight_struggles: ["portions"],
    });
    for (const id of all(r)) expect(CATALOGUE.find((p) => p.id === id)!.traits.shellfish).toBeFalsy();
    expect(r.excluded.map((e) => e.product.id)).toEqual(expect.arrayContaining(["gluzojoint-f"]));
  });

  it("leaves out pork-derived chondroitin for people who avoid pork", () => {
    const r = recommend({
      ...base,
      restrictions: ["pork"],
      goals: ["joints"],
      joint_issues: ["pain"],
      joint_duration: "recent",
      bone_risk: "no",
    });
    expect(all(r)).not.toContain("gluzojoint-f");
    const arthro = r.core.find((c) => c.product.id === "arthroxtra");
    expect(arthro?.cautions.join(" ")).toMatch(/pork/);
  });

  it("leaves out ginkgo and MicrO2 Cycle for people on blood thinners", () => {
    const r = recommend({
      ...base,
      medications: ["thinners"],
      goals: ["heart", "focus"],
      heart_concerns: ["circulation"],
      focus_issues: ["memory"],
    });
    expect(all(r)).not.toContain("micro2-cycle");
    expect(all(r)).not.toContain("cerebrain");
    expect(r.status).toBe("review");
  });

  it("warns about blood sugar products alongside diabetes medicine", () => {
    const r = recommend({ ...base, goals: ["blood_sugar"], sugar_status: "diabetic", sugar_meds: "yes" });
    expect(r.core[0].product.traits.lowersBloodSugar).toBe(true);
    expect(r.core[0].cautions.join(" ")).toMatch(/diabetes medicine/);
    expect(r.profile.medications).toContain("diabetes_meds");
  });

  it("drops coffee products when caffeine doesn't agree", () => {
    const r = recommend({
      ...base,
      restrictions: ["caffeine"],
      goals: ["energy"],
      energy_level: 1,
      energy_dips: ["morning"],
    });
    for (const id of all(r)) expect(CATALOGUE.find((p) => p.id === id)!.traits.caffeine).toBeFalsy();
  });

  it("drops stimulant weight products with high blood pressure", () => {
    const r = recommend({
      ...base,
      conditions: ["bp"],
      goals: ["weight"],
      weight_goal: "lots",
      weight_struggles: ["portions", "cravings"],
    });
    expect(all(r)).not.toContain("ez-xlim");
  });

  it("drops performance products with heart disease", () => {
    const r = recommend({
      ...base,
      first_name: "otieno",
      sex: "male",
      pregnancy: undefined,
      age: 52,
      conditions: ["heart"],
      goals: ["mens_health"],
      men_concerns: ["performance", "prostate"],
    });
    expect(all(r)).not.toContain("xpower-man-plus");
    expect(ids(r)).toContain("prostatrelax");
    expect(r.seeDoctor.join(" ")).toMatch(/PSA/);
  });

  it("flags ARVs for clinic review", () => {
    const r = recommend({ ...base, medications: ["arvs"], goals: ["immunity"], sick_often: "often", recovery: "slow" });
    expect(r.status).toBe("review");
    expect(r.planNotes.join(" ")).toMatch(/ARVs/);
  });

  it("does not show women's products to men or men's products to women", () => {
    const m = recommend({
      ...base,
      sex: "male",
      pregnancy: undefined,
      goals: ["skin_ageing", "joints"],
      skin_concerns: ["dull", "lines"],
      joint_issues: ["bones"],
      bone_risk: "yes",
      plan_size: "complete",
    });
    for (const r of [...m.core, ...m.addons]) expect(r.product.audience?.sex).not.toBe("female");
  });
});

describe("flow", () => {
  it("hides follow-ups for goals that weren't chosen, and prunes their answers", () => {
    const a: Answers = { ...base, goals: ["energy"], energy_level: 2, sick_often: "often" };
    const visible = visibleQuestions(a).map((q) => q.id);
    expect(visible).toContain("energy_level");
    expect(visible).not.toContain("sick_often");
    expect(pruneAnswers(a).sick_often).toBeUndefined();
  });

  it("asks goal follow-ups in the order the goals were ranked", () => {
    const order = visibleQuestions({ ...base, goals: ["joints", "energy"] }).map((q) => q.id);
    expect(order.indexOf("joint_issues")).toBeLessThan(order.indexOf("energy_level"));
    expect(order.indexOf("energy_dips")).toBeLessThan(order.indexOf("life_intro"));
    expect(order.indexOf("goals")).toBeLessThan(order.indexOf("joint_issues"));
  });

  it("hides the pregnancy question for men and the men's goal for women", () => {
    expect(visibleQuestions({ sex: "male" }).map((q) => q.id)).not.toContain("pregnancy");
    const goalsQ = QUESTIONS.find((q) => q.id === "goals")!;
    expect(visibleOptions(goalsQ, { sex: "female" }).map((o) => o.id)).not.toContain("mens_health");
    expect(visibleOptions(goalsQ, { sex: "undisclosed" }).map((o) => o.id)).toContain("mens_health");
  });

  it("handles exclusive options and max selections", () => {
    const q = QUESTIONS.find((x) => x.id === "gut_issues")!;
    expect(toggleOption(q, ["bloating"], "none")).toEqual(["none"]);
    expect(toggleOption(q, ["none"], "bloating")).toEqual(["bloating"]);
    const goals = QUESTIONS.find((x) => x.id === "goals")!;
    expect(toggleOption(goals, ["energy", "immunity", "digestion"], "weight")).toHaveLength(3);
  });

  it("validates age range", () => {
    const q = QUESTIONS.find((x) => x.id === "age")!;
    expect(isAnswered(q, { age: 17 })).toBe(false);
    expect(isAnswered(q, { age: 34 })).toBe(true);
  });
});

describe("handoff", () => {
  it("writes a WhatsApp message in the customer's voice with a reference", () => {
    const r = recommend({ ...base, goals: ["digestion"], gut_issues: ["bloating"] });
    const msg = whatsappMessage(r, ctx);
    expect(msg).toMatch(/^Hi Grace/);
    expect(msg).toContain("Wanjiru");
    expect(msg).toContain(r.ref);
    const link = whatsappLink("+254 712 345 678", msg);
    expect(link.startsWith("https://wa.me/254712345678?text=")).toBe(true);
  });

  it("gives the distributor flags and an opener", () => {
    const r = recommend({ ...base, medications: ["bp_meds"], goals: ["heart"], heart_concerns: ["bp"] });
    const b = distributorBrief(r);
    expect(b.flags).toContain("Takes blood pressure medicine");
    expect(b.opener).toMatch(/^Hi Wanjiru/);
    expect(b.tips.join(" ")).toMatch(/First time/);
  });
});

// ------------------------------------------------------------------ fuzz
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function randomAnswers(rand: () => number): Answers {
  const a: Answers = {};
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  for (let guard = 0; guard < 200; guard++) {
    const q = visibleQuestions(a).find((x) => x.kind !== "section" && a[x.id] === undefined);
    if (!q) break;
    const opts = visibleOptions(q, a);
    switch (q.kind) {
      case "text":
        a[q.id] = "Test";
        break;
      case "number":
        a[q.id] = 18 + Math.floor(rand() * 70);
        break;
      case "scale":
        a[q.id] = 1 + Math.floor(rand() * 5);
        break;
      case "single":
        a[q.id] = pick(opts).id;
        break;
      case "multi":
      case "ranked": {
        let sel: string[] = [];
        const n = 1 + Math.floor(rand() * (q.max ?? 3));
        for (let i = 0; i < n; i++) sel = toggleOption(q, sel, pick(opts).id);
        a[q.id] = sel.length ? sel : [opts[0].id];
        break;
      }
    }
  }
  return a;
}

describe("fuzz", () => {
  it("never recommends something its own safety rules exclude, and stays within limits", () => {
    const rand = rng(42);
    for (let i = 0; i < 3000; i++) {
      const a = randomAnswers(rand);
      const r = recommend(a);
      const limit = { one: 1, focused: 3, complete: 4 }[r.profile.planSize];
      expect(r.core.length).toBeLessThanOrEqual(limit);
      if (r.status === "clinic-first") expect(r.core.length + r.addons.length).toBe(0);
      const recs = [...r.core, ...r.addons];
      const groups = recs.map((x) => x.product.group).filter(Boolean);
      expect(new Set(groups).size).toBe(groups.length);
      expect(new Set(recs.map((x) => x.product.id)).size).toBe(recs.length);
      for (const rec of recs) {
        expect(checkProduct(rec.product, r.profile).exclude).toBeUndefined();
        const sex = rec.product.audience?.sex;
        if (sex && r.profile.sex !== "undisclosed") expect(sex).toBe(r.profile.sex);
      }
      expect(whatsappMessage(r, ctx).length).toBeLessThan(1500);
    }
  });
});
