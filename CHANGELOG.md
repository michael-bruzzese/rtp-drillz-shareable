# Changelog

## 2026-03-11
- Added a new `Open / BB 3B` preflop branch where hero opens the button, the small blind folds, and the big blind 3-bets back to hero.
- Added silent selector auto-correction so `Open / BB 3B` always resolves to the intended `IP` branch.
- Restored the realistic-mode preflop `New Hand` / reset utility control.
- Added one shared fresh-predeal reset path for:
  - `New Hand`
  - blind-size changes
  - effective-stack preset changes
- Made blind-size changes reset all seats to `200bb` by default from the new big blind.
- Made effective-stack preset changes overwrite manual stack edits and reset to a fresh predeal state.
- Made setup selectors immediately drive predeal seat/button/blind preview state.
- Corrected `SRP OOP` default mapping so hero is in the big blind facing a button open.
- Added predeal/preflop `SB` / `BB` seat badges and made them disappear once the hand reaches the flop.
- Added lightweight per-seat action callouts on the table.
- Expanded Playwright coverage for:
  - the new `Open / BB 3B` branch in both `play` and `skip` flows
  - reset/new-hand behavior
  - blind/preset reset behavior
  - selector-driven seat/button synchronization
  - predeal blind-marker lifecycle
  - IP/OOP auto-check behavior across streets
  - action callout rendering
  - replay fold/checkdown/showdown paths

## 2026-03-10
- Moved both `Live Drill` and `Hand Replay` onto the shared six-max table engine.
- Added blind configuration inputs (`SB` / `BB`) and per-seat stack editing before the hand.
- Added visible six-seat table HUD with button, acting-player, stack, and committed-chip state.
- Replaced the old `PFR/PFC` row with `Play Pre` / `Skip To Flop` live-drill setup.
- Added deterministic preflop scenario scripting for `SRP`, `3BP`, and `4BP`.
- Added default preflop skip lines for live mode so drills can jump directly to flop action.
- Added street snapshots so `New Flop`, `New Turn`, and `New River` restore pot/stacks before redealing.
- Tightened hero hand generation slightly for `3BP` and `4BP` spots without removing all weaker combos.
- Added replay-only optional villain hole-card entry inside the existing `Input Hand` modal.
- Added showdown-only reveal of replay villain cards in the table HUD.
- Added internal `window.__rtpTestHooks` helpers for table-engine verification.
- Added Playwright engine coverage in `tests/e2e/engine.spec.js`.

## 2026-03-08
- Added realistic table vertical slice behind URL flag (`?realistic=1`) while preserving default classic flow.
- Added 6-max table-state engine foundations for live mode:
  - rotating button / position mapping
  - 5/10 blind posting
  - pot, stack, and legal-action tracking
- Added realistic hero action controls:
  - `Fold`, `Check`, `Call`, `Bet To`, `Raise To`, `All-in`
  - bet sizing via slider + numeric input (whole-BB increments)
- Added temporary heads-up lock behavior where non-involved players auto-fold after aggression + call.
- Added auto-villain action progression to advance action until hero's turn.
- Added hidden internal range-authoring modal:
  - open with `Ctrl+Alt+Shift+D` or `?devtools=1`
  - supports profile hand-balloon editing and profile rule updates
- Added hidden profile/range engine support:
  - combo-weighted profile packs
  - action-rule multiplier lookup
  - conservative fallback + coverage-gap logging
  - card blocker application
- Added dedicated realistic-mode Playwright coverage in `tests/e2e/realistic.spec.js`.

## 2026-02-27
- Added Playwright smoke test suite and CI execution for core web flows.
- Added capture mode toggle (`Off`/`On`) to support one unified app for solo/group and coach-recording workflows.
- Replaced replay dropdowns with visual `Input Hand` card-picker modal.
- Added session queue (up to 10 hands) with named session support.
- Added session JSON export/import for sharing exact hand packs.
- Added session hand list controls (load/remove) and run-progress indicator.
- Added `Go Back a Street` control across all non-start states.
- Added table context selectors:
  - `SRP/3BP/4BP`
  - `IP/OOP`
  - `PFR/PFC`
  - `Effective Stacks` (`50BB` to `500BB+`)
- Replaced street status copy with selected left-side context tags.
- Ensured `Start Over` clears selector state.

## 2026-02-26
- Added recorder workflow (webcam preview + screen/mic capture + WebM download).
- Added auto-start recording on first flop, 10-minute cap, pause/resume/stop/playback.
- Added compact layout mode and refined control placement under hero hand.
- Added timer pause/resume and shared visual polish updates.
