import { devices, expect, test } from "@playwright/test";
import { basics, dailyLife, energyAndDigestion, fitsWidth, next, openSelector, pick, safety, sheet, tick } from "./helpers";

test("the first screen says whose page it is, and offers both ways in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("banner").getByText("Kate Cromuel")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Not sure which product is right for you?");
  const top = page.locator("#top");
  await expect(top.getByRole("button", { name: /Help me choose/ })).toBeVisible();
  await expect(top.getByRole("button", { name: /Browse products/ })).toBeVisible();
  // Placeholders are never passed off as facts.
  await expect(page.getByText("some details are placeholders")).toBeVisible();
  // Prices are on the page, not behind a message.
  await expect(page.getByText(/KES \d/).first()).toBeAttached();
});

test("browsing: find a product, read about it and send the order to the distributor", async ({ page }) => {
  await page.goto("/");
  await page.locator("#top").getByRole("button", { name: /Browse products/ }).click();
  await page.getByPlaceholder("Search by name or ingredient").fill("probio");
  await page.locator("#products").getByRole("button", { name: /^Probio3, KES 3,900/ }).click();

  const detail = sheet(page);
  await expect(detail.getByRole("heading", { name: "Probio3" })).toBeVisible();
  for (const section of ["Often chosen for", "What's in it", "How it's taken", "What to expect", "Check before you buy"])
    await expect(detail.getByRole("heading", { name: section })).toBeVisible();
  await detail.getByRole("button", { name: /Add to order · KES 3,900/ }).click();
  await expect(page.getByRole("button", { name: "Your order: 1 item" })).toBeVisible();

  await page.getByRole("button", { name: "Your order: 1 item" }).click();
  await next(page, /Continue · KES 3,900/);
  await next(page, /Send order to Kate/);
  await expect(sheet(page).getByRole("alert")).toHaveText("Add your name so Kate knows who the order is from.");
  await sheet(page).getByLabel("Your name").fill("Wanjiru");
  await next(page, /Send order to Kate/);
  await expect(sheet(page).getByRole("alert")).toHaveText("Add your phone number so Kate can reach you about the order.");
  await sheet(page).getByLabel("Your phone number").fill("0712 34");
  await next(page, /Send order to Kate/);
  await expect(sheet(page).getByRole("alert")).toHaveText("That phone number doesn't look right. Try it like 0712 345 678.");
  await sheet(page).getByLabel("Your phone number").fill("0712 345 678");
  await pick(page, /^Within Nairobi/);
  await pick(page, "M-Pesa");
  await next(page, /Send order to Kate/);

  // A preview page shows the exact WhatsApp message instead of opening a chat.
  const message = sheet(page);
  await expect(message.getByText("Hi Kate, I'd like to order from your page.")).toBeVisible();
  await expect(message.getByText("1 × Probio3 · KES 3,900")).toBeVisible();
  await expect(message.getByText(/Within Nairobi \(delivery cost to confirm\)/)).toBeVisible();
  await expect(message.getByText(/Phone: 0712 345 678/)).toBeVisible();
  await expect(message.getByText(/Order ref: KC-[A-Z2-9]{4}/)).toBeVisible();
  await message.getByRole("button", { name: "Done" }).click();
  await expect(sheet(page).getByRole("heading", { name: "Now press send in WhatsApp." })).toBeVisible();
  await sheet(page).getByRole("button", { name: "Done" }).click();

  // Next time: the order is empty, and the last one is one tap away.
  await page.getByRole("button", { name: "Your order", exact: true }).click();
  await expect(sheet(page).getByText("Your order is empty.")).toBeVisible();
  await sheet(page).getByRole("button", { name: "Order the same again" }).click();
  await expect(sheet(page).getByText("Probio3")).toBeVisible();
});

