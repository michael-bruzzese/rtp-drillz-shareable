const { test, expect } = require("@playwright/test");

const REALISTIC_APP_URL = "/rtp_drillz_web_embedded.html?realistic=1";

async function snapshot(page) {
  return page.evaluate(() => window.__rtpTestHooks.snapshot());
}

async function dealIntoRealisticPreflop(page) {
  await page.goto(REALISTIC_APP_URL);
  await page.locator("nav#controls button.primary").click();
  await expect(page.locator("#status")).toContainText("Preflop | Hero");
  await expect(page.locator("#potDisplay")).toContainText("Pot");
  await expect(page.locator("nav#controls button", { hasText: /^Deal Flop$/ })).toHaveCount(0);
}

test("realistic mode shows legal hero actions and hides legacy deal controls", async ({ page }) => {
  await dealIntoRealisticPreflop(page);

  const potText = await page.locator("#potDisplay").innerText();
  const potMatch = potText.match(/Pot (\d+)/);
  expect(potMatch).not.toBeNull();
  expect(Number(potMatch[1])).toBeGreaterThanOrEqual(15);

  await expect(page.locator("nav#controls button", { hasText: /^Fold$/ })).toHaveCount(1);
  await expect(page.locator("nav#controls button", { hasText: /^Call \d+$/ })).toHaveCount(1);
  await expect(page.locator("nav#controls button", { hasText: /^Check$/ })).toHaveCount(0);
  await expect(page.locator("nav#controls .action-size-wrap")).toHaveCount(1);
  await expect(page.locator("#seatMap .dealer-button")).toHaveCount(1);
});

test("realistic sizing controls keep slider and numeric input in sync", async ({ page }) => {
  await dealIntoRealisticPreflop(page);

  const numberInput = page.locator("nav#controls .action-size-wrap input[type='number']");
  const sliderInput = page.locator("nav#controls .action-size-wrap input[type='range']");
  const readout = page.locator("nav#controls .action-size-wrap .action-size-readout");

  await numberInput.fill("155");
  await numberInput.press("Tab");
  await expect(numberInput).toHaveValue("160");
  await expect(sliderInput).toHaveValue("160");
  await expect(readout).toHaveText("16bb");

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

  await expect(page.locator("#status")).toContainText("Flop | Hero");
  await expect(page.locator("#potDisplay")).toContainText("Pot");
  await expect(page.locator("#boardCards .card-shell")).toHaveCount(3);
  await expect(page.locator("nav#controls button", { hasText: /^Deal Turn$/ })).toHaveCount(0);
  await expect(page.locator("nav#controls button", { hasText: /^Check$/ })).toHaveCount(1);
  await expect(page.locator("nav#controls button", { hasText: /^Call \d+$/ })).toHaveCount(0);
});

test("realistic mode keeps a preflop New Hand utility reset available", async ({ page }) => {
  await dealIntoRealisticPreflop(page);

  const before = await snapshot(page);
  await expect(page.locator("#heroUtilityControls button", { hasText: /^New Hand$/ })).toHaveCount(1);

  await page.locator("#heroUtilityControls button", { hasText: /^New Hand$/ }).click();

  const after = await snapshot(page);
  expect(after.stage).toBe("hand");
  expect(after.board).toEqual([]);
  expect(after.hand).toHaveLength(2);
  expect(after.tableState.handNumber).toBeGreaterThan(before.tableState.handNumber);
  await expect(page.locator("#status")).toContainText("Preflop | Hero");
});

test("predeal blind badges show before Deal and disappear on the flop", async ({ page }) => {
  await page.goto(REALISTIC_APP_URL);

  await expect(page.locator("#seatMap .seat-chip-badge", { hasText: /^SB$/ })).toHaveCount(1);
  await expect(page.locator("#seatMap .seat-chip-badge", { hasText: /^BB$/ })).toHaveCount(1);

  await page.locator("nav#controls button.primary").click();
  await expect(page.locator("#seatMap .seat-chip-badge", { hasText: /^SB$/ })).toHaveCount(1);
  await expect(page.locator("#seatMap .seat-chip-badge", { hasText: /^BB$/ })).toHaveCount(1);

  await page.locator("nav#controls button", { hasText: /^Call \d+$/ }).first().click();
  await expect(page.locator("#status")).toContainText("Flop | Hero");
  await expect(page.locator("#seatMap .seat-chip-badge", { hasText: /^SB$/ })).toHaveCount(0);
  await expect(page.locator("#seatMap .seat-chip-badge", { hasText: /^BB$/ })).toHaveCount(0);
});

