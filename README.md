# RTP Drillz
[![CI](https://github.com/michael-bruzzese/rtp-drillz-shareable/actions/workflows/ci.yml/badge.svg)](https://github.com/michael-bruzzese/rtp-drillz-shareable/actions/workflows/ci.yml)

RTP Drillz is a poker study tool for range-based flop/turn/river drills.

## Status

This is the **active primary codebase**.

`Live Drill` and `Hand Replay` now both run on the shared six-max table engine.

## Files

- `rtp_drillz_web_embedded.html`: single-file web app with embedded card images (deploy this file).
- `rtp_drillz_web.html`: source web app template.
- `build_embedded_rtp_drillz.py`: build script to embed a PNG card deck into the deployable HTML.
- `rtp_drillz.py`: desktop Tkinter version.

## Run Locally (Web)

```bash
python3 -m http.server 8765 --directory .
```

Open:

- `http://127.0.0.1:8765/rtp_drillz_web_embedded.html`

Current setup controls:

- `SRP / 3BP / 4BP`
- `IP / OOP`
- `Play Pre / Skip To Flop`
- blind inputs (`SB`, `BB`)
- effective-stack presets plus per-seat stack editor
- replay-only optional villain hole-card input inside the existing `Input Hand` modal

Optional dev flags:

- Legacy realistic flag: `?realistic=1`
- Hidden internal range tools: `?devtools=1` (or hotkey `Ctrl+Alt+Shift+D`)

## Rebuild Embedded HTML

```bash
python3 build_embedded_rtp_drillz.py \
  --cards-dir "/path/to/PNG-cards-1.3" \
  --template "./rtp_drillz_web.html" \
  --output "./rtp_drillz_web_embedded.html"
```

## E2E Smoke Tests (Playwright)

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

Test files:

- `tests/e2e/smoke.spec.js`
- `tests/e2e/realistic.spec.js`
- `tests/e2e/engine.spec.js`
