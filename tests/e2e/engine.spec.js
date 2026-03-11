const { test, expect } = require("@playwright/test");

const APP_URL = "/rtp_drillz_web_embedded.html";

async function snapshot(page) {
  return page.evaluate(() => window.__rtpTestHooks.snapshot());
}

function assertLegalSurfaceFollowsHoldemRules(legal) {
  expect(typeof legal.fold).toBe("boolean");
  expect(typeof legal.check).toBe("boolean");
  expect(typeof legal.call).toBe("boolean");
  expect(typeof legal.bet).toBe("boolean");
  expect(typeof legal.raise).toBe("boolean");
  expect(typeof legal.allIn).toBe("boolean");
  expect(Number.isFinite(legal.toCall)).toBe(true);
  expect(Number.isFinite(legal.minRaiseTo)).toBe(true);
  expect(Number.isFinite(legal.maxCommit)).toBe(true);

  if (legal.toCall === 0) {
    expect(legal.check).toBe(true);
    expect(legal.call).toBe(false);
    expect(legal.bet).toBe(true);
    expect(legal.raise).toBe(false);
  } else {
    expect(legal.check).toBe(false);
    expect(legal.bet).toBe(false);
    expect(legal.call).toBe(true);
  }

  if (legal.raise) {
    expect(legal.toCall).toBeGreaterThan(0);
    expect(legal.minRaiseTo).toBeGreaterThan(legal.toCall);
    expect(legal.maxCommit).toBeGreaterThanOrEqual(legal.minRaiseTo);
  }

  expect(legal.allIn).toBe(true);
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

test("engine supports 3bp ip facing a random earlier-position opener", async ({ page }) => {
  await page.goto(APP_URL);

  await page.evaluate(() =>
    window.__rtpTestHooks.configure({
      spotType: "3BP",
      position: "IP",
      stacks: "100BB",
      preflopFlow: "play",
      smallBlind: 5,
      bigBlind: 10
    })
  );
  await page.evaluate(() => window.__rtpTestHooks.setScenarioRandomSequence([0.2, 0.5]));

  await page.evaluate(() => window.__rtpTestHooks.dealHand());
  let state = await snapshot(page);

  expect(state.stage).toBe("hand");
  expect(state.heroPosition).toBe("BTN");
  expect(state.tableState.actionSeat).toBe(state.heroSeat);
  expect(state.tableState.pot).toBe(45);
  expect(state.players.find((player) => player.position === "HJ").committedStreet).toBe(30);

  await page.evaluate(() => window.__rtpTestHooks.actHero("raise", 90));
  state = await snapshot(page);

  expect(state.stage).toBe("flop");
  expect(state.tableState.actionSeat).toBe(state.heroSeat);
  expect(state.tableState.pot).toBe(195);
  expect(state.legalHero.toCall).toBe(0);
  expect(state.legalHero.check).toBe(true);
  expect(state.players.find((player) => player.position === "HJ").committedHand).toBe(90);
});

test("engine can still deal the button-open versus bb-3bet branch through 3bp ip skip flow", async ({ page }) => {
  await page.goto(APP_URL);

  await page.evaluate(() =>
    window.__rtpTestHooks.configure({
      spotType: "3BP",
      position: "IP",
      stacks: "100BB",
      preflopFlow: "skip",
      smallBlind: 5,
      bigBlind: 10
    })
  );
  await page.evaluate(() => window.__rtpTestHooks.setScenarioRandomSequence([0.95]));

  await page.evaluate(() => window.__rtpTestHooks.dealHand());
  const state = await snapshot(page);

  expect(state.stage).toBe("flop");
  expect(state.heroPosition).toBe("BTN");
  expect(state.tableState.pot).toBe(205);
  expect(state.tableState.actionSeat).toBe(state.heroSeat);
  expect(state.legalHero.toCall).toBe(0);
  expect(state.legalHero.check).toBe(true);
  expect(state.players.find((player) => player.position === "BB").committedHand).toBe(100);
});

test("blind changes reset to a fresh predeal state at 200bb", async ({ page }) => {
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
  await expect(page.locator("#status")).toContainText("Flop | Hero");

  await page.locator("#bigBlindInput").fill("25");
  await page.locator("#bigBlindInput").press("Tab");

  const state = await snapshot(page);

  expect(state.stage).toBe("start");
  expect(state.hand).toEqual([]);
  expect(state.board).toEqual([]);
  expect(state.config.bigBlind).toBe(25);
  expect(state.config.stacks).toBe("200BB");
  expect(state.tableState.actionSeat).toBe(-1);
  expect(state.tableState.pot).toBe(35);
  expect(state.actionLog).toEqual([]);
  expect(state.players.every((player) => player.stackStart === 5000)).toBe(true);
  expect(state.players.find((player) => player.position === "SB").stack).toBe(4990);
  expect(state.players.find((player) => player.position === "BB").stack).toBe(4975);
});

test("effective stack preset reset overwrites manual stack edits", async ({ page }) => {
  await page.goto(APP_URL);

  await page.evaluate(() =>
    window.__rtpTestHooks.configure({
      spotType: "SRP",
      position: "IP",
      stacks: "100BB",
      preflopFlow: "play",
      smallBlind: 5,
      bigBlind: 10
    })
  );

  await page.locator("#stackEditorToggle").click();
  await page.locator('[data-stack-seat="0"]').fill("777");
  await page.locator('[data-stack-seat="0"]').press("Tab");

  let state = await snapshot(page);
  expect(state.players.find((player) => player.seat === 0).stackStart).toBe(777);

  await page.evaluate(() => window.__rtpTestHooks.dealHand());
  await expect(page.locator("#status")).toContainText("Preflop | Hero");

  await page.locator('[data-config-group="stacks"][data-config-value="300BB"]').click();
  state = await snapshot(page);

  expect(state.stage).toBe("start");
  expect(state.hand).toEqual([]);
  expect(state.board).toEqual([]);
  expect(state.config.stacks).toBe("300BB");
  expect(state.tableState.actionSeat).toBe(-1);
  expect(state.tableState.pot).toBe(15);
  expect(state.players.every((player) => player.stackStart === 3000)).toBe(true);
  expect(state.players.find((player) => player.position === "SB").stack).toBe(2995);
  expect(state.players.find((player) => player.position === "BB").stack).toBe(2990);
});

test("spot selectors immediately sync predeal hero seat, button, and blind preview", async ({ page }) => {
  await page.goto(APP_URL);

  await page.evaluate(() =>
    window.__rtpTestHooks.configure({
      spotType: "SRP",
      position: "IP",
      stacks: "100BB",
      preflopFlow: "play",
      smallBlind: 5,
      bigBlind: 10
    })
  );

  let state = await snapshot(page);
  expect(state.stage).toBe("start");
  expect(state.heroPosition).toBe("BTN");
  expect(state.tableState.actionSeat).toBe(-1);
  expect(state.tableState.pot).toBe(15);
  expect(state.players.find((player) => player.position === "SB").stack).toBe(995);
  expect(state.players.find((player) => player.position === "BB").stack).toBe(990);

  await page.locator('[data-config-group="position"][data-config-value="OOP"]').click();
  state = await snapshot(page);

  expect(state.stage).toBe("start");
  expect(state.heroPosition).toBe("BB");
  expect(state.tableState.actionSeat).toBe(-1);
  expect(state.tableState.pot).toBe(15);
  expect(state.players.find((player) => player.seat === state.heroSeat).stack).toBe(990);
  expect(state.players.find((player) => player.position === "BTN").stack).toBe(1000);
  expect(state.players.find((player) => player.position === "SB").stack).toBe(995);
});

test("ip lines auto-check through flop turn and river when villain is first to act", async ({ page }) => {
  await page.goto(APP_URL);

  await page.evaluate(() =>
    window.__rtpTestHooks.configure({
      spotType: "SRP",
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

  await page.evaluate(() => window.__rtpTestHooks.actHero("call"));
  state = await snapshot(page);

  expect(state.stage).toBe("flop");
  expect(state.tableState.actionSeat).toBe(state.heroSeat);
  expect(
    state.actionLog.filter((entry) => entry.street === "flop" && entry.seat !== state.heroSeat && entry.action === "check")
  ).toHaveLength(1);

  await page.evaluate(() => window.__rtpTestHooks.actHero("check"));
  state = await snapshot(page);

  expect(state.stage).toBe("turn");
  expect(state.tableState.actionSeat).toBe(state.heroSeat);
  expect(
    state.actionLog.filter((entry) => entry.street === "turn" && entry.seat !== state.heroSeat && entry.action === "check")
  ).toHaveLength(1);

  await page.evaluate(() => window.__rtpTestHooks.actHero("check"));
  state = await snapshot(page);

  expect(state.stage).toBe("river");
  expect(state.tableState.actionSeat).toBe(state.heroSeat);
  expect(
    state.actionLog.filter((entry) => entry.street === "river" && entry.seat !== state.heroSeat && entry.action === "check")
  ).toHaveLength(1);

  await page.evaluate(() => window.__rtpTestHooks.actHero("check"));
  state = await snapshot(page);

  expect(state.stage).toBe("done");
  expect(state.tableState.pot).toBe(25);
  expect(
    state.actionLog.filter((entry) => entry.seat === state.heroSeat && entry.action === "check" && entry.street !== "preflop")
  ).toHaveLength(3);
});

test("legal hero actions remain consistent after facing a postflop raise", async ({ page }) => {
  await page.goto(APP_URL);

  await page.evaluate(() =>
    window.__rtpTestHooks.configure({
      spotType: "SRP",
      position: "IP",
      stacks: "100BB",
      preflopFlow: "play",
      smallBlind: 5,
      bigBlind: 10
    })
  );

  await page.evaluate(() => window.__rtpTestHooks.dealHand());
  let state = await snapshot(page);
  assertLegalSurfaceFollowsHoldemRules(state.legalHero);

  await page.evaluate(() => window.__rtpTestHooks.actHero("call"));

  state = await snapshot(page);
  expect(state.stage).toBe("flop");
  assertLegalSurfaceFollowsHoldemRules(state.legalHero);
  expect(state.legalHero.check).toBe(true);
  expect(state.legalHero.call).toBe(false);
  expect(state.legalHero.bet).toBe(true);
  expect(state.legalHero.raise).toBe(false);

  await page.evaluate(() => window.__rtpTestHooks.actSeat("BTN", "bet", 80));
  const villainLegal = await page.evaluate(() => window.__rtpTestHooks.legalForSeat("BB"));
  assertLegalSurfaceFollowsHoldemRules(villainLegal);
  state = await snapshot(page);
  expect(state.tableState.actionSeat).toBe(state.players.find((player) => player.position === "BB").seat);

  await page.evaluate(() => window.__rtpTestHooks.actSeat("BB", "raise", 160));
  state = await snapshot(page);

  expect(state.tableState.actionSeat).toBe(state.heroSeat);
  assertLegalSurfaceFollowsHoldemRules(state.legalHero);
  expect(state.legalHero.toCall).toBe(80);
  expect(state.legalHero.check).toBe(false);
  expect(state.legalHero.call).toBe(true);
  expect(state.legalHero.bet).toBe(false);
  expect(state.legalHero.raise).toBe(true);
  expect(state.legalHero.minRaiseTo).toBe(240);
  expect(state.legalHero.maxCommit).toBe(990);
});