test("table action callouts render readable action text", async ({ page }) => {
  await dealIntoRealisticPreflop(page);

  await page.locator("nav#controls button", { hasText: /^Call \d+$/ }).first().click();
  await expect(page.locator("#seatMap .seat-action-callout", { hasText: /^Call$/ })).toHaveCount(1);

  await page.evaluate(() => window.__rtpTestHooks.actHero("bet", 80));
  await expect(page.locator("#seatMap .seat-action-callout", { hasText: /^Bet 80$/ })).toHaveCount(1);
});

test("live mode shows villain call before the next street and check after it arrives", async ({ page }) => {
  await dealIntoRealisticPreflop(page);

  await page.locator("nav#controls button", { hasText: /^Call \d+$/ }).first().click();
  await page.locator("nav#controls .action-size-wrap input[type='number']").fill("80");
  await page.locator("nav#controls .action-size-wrap input[type='number']").press("Tab");
  await page.locator("nav#controls button", { hasText: /^Bet To 80$/ }).click();

  await expect(page.locator("#status")).toContainText("Flop |");
  await expect(page.locator("#seatMap .seat-action-callout", { hasText: /^Call$/ })).toHaveCount(1);
  await page.evaluate(() => {
    window.__rtpTestCalloutRef = document.querySelector("#seatMap .seat-action-callout");
  });

  await expect(page.locator("#status")).toContainText("Turn | Hero");
  await expect(page.locator("#seatMap .seat-action-callout", { hasText: /^Call$/ })).toHaveCount(1);
  const preservedCallout = await page.evaluate(
    () => document.querySelector("#seatMap .seat-action-callout") === window.__rtpTestCalloutRef
  );
  expect(preservedCallout).toBe(true);
  await expect(page.locator("#seatMap .seat-action-callout", { hasText: /^Check$/ })).toHaveCount(1);
});

test("hero still gets raise controls when facing a postflop raise", async ({ page }) => {
  await dealIntoRealisticPreflop(page);

  await page.locator("nav#controls button", { hasText: /^Call \d+$/ }).first().click();
  await page.evaluate(() => window.__rtpTestHooks.actSeat("BTN", "bet", 80));
  await page.evaluate(() => window.__rtpTestHooks.actSeat("BB", "raise", 160));

  await expect(page.locator("nav#controls button", { hasText: /^Fold$/ })).toHaveCount(1);
  await expect(page.locator("nav#controls button", { hasText: /^Call 80$/ })).toHaveCount(1);
  await expect(page.locator("nav#controls button", { hasText: /^Raise To 240$/ })).toHaveCount(1);
});

test("live mode villain only checks and calls on flop turn and river", async ({ page }) => {
  await dealIntoRealisticPreflop(page);

  await page.evaluate(() => window.__rtpTestHooks.actHero("call"));
  await expect(page.locator("#status")).toContainText("Flop | Hero");

  await page.evaluate(() => window.__rtpTestHooks.actHero("bet", 80));
  await expect(page.locator("#status")).toContainText("Turn | Hero");

  await page.evaluate(() => window.__rtpTestHooks.actHero("bet", 160));
  await expect(page.locator("#status")).toContainText("River | Hero");

  await page.evaluate(() => window.__rtpTestHooks.actHero("bet", 320));
  await expect(page.locator("#status")).toContainText("Done");

  const state = await snapshot(page);
  const villainSeat = state.players.find((player) => player.seat !== state.heroSeat && player.status !== "folded").seat;
  const villainPostflopActions = state.actionLog.filter(
    (entry) => entry.seat === villainSeat && entry.street !== "preflop"
  );

  expect(villainPostflopActions.map((entry) => entry.action)).toEqual([
    "check",
    "call",
    "check",
    "call",
    "check",
    "call"
  ]);
});

test("open versus big blind 3-bet selector stays IP and deals hero facing the 3-bet", async ({ page }) => {
  await page.goto(REALISTIC_APP_URL);

  await page.locator('[data-config-group="position"][data-config-value="OOP"]').click();
  await page.locator('[data-config-group="spotType"][data-config-value="OPENBB3B"]').click();

  await expect(page.locator('[data-config-group="position"][data-config-value="IP"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-config-group="position"][data-config-value="OOP"]')).toHaveAttribute("aria-pressed", "false");

  await page.locator("nav#controls button.primary").click();
  await expect(page.locator("#status")).toContainText("Preflop | Hero BTN Hero");
  await page.locator("nav#controls button", { hasText: /^Raise To 40$/ }).click();
  await expect(page.locator("nav#controls button", { hasText: /^Call 60$/ })).toHaveCount(1);
});
