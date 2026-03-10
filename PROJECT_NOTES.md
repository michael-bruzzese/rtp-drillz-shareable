# RTP Drillz Shareable - Project Notes

## Purpose
Shareable coaching version of RTP Drillz with in-browser recording and review workflow.

## Live App
- https://michael-bruzzese.github.io/rtp-drillz-shareable/

## Current Feature Snapshot
- Includes full core drill flow from RTP Drillz.
- `Live Drill` and `Hand Replay` now share the same six-max table engine.
- Shared table engine currently supports:
  - fixed hero seat with dealer-button-driven position mapping
  - configurable blinds via `SB` / `BB` inputs
  - effective-stack presets plus per-seat stack editing before the hand
  - pot, stack, and legal-action tracking across streets
  - visible six-seat table HUD with button / acting-player / stack state
  - hero decision controls: `Fold`, `Check`, `Call`, `Bet To`, `Raise To`, `All-in`
  - bet sizing via slider + numeric input (whole-BB increments)
  - deterministic preflop scenario scripting for `SRP`, `3BP`, and `4BP`
  - `Play Pre` and `Skip To Flop` setup for live mode
  - street snapshots so `New Flop`, `New Turn`, and `New River` rewind pot/stacks to street start before redealing
- Current phase is still heads-up after the configured line resolves; multiway remains future work.
- Capture mode toggle:
  - `Off`: no recorder clutter, no camera/mic prompt.
  - `On`: full recorder panel and workflow.
- Webcam preview panel + recording controls (`Start`, `Pause`, `Resume`, `Stop`, `Playback`, `Download`).
- Auto-start recording on first flop (armed from idle).
- Recording continues across hand resets/start-over unless user stops it.
- Pause/resume recording also pauses/resumes drill timer behavior as implemented.
- Max recording cap: 10 minutes with auto-stop.
- Output format: `video/webm` local download (no backend storage).
- Compact layout mode in addition to standard layout.
- Street action buttons positioned under hero hand.
- `Go Back a Street` action:
  - done -> river
  - river -> turn (keeps flop+turn)
  - turn -> flop (keeps flop)
  - flop -> hand
  - hand -> start
- Table context selectors:
  - Left: `SRP/3BP/4BP`, `IP/OOP`, `Play Pre/Skip To Flop`
  - Right: blind inputs plus `Effective Stacks` presets and per-seat stack editor
- Under-board status line now shows live table-state accounting instead of only static tags.
- Tag selections persist until user changes them; `Start Over` clears all.
- Hand mode selector:
  - `Live Drill` (random)
  - `Hand Replay` (manual)
- `Hand Replay` uses visual `Input Hand` modal (52-card picker with slot-by-slot fill) instead of dropdowns.
- `Hand Replay` now supports optional villain hole-card entry by seat inside the same modal:
  - any subset of villain seats can be left blank
  - entered villain cards stay hidden during play
  - entered villain cards reveal only on showdown (not on fold-only hand endings)
- Session queue (max 10 hands):
  - Named sessions
  - `Add Loaded Hand`, `Start Session`, `Clear Session`
  - Import/export JSON for shareable hand packs
  - Sequential run-through with queue progress indicator
- Hidden internal range-authoring tools:
  - Open with `Ctrl+Alt+Shift+D` (toggle), or `?devtools=1`.
  - Internal hand-balloon profile editing modal (not user-visible by default).
  - Internal profile pack import/export and action-rule multiplier editing.
  - Hidden range engine runs behind the scenes and is excluded from session export.
- Internal test hooks:
  - `window.__rtpTestHooks` exposes configure / deal / act / snapshot helpers for engine verification.

## Key Files
- `rtp_drillz_web.html` (source UI/logic, including recording code)
- `rtp_drillz_web_embedded.html` (deployed embedded cards build)
- `build_embedded_rtp_drillz.py`
- `index.html`
- `tests/e2e/smoke.spec.js` (Playwright smoke tests)
- `tests/e2e/realistic.spec.js` (Playwright realistic-mode tests)
- `tests/e2e/engine.spec.js` (engine-level accounting + legality coverage via test hooks)
- `playwright.config.js` and `package.json` (test runner config)

## Rebuild + Deploy
```bash
python3 build_embedded_rtp_drillz.py \
  --cards-dir /Users/michaelj.bruzzese/Downloads/PNG-cards-1.3 \
  --template ./rtp_drillz_web.html \
  --output ./rtp_drillz_web_embedded.html
git add rtp_drillz_web.html rtp_drillz_web_embedded.html
git commit -m "Describe change"
git push
```

## Next Session Quick Start
1. Read this file and `CHANGELOG.md`.
2. Validate realistic mode manually:
   - `http://127.0.0.1:8765/rtp_drillz_web_embedded.html`
   - verify `SRP / 3BP / 4BP`, `IP / OOP`, blinds, stack editor, and preflop flow options.
   - verify table HUD, stack accounting, and `New Flop / Turn / River` behavior.
3. If needed, open hidden range tools:
   - `Ctrl+Alt+Shift+D` or `?devtools=1`
4. Run tests:
   - `npm run test:e2e`
5. Implement next UX/range iteration, rebuild embedded output, commit/push.
