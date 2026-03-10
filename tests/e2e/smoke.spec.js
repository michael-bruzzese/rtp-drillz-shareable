const { test, expect } = require("@playwright/test");

const APP_URL = "/rtp_drillz_web_embedded.html";

const CARD_SEQUENCE_ONE = ["As", "Kh", "Qd", "Jc", "Ts", "9h", "2c"];
const CARD_SEQUENCE_TWO = ["Ad", "Kc", "7s", "7d", "7c", "2h", "3h"];
const CARD_SEQUENCE_THREE = ["Qh", "Qs", "Ah", "Kd", "Tc", "8d", "4c"];

async function setMode(page, modeValue) {
  await page.locator("#modeSelect").selectOption(modeValue);
}

async function openHandBuilder(page) {
  await page.locator("#inputHandBtn").click();
  await expect(page.locator("#handBuilderModal")).toHaveClass(/show/);
}

async function fillBuilderWithCards(page, cards) {
  for (const card of cards) {
    await page.locator(`.builder-card-btn[data-card="${card}"]`).click();
  }
}

async function fillBuilderSlot(page, slotName, card) {
  await page.locator(`[data-builder-slot="${slotName}"]`).click();
  await page.locator(`.builder-card-btn[data-card="${card}"]`).click();
}

async function applyBuilder(page) {
  await page.locator("#builderApplyBtn").click();
  await expect(page.locator("#handBuilderModal")).not.toHaveClass(/show/);
}

test("replay mode card builder updates manual summary and deals hand", async ({ page }) => {
  await page.goto(APP_URL);
  await setMode(page, "replay");

  await expect(page.locator("#manualPanel")).toHaveClass(/show/);
  await openHandBuilder(page);
  await fillBuilderWithCards(page, CARD_SEQUENCE_ONE);
  await applyBuilder(page);

  await expect(page.locator("#manualSummary")).toContainText("Hero Hole Cards: As Kh");
  await expect(page.locator("#manualSummary")).toContainText("Flop: Qd Jc Ts");
  await expect(page.locator("#manualSummary")).toContainText("Turn: 9h");
  await expect(page.locator("#manualSummary")).toContainText("River: 2c");
  await expect(page.locator("#manualReadyState")).toContainText("Ready:");
  await expect(page.locator("#manualReadyState")).toContainText("Deal");

  await page.locator("nav#controls button.primary").click();
  await expect(page.locator("#handCards .card-shell")).toHaveCount(2);
  await expect(page.locator("#seatMap .seat-chip")).toHaveCount(6);
  await page.locator("nav#controls .action-size-wrap input[type='number']").fill("80");
  await page.locator("nav#controls .action-size-wrap input[type='number']").press("Tab");
  await page.locator("nav#controls button", { hasText: /^Raise To 80$/ }).click();
  await expect(page.locator("#status")).toContainText("Flop | Hero");
  await expect(page.locator("#potDisplay")).toContainText("Pot");
  await expect(page.locator("#boardCards .card-shell")).toHaveCount(3);
});

test("postflop hero raise does not immediately offer another raise option", async ({ page }) => {
  await page.goto(APP_URL);
  await setMode(page, "replay");

  await openHandBuilder(page);
  await fillBuilderWithCards(page, CARD_SEQUENCE_ONE);
  await applyBuilder(page);

  await page.locator("nav#controls button.primary").click();
  await page.evaluate(() => window.__rtpTestHooks.actHero("raise", 160));
  await expect(page.locator("#status")).toContainText("Flop | Hero");
  await page.evaluate(() => window.__rtpTestHooks.actHero("bet", 320));

  await expect(page.locator("#status")).toContainText("Done");
  await expect(page.locator("nav#controls button", { hasText: /^Raise To \d+$/ })).toHaveCount(0);
  await expect(page.locator("nav#controls button.primary")).toHaveText("Deal");
});

