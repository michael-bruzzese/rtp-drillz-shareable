# RTP Drillz Shareable - Project Notes

## Purpose
Shareable coaching version of RTP Drillz with in-browser recording and review workflow.

## Live App
- https://michael-bruzzese.github.io/rtp-drillz-shareable/

## Current Feature Snapshot
- Includes full core drill flow from RTP Drillz.
- Realistic table vertical slice is available behind URL flag:
  - Open with `?realistic=1` on `rtp_drillz_web_embedded.html`.
  - Default app behavior remains classic flow when the flag is not used.
- Realistic slice currently supports:
  - 6-max seat/position rotation with fixed seat layout and rotating button.
  - 5/10 blind posting and pot/stack action-state tracking.
  - Hero decision controls: `Fold`, `Check`, `Call`, `Bet To`, `Raise To`, `All-in`.
  - Bet sizing controls under hero actions (slider + numeric input, whole-BB increments).
  - Temporary heads-up lock behavior: after an aggression + call line, remaining players auto-fold.
  - Auto-villain action progression until hero's turn, with street auto-advance.
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
  - Left: `SRP/3BP/4BP`, `IP/OOP`, `PFR/PFC` (single-select per row)
  - Right: `Effective Stacks` single-select (`50BB` to `500BB+`)
- Under-board status line now shows only left-side tags (`SRP | IP | PFR` style).
- Tag selections persist until user changes them; `Start Over` clears all.
- Hand mode selector:
  - `Live Drill` (random)
  - `Hand Replay` (manual)
- `Hand Replay` uses visual `Input Hand` modal (52-card picker with slot-by-slot fill) instead of dropdowns.
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

## Key Files
- `rtp_drillz_web.html` (source UI/logic, including recording code)
- `rtp_drillz_web_embedded.html` (deployed embedded cards build)
- `build_embedded_rtp_drillz.py`
- `index.html`
- `tests/e2e/smoke.spec.js` (Playwright smoke tests)
- `tests/e2e/realistic.spec.js` (Playwright realistic-mode tests)
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
   - `http://127.0.0.1:8765/rtp_drillz_web_embedded.html?realistic=1`
   - verify hero action controls + sizing + round progression.
3. If needed, open hidden range tools:
   - `Ctrl+Alt+Shift+D` or `?devtools=1`
4. Run tests:
   - `npm run test:e2e`
5. Implement next UX/range iteration, rebuild embedded output, commit/push.