test("help me choose: suggestions come with the reason, the price and a way to order", async ({ page }) => {
  await page.goto("/");
  await energyAndDigestion(page);
  const results = sheet(page);
  await expect(results.getByRole("heading", { name: "Wanjiru, here's what fits." })).toBeVisible();
  await expect(results.getByRole("heading", { name: "Based on what you told us" })).toBeVisible();
  await expect(results.getByText("Why this came up").first()).toBeVisible();
  await expect(results.getByText("Your main goal is energy, followed by digestion.")).toBeVisible();
  await expect(results.getByRole("heading", { name: "Want to talk it through?" })).toBeVisible();

  await results.getByRole("button", { name: "Add the whole plan" }).click();
  const order = sheet(page);
  await expect(order.getByRole("heading", { name: "Your order" })).toBeVisible();
  await expect(order.getByText("Suggested for you")).toHaveCount(2);

  // The engine's own handoff message goes to the distributor.
  await order.getByRole("button", { name: "Close" }).click();
  await sheet(page).getByRole("button", { name: /Send to Kate on WhatsApp/ }).click();
  await expect(sheet(page).getByText("Hi Kate, I've just done the health check.")).toBeVisible();
  await sheet(page).getByRole("button", { name: "Done" }).click();

  // Back on the page, the result stays with the customer.
  await sheet(page).getByRole("button", { name: /^Close/ }).click();
  await expect(page.locator("#choose").getByText("Your suggestions")).toBeVisible();
});

test("safety: a product that doesn't suit is left out, and the reason is given", async ({ page }) => {
  await page.goto("/");
  await openSelector(page);
  await basics(page, { name: "Amani", age: 62 });
  await tick(page, /^Joints/, /^Energy/);
  await tick(page, /Pain when I walk/);
  await pick(page, "More than a year");
  await pick(page, "No");
  await pick(page, "2 of 5");
  await tick(page, "Mid-afternoon");
  await dailyLife(page);
  await safety(page, { medications: ["Blood pressure medicine"], restrictions: [/I avoid pork/] });

  const results = sheet(page);
  await expect(results.getByText("Check with your doctor or pharmacist first")).toBeVisible();
  await expect(results.getByRole("heading", { name: "What we left out, and why" })).toBeVisible();
  await expect(results.getByText("One of its ingredients comes from pork, which you avoid.")).toBeVisible();
  await expect(results.getByRole("heading", { name: "ArthroXtra Tablets" })).toBeVisible();
});

test("pregnancy: clinic first, and nothing is offered for sale", async ({ page }) => {
  await page.goto("/");
  await openSelector(page);
  await basics(page, { name: "Amina", pregnancy: "Pregnant" });
  await tick(page, /^Energy/);
  await pick(page, "2 of 5");
  await tick(page, "Mid-afternoon");
  await dailyLife(page);
  await safety(page);
  const results = sheet(page);
  await expect(results.getByRole("heading", { name: "Amina, let's start with your clinic." })).toBeVisible();
  await expect(results.getByText("Speak to your clinic first")).toBeVisible();
  await expect(results.getByRole("button", { name: "Add to order" })).toHaveCount(0);
});

test("a goal picked on the page is already chosen when the questions reach it", async ({ page }) => {
  await page.goto("/");
  await page.locator("#choose").getByRole("button", { name: /^Joints & bones/ }).click();
  await basics(page, { name: "Otieno", sex: "Male", age: 50 });
  await expect(sheet(page).getByRole("checkbox", { name: /Joints & bones/ })).toHaveAttribute("aria-checked", "true");
});

