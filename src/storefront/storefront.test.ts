import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CATALOGUE, PRODUCTS_BY_ID, recommend, type Answers } from "@/engine";
import { STOREFRONTS, storefrontBySlug } from "@/storefronts";
import { kate } from "@/storefronts/kate";
import { engineDrift } from "../../scripts/engine.mjs";
import { cartReducer, priceCart, sanitiseCart, MAX_QTY, type CartItem } from "./cart";
import { askMessage, whatsappHref } from "./messages";
import { amount, kes } from "./money";
import {
  ORDER_REF,
  detailsProblem,
  emptyDetails,
  formatKenyanPhone,
  initials,
  newOrderRef,
  normaliseKenyanPhone,
  orderMessage,
  orderRecord,
  parseDetails,
  portalOrder,
  priceOrder,
  type OrderDetails,
} from "./order";
import { checkNotes, listings, matchesQuery, oneLiner, shortName, supplyLabel } from "./products";
import { priceSuggestions } from "./suggestions";
import type { Storefront } from "./types";
import { contrast, validateStorefront } from "./validate";

/** A storefront that is live, with a number, fees and pickup, for exercising every branch. */
const live: Storefront = {
  ...kate,
  slug: "test",
  status: "live",
  pending: [],
  distributor: { ...kate.distributor, name: "Amani Otieno", firstName: "Amani", whatsapp: "254700000001" },
  catalogue: { ...kate.catalogue, offers: { probio3: { price: 3900 }, "veggie-veggie": { price: 4100 }, constirelax: { price: 3600, inStock: false } }, featured: ["veggie-veggie"] },
  fulfilment: {
    delivery: { areas: [{ id: "cbd", label: "Nairobi CBD", fee: 200 }, { id: "far", label: "Upcountry", fee: null }] },
    pickup: { label: "Collect in Westlands" },
  },
  payment: { methods: ["mpesa", "cash"], mpesa: { kind: "till", number: "123456" } },
};

describe("the engine", () => {
  it("is an unmodified copy of the Suppli Afya engine", () => {
    expect(engineDrift()).toEqual([]);
  });
});

describe("storefront configuration", () => {
  it("every storefront is valid", () => {
    for (const sf of STOREFRONTS) expect(validateStorefront(sf)).toEqual([]);
    expect(validateStorefront(live)).toEqual([]);
  });

  it("slugs are unique and resolvable", () => {
    expect(new Set(STOREFRONTS.map((s) => s.slug)).size).toBe(STOREFRONTS.length);
    for (const sf of STOREFRONTS) expect(storefrontBySlug(sf.slug)).toBe(sf);
  });

  it("catches mistakes a person could make", () => {
    const broken: Storefront = {
      ...live,
      status: "live",
      pending: ["prices"],
      distributor: { ...live.distributor, whatsapp: "0712 345 678" },
      catalogue: { ...live.catalogue, offers: { "not-a-product": { price: 3.5 } }, featured: ["probio3"] },
      theme: { ...live.theme, accent: "#f5f0a0" },
    };
    const problems = validateStorefront(broken).join("\n");
    expect(problems).toMatch(/whatsapp must be digits/);
    expect(problems).toMatch(/pending placeholders/);
    expect(problems).toMatch(/not a product/);
    expect(problems).toMatch(/whole shillings/);
    expect(problems).toMatch(/featured "probio3"/);
  });

  it("rejects an accent colour that white text can't sit on", () => {
    expect(validateStorefront({ ...live, theme: { ...live.theme, accent: "#e7d9ff" } }).join()).toMatch(/readable/);
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  it("a preview storefront never links to a real WhatsApp number", () => {
    const preview = { ...live, status: "preview" as const };
    expect(whatsappHref(preview, "hi")).toBeNull();
    expect(whatsappHref(live, "hi")).toBe("https://wa.me/254700000001?text=hi");
  });
});

describe("components stay distributor-agnostic", () => {
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
      const p = join(dir, f);
      return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(f) ? [p] : [];
    });
  it("no distributor's name is written into the UI", () => {
    const root = join(import.meta.dirname, "..");
    const names = STOREFRONTS.flatMap((s) => [s.distributor.name, s.distributor.firstName]);
    for (const file of [...files(join(root, "components")), ...files(join(root, "app"))]) {
      const src = readFileSync(file, "utf8");
      for (const n of names) expect(src.includes(n), `${file} mentions ${n}`).toBe(false);
    }
  });
});

