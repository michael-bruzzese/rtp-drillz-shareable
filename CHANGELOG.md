# Changelog

## 2026-02-28
- Added `Workspace` selector with dedicated `Coach Review` mode.
- Added coach loader panel for:
  - `.zip` review pack import
  - standalone `.webm` video import
  - standalone `.notes.json` import
- Added review marker detail card and active marker highlighting in the timeline.
- Added single-file `Export Pack` (`.zip`) with in-browser zip creation (no backend/service required).
- Added in-browser zip parsing for coach pack import (stored/no-compression format).
- Added preflight capture checks and street timeline integration improvements.
- Added replay ready-state line and primary-action refocus after `Input Hand -> Apply`.
- Expanded Playwright smoke suite with coach-mode import/export coverage.

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
