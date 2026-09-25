import { expect, test } from "@playwright/test";
import { energyAndDigestion, next, sheet } from "./helpers";

/**
 * Screenshots for design review, not assertions. Run with:
 *   SCREENSHOTS=1 npx playwright test e2e/screenshots.spec.ts
 * Images land in test-results/screens/.
 */
test.skip(!process.env.SCREENSHOTS, "set SCREENSHOTS=1 to capture review screenshots");
test.use({ contextOptions: { reducedMotion: "reduce" } });

test("capture the key screens", async ({ page }, info) => {
  const shot = (name: string) => page.screenshot({ path: `test-results/screens/${info.project.name}-${name}.png` });
  await page.goto("/");
  await shot("01-first");
  await energyAndDigestion(page);
  await expect(sheet(page).getByRole("heading", { name: /here's what fits/ })).toBeVisible();
  await page.waitForTimeout(400);
  await shot("02-results");
  const scroller = sheet(page).locator(".overflow-y-auto").first();
  await scroller.evaluate((el) => el.scrollTo(0, 600));
  await shot("03-results-lead");
  await sheet(page).getByRole("button", { name: "Add the whole plan" }).click();
  await page.waitForTimeout(500);
  await shot("04-order");
  await next(page, /Continue · KES/);
  await shot("05-details");
  await sheet(page).getByRole("button", { name: "Close" }).click();
  await page.locator("[data-sheet]").first().getByRole("button", { name: /^Close/ }).click();
  await expect(page.locator("[data-sheet]")).toHaveCount(0);
  await page.waitForTimeout(300);
  await page.evaluate(() => document.getElementById("choose")!.scrollIntoView());
  await page.waitForTimeout(300);
  await shot("06-choose-with-result");
  for (const id of ["about", "closing"]) {
    await page.evaluate((id) => document.getElementById(id)!.scrollIntoView(), id);
    await page.waitForTimeout(300);
    await shot(`07-${id}`);
  }
});
