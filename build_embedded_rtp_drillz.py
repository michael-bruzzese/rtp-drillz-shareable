#!/usr/bin/env python3
"""
Build a single-file RTP Drillz web app with card PNGs embedded as base64.

Usage:
  python3 build_embedded_rtp_drillz.py \
    --cards-dir "/Users/michaelj.bruzzese/Downloads/PNG-cards-1.3" \
    --template "/Users/michaelj.bruzzese/rtp_drillz_web.html" \
    --output "/Users/michaelj.bruzzese/rtp_drillz_web_embedded.html"
"""

import argparse
import base64
import json
import os
import re
import sys
from pathlib import Path


RANK_WORD_TO_SHORT = {
    "ace": "A",
    "king": "K",
    "queen": "Q",
    "jack": "J",
    "10": "T",
    "9": "9",
    "8": "8",
    "7": "7",
    "6": "6",
    "5": "5",
    "4": "4",
    "3": "3",
    "2": "2",
}

SUIT_WORD_TO_SHORT = {
    "spades": "s",
    "hearts": "h",
    "diamonds": "d",
    "clubs": "c",
}

CARD_NAME_PATTERN = re.compile(
    r"^(ace|king|queen|jack|10|[2-9])_of_(spades|hearts|diamonds|clubs)(2?)\.png$",
    re.IGNORECASE,
)
CARD_SHORT_PATTERN = re.compile(r"^([a2-9tjqk])([shdc])\.png$", re.IGNORECASE)

ALL_KEYS = [f"{r}{s}" for r in "A23456789TJQK" for s in "shdc"]


def to_data_uri(path: Path) -> str:
    raw = path.read_bytes()
    b64 = base64.b64encode(raw).decode("ascii")
    return f"data:image/png;base64,{b64}"


def collect_card_files(cards_dir: Path) -> dict[str, Path]:
    """
    Return best-match card file paths keyed by short code like 'As', 'Td', etc.
    Prefers non-*2 variants when both exist (e.g. king_of_spades.png over king_of_spades2.png).
    """
    selected: dict[str, tuple[int, Path]] = {}

    for entry in cards_dir.iterdir():
        if not entry.is_file() or entry.suffix.lower() != ".png":
            continue

        name = entry.name.lower()

        short = CARD_SHORT_PATTERN.match(name)
        if short:
            rank = short.group(1).upper()
            suit = short.group(2).lower()
            key = f"{rank}{suit}"
            # Highest score; direct short naming is ideal.
            selected[key] = (3, entry)
            continue

        m = CARD_NAME_PATTERN.match(name)
        if not m:
            continue

        rank_word, suit_word, variant = m.groups()
        rank = RANK_WORD_TO_SHORT[rank_word.lower()]
        suit = SUIT_WORD_TO_SHORT[suit_word.lower()]
        key = f"{rank}{suit}"
        score = 2 if variant == "" else 1

        current = selected.get(key)
        if current is None or score > current[0]:
            selected[key] = (score, entry)

    return {k: v[1] for k, v in selected.items()}


def find_back_image(cards_dir: Path) -> Path | None:
    preferred = [
        "back.png",
        "card_back.png",
        "cardback.png",
        "red_back.png",
        "blue_back.png",
        "backside.png",
    ]
    names = {p.name.lower(): p for p in cards_dir.iterdir() if p.is_file() and p.suffix.lower() == ".png"}

    for name in preferred:
        if name in names:
            return names[name]

    # Fallback: anything with "back" in name.
    for name, path in names.items():
        if "back" in name:
            return path
    return None


def inject_embedded_map(template_html: str, embedded_map: dict[str, str]) -> str:
    inject_tag = (
        "<script>\n"
        f"window.__RTP_EMBEDDED_CARDS__ = {json.dumps(embedded_map, separators=(',', ':'))};\n"
        "</script>\n"
    )

    needle = "<script>\n    \"use strict\";"
    if needle not in template_html:
        raise ValueError("Could not find script insertion point in template HTML.")
    return template_html.replace(needle, inject_tag + needle, 1)


def main() -> int:
    parser = argparse.ArgumentParser(description="Embed RTP Drillz card images into a single HTML file.")
    parser.add_argument(
        "--cards-dir",
        default=str(Path.home() / "Downloads" / "PNG-cards-1.3"),
        help="Directory containing the PNG card deck.",
    )
    parser.add_argument(
        "--template",
        default=str(Path.home() / "rtp_drillz_web.html"),
        help="Path to RTP Drillz web HTML template.",
    )
    parser.add_argument(
        "--output",
        default=str(Path.home() / "rtp_drillz_web_embedded.html"),
        help="Output path for embedded single-file HTML.",
    )
    args = parser.parse_args()

    cards_dir = Path(args.cards_dir).expanduser().resolve()
    template_path = Path(args.template).expanduser().resolve()
    output_path = Path(args.output).expanduser().resolve()

    if not cards_dir.is_dir():
        print(f"ERROR: cards dir not found: {cards_dir}", file=sys.stderr)
        return 1
    if not template_path.is_file():
        print(f"ERROR: template not found: {template_path}", file=sys.stderr)
        return 1

    card_files = collect_card_files(cards_dir)
    missing = [k for k in ALL_KEYS if k not in card_files]
    if missing:
        print(f"ERROR: Missing {len(missing)} cards in deck folder.", file=sys.stderr)
        print(f"Missing keys: {', '.join(missing)}", file=sys.stderr)
        return 1

    embedded_map: dict[str, str] = {}
    for key in ALL_KEYS:
        embedded_map[key] = to_data_uri(card_files[key])

    back = find_back_image(cards_dir)
    if back is not None:
        embedded_map["back"] = to_data_uri(back)

    template_html = template_path.read_text(encoding="utf-8")
    output_html = inject_embedded_map(template_html, embedded_map)
    output_path.write_text(output_html, encoding="utf-8")

    size_mb = output_path.stat().st_size / (1024 * 1024)
    print(f"Built: {output_path}")
    print(f"Embedded cards: {len(embedded_map) - (1 if 'back' in embedded_map else 0)}/52")
    print(f"Back image embedded: {'yes' if 'back' in embedded_map else 'no'}")
    print(f"Output size: {size_mb:.2f} MB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