test("products have their own links, and the back button closes a sheet instead of leaving", async ({ page }) => {
  await page.goto("/?p=probio3");
  await expect(sheet(page).getByRole("heading", { name: "Probio3" })).toBeVisible();
  await sheet(page).getByRole("button", { name: "Close" }).first().click();
  await expect(page).toHaveURL(/\/$/);

  await page.locator("#products").getByRole("button", { name: /^Refined Yunzhi Essence, KES/ }).click();
  await expect(page).toHaveURL(/\?p=refined-yunzhi/);
  await page.goBack();
  await expect(page.locator("[data-sheet]")).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("closing stacked sheets quickly never reopens one, and back closes the selector", async ({ page }) => {
  await page.goto("/");
  await energyAndDigestion(page);
  await sheet(page).getByRole("button", { name: "Add the whole plan" }).click();
  await expect(sheet(page).getByRole("heading", { name: "Your order" })).toBeVisible();
  // Two closes back to back, before the first history step has landed.
  await sheet(page).getByRole("button", { name: "Close" }).click();
  await page.locator("[data-sheet]").first().getByRole("button", { name: /^Close/ }).click();
  await expect(page.locator("[data-sheet]")).toHaveCount(0);
  await page.waitForTimeout(500);
  await expect(page.locator("[data-sheet]")).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);

  // The phone's back button closes the selector rather than leaving the page.
  await page.locator("#choose").getByRole("button", { name: /Why these came up/ }).click();
  await expect(sheet(page).getByRole("heading", { name: /here's what fits/ })).toBeVisible();
  await page.goBack();
  await expect(page.locator("[data-sheet]")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("small phones: nothing is wider than the screen, on the page or in a sheet", async ({ browser }, info) => {
  test.skip(info.project.name !== "mobile", "phones only");
  const ctx = await browser.newContext({ ...devices["Pixel 7"], viewport: { width: 360, height: 740 }, baseURL: info.project.use.baseURL });
  const page = await ctx.newPage();
  await page.goto("/");
  expect(await fitsWidth(page), "page").toEqual([]);
  await page.goto("/?p=youth-essence");
  await expect(sheet(page).getByRole("heading", { name: "Youth Essence Skincare" })).toBeVisible();
  expect(await fitsWidth(page), "product").toEqual([]);
  await page.goto("/");
  await energyAndDigestion(page);
  expect(await fitsWidth(page), "results").toEqual([]);
  await sheet(page).getByRole("button", { name: "Add the whole plan" }).click();
  await next(page, /Continue · KES/);
  expect(await fitsWidth(page), "order").toEqual([]);
  // The page itself once it's showing the customer's suggestions.
  await sheet(page).getByRole("button", { name: "Close" }).click();
  await sheet(page).getByRole("button", { name: /^Close/ }).click();
  await expect(page.locator("#choose").getByText("Your suggestions")).toBeVisible();
  expect(await fitsWidth(page), "page with a result").toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await ctx.close();
});

test.describe("order API", () => {
  const details = { name: "Wanjiru", phone: "0712 345 678", receive: "delivery", areaId: "nairobi", payment: "mpesa" };

  test("prices come from the price list, never from the browser", async ({ request }) => {
    const res = await request.post("/api/orders", {
      data: { slug: "kate", ref: "KC-AB23", items: [{ id: "probio3", qty: 2, price: 1 }], details },
    });
    expect(res.ok()).toBe(true);
    expect(await res.json()).toMatchObject({ ok: true, ref: "KC-AB23", total: 7800, totalConfirmed: false, filed: false, forwarded: false });
  });

  test("turns away orders that can't be right", async ({ request }) => {
    const post = (data: object) => request.post("/api/orders", { data });
    expect((await post({ slug: "nobody", ref: "KC-AB23", items: [], details })).status()).toBe(404);
    expect((await post({ slug: "kate", ref: "nope", items: [{ id: "probio3", qty: 1 }], details })).status()).toBe(400);
    expect((await post({ slug: "kate", ref: "KC-AB23", items: [{ id: "probio3", qty: 1 }], details: { ...details, name: "" } })).status()).toBe(422);
    expect((await post({ slug: "kate", ref: "KC-AB23", items: [{ id: "probio3", qty: 1 }], details: { ...details, phone: "12" } })).status()).toBe(422);
    expect((await post({ slug: "kate", ref: "KC-AB23", items: [{ id: "not-sold", qty: 1 }], details })).status()).toBe(422);
  });

  test("leads are only passed on from a live, connected storefront", async ({ request }) => {
    const bad = await request.post("/api/leads", { data: { slug: "kate", answers: {}, ref: "bad" } });
    expect(bad.status()).toBe(400);
    const ok = await request.post("/api/leads", { data: { slug: "kate", answers: { first_name: "Wanjiru" }, ref: "SA-AB23" } });
    expect(await ok.json()).toEqual({ ok: true, forwarded: false });
  });
});
