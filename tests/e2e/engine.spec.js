const { test, expect } = require("@playwright/test");

const APP_URL = "/rtp_drillz_web_embedded.html";

async function snapshot(page) {
  return page.evaluate(() => window.__rtpTestHooks.snapshot());
}

test("engine tracks configured blinds and single-raised pot accounting", async ({ page }) => {
  await page.goto(APP_URL);

  await page.evaluate(() =>
    window.__rtpTestHooks.configure({
      spotType: "SRP",
      position: "IP",
      stacks: "50BB",
      preflopFlow: "skip",
      smallBlind: 10,
      bigBlind: 20
    })
  );

  await page.evaluate(() => window.__rtpTestHooks.dealHand());
  const state = await snapshot(page);

  expect(state.stage).toBe("flop");
  expect(state.tableState.pot).toBe(170);
  expect(state.heroPosition).toBe("BTN");
  expect(state.players.find((player) => player.position === "BTN").stack).toBe(920);
  expect(state.players.find((player) => player.position === "BB").stack).toBe(920);
  expect(state.players.find((player) => player.position === "SB").stack).toBe(990);
  expect(state.legalHero.toCall).toBe(0);
  expect(state.legalHero.check).toBe(true);
});

test("engine preserves 4-bet IP structure and hero facing action", async ({ page }) => {
  await page.goto(APP_URL);

  await page.evaluate(() =>
    window.__rtpTestHooks.configure({
      spotType: "4BP",
      position: "IP",
      stacks: "100BB",
      preflopFlow: "play",
      smallBlind: 5,
      bigBlind: 10
    })
  );

  await page.evaluate(() => window.__rtpTestHooks.dealHand());
  let state = await snapshot(page);

  expect(state.stage).toBe("hand");
  expect(state.heroPosition).toBe("BTN");
  expect(state.tableState.actionSeat).toBe(state.heroSeat);
  expect(state.tableState.pot).toBe(45);
  expect(state.legalHero.raise).toBe(true);

  await page.evaluate(() => window.__rtpTestHooks.actHero("raise", 100));
  state = await snapshot(page);

  expect(state.stage).toBe("hand");
  expect(state.tableState.pot).toBe(365);
  expect(state.legalHero.toCall).toBe(150);
  expect(state.tableState.actionSeat).toBe(state.heroSeat);

  await page.evaluate(() => window.__rtpTestHooks.actHero("call"));
  state = await snapshot(page);

  expect(state.stage).toBe("flop");
  expect(state.tableState.pot).toBe(515);
  expect(state.legalHero.toCall).toBe(0);
  expect(state.legalHero.check).toBe(true);
  expect(state.tableState.streetSnapshots).toContain("flop");
});
