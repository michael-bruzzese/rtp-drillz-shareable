# RTP Drillz

RTP Drillz is a poker study tool for range-based flop/turn/river drills.

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

## Rebuild Embedded HTML

```bash
python3 build_embedded_rtp_drillz.py \
  --cards-dir "/path/to/PNG-cards-1.3" \
  --template "./rtp_drillz_web.html" \
  --output "./rtp_drillz_web_embedded.html"
```
