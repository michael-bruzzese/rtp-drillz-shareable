# RTP Drillz Shareable - Project Notes

## Purpose
Shareable coaching version of RTP Drillz with in-browser recording and review workflow.

## Live App
- https://michael-bruzzese.github.io/rtp-drillz-shareable/

## Current Feature Snapshot
- Includes full core drill flow from RTP Drillz.
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

## Key Files
- `rtp_drillz_web.html` (source UI/logic, including recording code)
- `rtp_drillz_web_embedded.html` (deployed embedded cards build)
- `build_embedded_rtp_drillz.py`
- `index.html`

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
2. Run a live browser trial with camera/mic permissions.
3. Implement small UX iteration, rebuild embedded output, commit/push.