describe("money", () => {
  it("formats shillings the same everywhere", () => {
    expect(kes(3900)).toBe("KES 3,900");
    expect(kes(1234567)).toBe("KES 1,234,567");
    expect(amount(950)).toBe("950");
    expect(amount(-1200)).toBe("-1,200");
  });
});

describe("products", () => {
  it("lists what the distributor sells, featured first", () => {
    const l = listings(live);
    expect(l.map((x) => x.product.id)).toEqual(["veggie-veggie", "probio3", "constirelax"]);
    expect(listings(kate).length).toBe(Object.keys(kate.catalogue.offers).length);
    expect(listings(kate).slice(0, kate.catalogue.featured.length).map((x) => x.product.id)).toEqual(kate.catalogue.featured);
  });

  it("searches names, ingredients, formats and goals", () => {
    const p = PRODUCTS_BY_ID;
    expect(matchesQuery(p["probio3"], "PROBIO")).toBe(true);
    expect(matchesQuery(p["cerebrain"], "ginkgo")).toBe(true);
    expect(matchesQuery(p["reishi-coffee"], "coffee")).toBe(true);
    expect(matchesQuery(p["constirelax"], "digestion")).toBe(true);
    expect(matchesQuery(p["constirelax"], "joints")).toBe(false);
    expect(matchesQuery(p["probio3"], "  ")).toBe(true);
  });

  it("shortens names for packs and summaries for cards", () => {
    expect(shortName(PRODUCTS_BY_ID["arthroxtra"])).toBe("ArthroXtra");
    expect(shortName(PRODUCTS_BY_ID["probio3"])).toBe("Probio3");
    for (const p of CATALOGUE) {
      expect(oneLiner(p).length).toBeGreaterThan(10);
      expect(oneLiner(p).length).toBeLessThanOrEqual(p.summary.length);
    }
  });

  it("describes supply in plain words", () => {
    expect(supplyLabel(15)).toBe("About two weeks per pack");
    expect(supplyLabel(20)).toBe("About three weeks per pack");
    expect(supplyLabel(30)).toBe("About a month per pack");
    expect(supplyLabel(45)).toBe("About six weeks per pack");
  });

  it("says what every safety trait means, and nothing else", () => {
    // If the engine gains a trait, this fails until the product page knows how to explain it.
    const explained = new Set(["shellfish", "pork", "porkUnconfirmed", "soy", "caffeine", "mayContainSugar", "stimulant", "clotting", "lowersBloodSugar", "mayLowerBp", "moodMedInteraction", "immuneActive", "sexualHealth", "topical"]);
    const silent = new Set(["premium", "notInPregnancy"]); // premium isn't a safety fact; pregnancy is covered for every product
    for (const p of CATALOGUE) {
      for (const [trait, value] of Object.entries(p.traits)) {
        if (!value) continue;
        expect(explained.has(trait) || silent.has(trait), `${p.id}.${trait} has no customer wording`).toBe(true);
      }
      const notes = checkNotes(p, "Amani");
      const expected = Object.entries(p.traits).filter(([k, v]) => v && explained.has(k)).length;
      expect(notes).toHaveLength(expected);
      for (const n of notes) expect(n).not.toMatch(/\b(cure|treat|prevent|heal)s?\b/i);
    }
    expect(checkNotes(PRODUCTS_BY_ID["arthroxtra"], "Amani").join(" ")).toMatch(/ask Amani first/);
  });
});

