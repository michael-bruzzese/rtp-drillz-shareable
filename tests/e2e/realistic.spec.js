const { test, expect } = require("@playwright/test");

const REALISTIC_APP_URL = "/rtp_drillz_web_embedded.html?realistic=1";

async function dealIntoRealisticPreflop(page) {
  await page.goto(REALISTIC_APP_URL);
  await page.locator("nav#controls button.primary").click();
  await expect(page.locator("#status")).toContainText("Preflop | Pot");
  await expect(page.locator("nav#controls button", { hasText: /^Deal Flop$/ })).toHaveCount(0);
}

test("realistic mode shows legal hero actions and hides legacy deal controls", async ({ page }) => {
  await dealIntoRealisticPreflop(page);

  const statusText = await page.locator("#status").innerText();
  const potMatch = statusText.match(/Pot (\d+)/);
  expect(potMatch).not.toBeNull();
  expect(Number(potMatch[1])).toBeGreaterThanOrEqual(15);

  await expect(page.locator("nav#controls button", { hasText: /^Fold$/ })).toHaveCount(1);
  await expect(page.locator("nav#controls button", { hasText: /^Call \d+$/ })).toHaveCount(1);
  await expect(page.locator("nav#controls button", { hasText: /^Check$/ })).toHaveCount(0);
  await expect(page.locator("nav#controls .action-size-wrap")).toHaveCount(1);
});

test("realistic sizing controls keep slider and numeric input in sync", async ({ page }) => {
  await dealIntoRealisticPreflop(page);

  const numberInput = page.locator("nav#controls .action-size-wrap input[type='number']");
  const sliderInput = page.locator("nav#controls .action-size-wrap input[type='range']");
  const readout = page.locator("nav#controls .action-size-wrap .action-size-readout");

  await numberInput.fill("150");
  await numberInput.press("Tab");
  await expect(sliderInput).toHaveValue("150");
  await expect(readout).toHaveText("15bb");

  await sliderInput.evaluate((el) => {
    el.value = "200";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });

  await expect(numberInput).toHaveValue("200");
  await expect(readout).toHaveText("20bb");
});

test("hero preflop call auto-progresses to flop realistic decision point", async ({ page }) => {
  await dealIntoRealisticPreflop(page);

  await page.locator("nav#controls button", { hasText: /^Call \d+$/ }).first().click();

  await expect(page.locator("#status")).toContainText("Flop | Pot");
  await expect(page.locator("#boardCards .card-shell")).toHaveCount(3);
  await expect(page.locator("nav#controls button", { hasText: /^Deal Turn$/ })).toHaveCount(0);
  await expect(page.locator("nav#controls button", { hasText: /^Call \d+$/ })).toHaveCount(1);
});