test("session queue supports naming, export/import, and next-hand progression", async ({ page }) => {
  await page.goto(APP_URL);
  await setMode(page, "replay");

  await page.locator("#sessionNameInput").fill("Coach Pack Alpha");

  await openHandBuilder(page);
  await fillBuilderWithCards(page, CARD_SEQUENCE_TWO);
  await applyBuilder(page);
  await page.locator("#addSessionHandBtn").click();

  await openHandBuilder(page);
  await fillBuilderWithCards(page, CARD_SEQUENCE_THREE);
  await applyBuilder(page);
  await page.locator("#addSessionHandBtn").click();

  await expect(page.locator("#sessionMeta")).toContainText("2 / 10");

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#exportSessionBtn").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain("coach-pack-alpha");

  const importPayload = {
    version: 1,
    session_name: "Imported Drill",
    hands: [
      {
        hand1: "As",
        hand2: "Kd",
        flop1: "Qh",
        flop2: "Jh",
        flop3: "Th",
        turn: "2c",
        river: "3d",
        seat2card1: "Ac",
        seat2card2: "Ad"
      },
      {
        hand1: "Ad",
        hand2: "Qc",
        flop1: "7h",
        flop2: "7c",
        flop3: "7s",
        turn: "2d",
        river: "3c"
      }
    ]
  };

  await page.locator("#clearSessionBtn").click();
  await expect(page.locator("#sessionMeta")).toContainText("0 / 10");

  await page.locator("#importSessionInput").setInputFiles({
    name: "imported-session.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(importPayload))
  });

  await expect(page.locator("#sessionNameInput")).toHaveValue("Imported Drill");
  await expect(page.locator("#sessionMeta")).toContainText("2 / 10");

  await page.locator("#startSessionBtn").click();
  await expect(page.locator("#manualSummary")).toContainText("Hero Hole Cards: As Kd");
  await expect(page.locator("#manualSummary")).toContainText("Villains Locked: 1 seat");
  await expect(page.locator("#sessionMeta")).toContainText("Running 1/2");

  // Fold preflop, then deal again to advance to the next queued hand.
  await page.locator("nav#controls button.primary").click(); // Deal -> preflop
  await page.locator("nav#controls button", { hasText: /^Fold$/ }).click();
  await expect(page.locator("#status")).toContainText("Done");
  await page.locator("nav#controls button.primary").click(); // Deal (advance queue)

  await expect(page.locator("#manualSummary")).toContainText("Hero Hole Cards: Ad Qc");
  await expect(page.locator("#sessionMeta")).toContainText("Running 2/2");
});

test("replay keeps villain hole cards hidden until showdown", async ({ page }) => {
  await page.goto(APP_URL);
  await setMode(page, "replay");

  await openHandBuilder(page);
  await fillBuilderWithCards(page, CARD_SEQUENCE_ONE);
  await page.locator("#builderVillains summary").click();
  await fillBuilderSlot(page, "seat2card1", "Ac");
  await fillBuilderSlot(page, "seat2card2", "Ad");
  await applyBuilder(page);

  await expect(page.locator("#manualSummary")).toContainText("Villains Locked: 1 seat");

  await page.locator("nav#controls button.primary").click();
  await expect(page.locator("#seatMap")).toContainText("Cards locked");
  await expect(page.locator("#seatMap")).not.toContainText("Ac Ad");

  await page.evaluate(() => window.__rtpTestHooks.actHero("raise", 160));
  await expect(page.locator("#seatMap")).not.toContainText("Ac Ad");
  await page.evaluate(() => window.__rtpTestHooks.actHero("check"));
  await page.evaluate(() => window.__rtpTestHooks.actHero("check"));
  await page.evaluate(() => window.__rtpTestHooks.actHero("check"));

  await expect(page.locator("#status")).toContainText("Done");
  await expect(page.locator("#seatMap")).toContainText("Ac Ad");
});

test("capture toggle switches UI mode cleanly", async ({ page }) => {
  await page.goto(APP_URL);

  await expect(page.locator("body")).toHaveClass(/capture-off/);
  await expect(page.locator("#recStateText")).toContainText("Capture off");

  await page.locator("#captureSelect").selectOption("on");
  await expect(page.locator("body")).not.toHaveClass(/capture-off/);
  await expect(page.locator("#preflightCameraState")).not.toHaveText("");
  await expect(page.locator("#preflightMicState")).not.toHaveText("");
  await expect(page.locator("#preflightDownloadState")).toContainText(/Supported|Unsupported/);
  await expect(page.locator("#timelineList")).toContainText("Markers appear here once recording starts.");

  await page.locator("#captureSelect").selectOption("off");
  await expect(page.locator("body")).toHaveClass(/capture-off/);
  await expect(page.locator("#recStateText")).toContainText("Capture off");
});