describe("cart", () => {
  it("adds, merges, caps and removes", () => {
    let c: CartItem[] = [];
    c = cartReducer(c, { type: "add", id: "probio3" });
    c = cartReducer(c, { type: "add", id: "probio3", qty: 2, from: "selector" });
    expect(c).toEqual([{ id: "probio3", qty: 3, from: "selector" }]);
    c = cartReducer(c, { type: "set", id: "probio3", qty: 99 });
    expect(c[0].qty).toBe(MAX_QTY);
    c = cartReducer(c, { type: "set", id: "probio3", qty: 0 });
    expect(c).toEqual([]);
  });

  it("only trusts well-formed items from storage", () => {
    expect(sanitiseCart("nonsense")).toEqual([]);
    expect(sanitiseCart([{ id: "probio3", qty: 2 }, { id: "probio3", qty: 1 }, { id: 4 }, null, { id: "x", qty: NaN }])).toEqual([{ id: "probio3", qty: 3 }]);
  });

  it("prices from the current list and sets aside what can't be sold", () => {
    const priced = priceCart(live, [
      { id: "probio3", qty: 2 },
      { id: "constirelax", qty: 1 }, // out of stock
      { id: "cerebrain", qty: 1 }, // not on this price list
    ]);
    expect(priced.lines.map((l) => [l.id, l.total])).toEqual([["probio3", 7800]]);
    expect(priced.subtotal).toBe(7800);
    expect(priced.count).toBe(2);
    expect(priced.unavailable.map((u) => u.id)).toEqual(["constirelax"]);
  });
});

describe("orders", () => {
  const cart: CartItem[] = [
    { id: "probio3", qty: 1, from: "selector" },
    { id: "veggie-veggie", qty: 2 },
  ];
  const details: OrderDetails = { ...emptyDetails(live), name: " Wanjiru ", phone: "0712 345 678", receive: "delivery", areaId: "cbd", address: "Kilimani,\nnear Yaya", payment: "mpesa", note: "" };

  it("asks for what's missing, one thing at a time", () => {
    expect(detailsProblem(live, { ...details, name: "" })).toMatch(/Add your name so Amani/);
    expect(detailsProblem(live, { ...details, phone: " " })).toMatch(/Add your phone number so Amani/);
    expect(detailsProblem(live, { ...details, phone: "12345" })).toMatch(/doesn't look right/);
    expect(detailsProblem(live, { ...details, areaId: null })).toMatch(/delivered/);
    expect(detailsProblem(live, { ...details, payment: null })).toMatch(/pay/);
    expect(detailsProblem(live, { ...details, receive: "pickup", areaId: null })).toBeNull();
    expect(detailsProblem(kate, { ...emptyDetails(kate), name: "Wanjiru", phone: "0712345678", receive: "pickup" })).toMatch(/how you'd like to get/);
    expect(detailsProblem(live, details)).toBeNull();
  });

  it("totals with a known delivery fee, and says when it's still to confirm", () => {
    const known = priceOrder(live, cart, details);
    expect(known.subtotal).toBe(3900 + 8200);
    expect(known.total).toBe(3900 + 8200 + 200);
    expect(known.totalConfirmed).toBe(true);
    const unknown = priceOrder(live, cart, { ...details, areaId: "far" });
    expect(unknown.total).toBe(unknown.subtotal);
    expect(unknown.totalConfirmed).toBe(false);
    const pickup = priceOrder(live, cart, { receive: "pickup", areaId: null });
    expect(pickup.delivery).toEqual({ label: "Collect in Westlands", fee: 0 });
  });

  it("writes a complete WhatsApp message", () => {
    const order = priceOrder(live, cart, details);
    const msg = orderMessage(live, order, details, { order: "AO-7QX2", selector: "SA-AB12" });
    expect(msg).toContain("Hi Amani, I'd like to order from your page.");
    expect(msg).toContain("1 × Probio3 · KES 3,900");
    expect(msg).toContain("2 × Veggie Veggie · KES 8,200");
    expect(msg).toContain("*Delivery:* Nairobi CBD · KES 200");
    expect(msg).toContain("*Total:* KES 12,300");
    expect(msg).toContain("*Name:* Wanjiru");
    expect(msg).toContain("*Phone:* 0712 345 678");
    expect(msg).toContain("*Deliver to:* Kilimani, near Yaya");
    expect(msg).toContain("*Paying by:* M-Pesa");
    expect(msg).toContain("Order ref: AO-7QX2 · Selector ref: SA-AB12");
    const vague = orderMessage(live, priceOrder(live, cart, { ...details, areaId: "far" }), { ...details, areaId: "far" }, { order: "AO-7QX2" });
    expect(vague).toContain("(delivery cost to confirm)");
    expect(vague).not.toContain("*Total:*");
    expect(vague).toContain("Could you confirm the total");
  });

  it("makes short references the customer can quote", () => {
    expect(initials("Kate Cromuel")).toBe("KC");
    expect(initials("")).toBe("SA");
    let i = 0;
    const ref = newOrderRef("Kate Cromuel", () => [0.1, 0.5, 0.9, 0.99][i++]);
    expect(ref).toMatch(ORDER_REF);
    expect(ref.startsWith("KC-")).toBe(true);
    for (let n = 0; n < 200; n++) expect(newOrderRef("Kate Cromuel")).toMatch(ORDER_REF);
  });

  it("reads phone numbers the way people type them", () => {
    for (const typed of ["0712 345 678", "0712345678", "+254 712 345 678", "254712345678", "712345678"])
      expect(normaliseKenyanPhone(typed)).toBe("254712345678");
    expect(normaliseKenyanPhone("0110 123 456")).toBe("254110123456");
    for (const wrong of ["", "12345", "0812 345 678", "+1 415 555 0100"]) expect(normaliseKenyanPhone(wrong)).toBeNull();
    expect(formatKenyanPhone("254712345678")).toBe("0712 345 678");
  });

  it("files in the portal exactly what the Suppli Afya app takes", () => {
    const d = parseDetails({ ...details, phone: "+254 712 345 678", note: "Evenings\nare best" });
    const record = orderRecord(live, priceOrder(live, cart, d), d, { order: "AO-7QX2", selector: "SA-AB12" });
    const body = portalOrder(record, "amani");
    // The fields suppli_afya-main_site's /api/storefront/orders reads, and nothing else.
    expect(body).toEqual({
      suppliSlug: "amani",
      ref: "AO-7QX2",
      selectorRef: "SA-AB12",
      customer: { name: "Wanjiru", phone: "254712345678" },
      receive: "delivery",
      deliverTo: { area: "Nairobi CBD", address: "Kilimani, near Yaya" },
      payment: "mpesa",
      note: "Evenings are best",
      lines: [
        { id: "probio3", name: "Probio3", qty: 1, unitPrice: 3900, total: 3900 },
        { id: "veggie-veggie", name: "Veggie Veggie", qty: 2, unitPrice: 4100, total: 8200 },
      ],
      total: 12300,
      totalConfirmed: true,
    });
    expect(JSON.stringify(body)).not.toContain("Hi Amani");
  });
});

describe("messages", () => {
  it("opens a question with the product and its price", () => {
    expect(askMessage(live)).toBe("Hi Amani, I found your page and I have a question.");
    expect(askMessage(live, PRODUCTS_BY_ID["probio3"])).toBe("Hi Amani, I have a question about Probio3 (KES 3,900).");
    expect(askMessage(live, PRODUCTS_BY_ID["cerebrain"])).toBe("Hi Amani, I have a question about CereBrain Tablets.");
  });
});

describe("priced suggestions", () => {
  const answers: Answers = {
    first_name: "wanjiru",
    sex: "female",
    age: 34,
    pregnancy: "none",
    experience: "never",
    goals: ["digestion", "energy"],
    gut_issues: ["constipation", "bloating"],
    constipation_freq: "weekly",
    energy_level: 2,
    energy_dips: ["afternoon"],
    meals: "home",
    veg: "few",
    sugary: "rarely",
    water: "low",
    active: "few",
    sleep_hours: "7to8",
    alcohol: "none",
    smoke: "no",
    conditions: ["none"],
    medications: ["none"],
    restrictions: ["none"],
    plan_size: "focused",
  };

  it("prices every suggestion the distributor sells, and flags the rest", () => {
    const result = recommend(answers);
    expect(result.core.length).toBeGreaterThan(0);
    const all = priceSuggestions(kate, result);
    expect(all.core.every((s) => s.orderable)).toBe(true);
    expect(all.coreTotal).toBe(result.core.reduce((sum, r) => sum + kate.catalogue.offers[r.product.id].price, 0));

    const sparse = priceSuggestions({ ...live, catalogue: { ...live.catalogue, offers: {} } }, result);
    expect(sparse.core.every((s) => !s.orderable && s.listing === null)).toBe(true);
    expect(sparse.coreTotal).toBe(0);
    // The engine's choice is never changed by pricing.
    expect(sparse.core.map((s) => s.rec.product.id)).toEqual(result.core.map((r) => r.product.id));
  });
});
