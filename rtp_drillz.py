#!/usr/bin/env python3
"""
RTP Drillz - Range/Texture/Pressure poker drill tool (Tkinter)
Texas Hold'em street-by-street drill with optional per-street timer.
"""

import os
import random
import tkinter as tk

try:
    from PIL import Image, ImageTk
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


class RTPDrillzApp(tk.Tk):
    DARK_BG = "#1a1a1a"
    FELT_BG = "#004d00"
    TEXT = "#e0e0e0"
    WHITE = "#ffffff"
    ORANGE = "#ff9500"
    ORANGE_HOVER = "#ffad33"
    RED_FLASH = "#ff3300"

    RANKS = "23456789TJQKA"
    SUITS = "shdc"

    TIMER_OPTIONS = ["None", "10s", "15s", "30s", "45s", "60s", "90s"]
    TIMER_MAP = {
        "None": 0,
        "10s": 10,
        "15s": 15,
        "30s": 30,
        "45s": 45,
        "60s": 60,
        "90s": 90,
    }

    def __init__(self):
        super().__init__()
        self.title("RTP Drillz")
        self.geometry("1000x800")
        self.minsize(900, 700)
        self.configure(bg=self.DARK_BG)

        self.script_dir = os.path.dirname(os.path.abspath(__file__))
        self.config_path = os.path.join(self.script_dir, "rtp_config.txt")

        self.card_height = 140
        self.card_width = 100

        self.hand = []
        self.board = []
        self.deck = []
        self.stage = "start"

        self.timer_job = None
        self.time_left = 0
        self.flash_job = None

        self.card_file_index = self._build_card_file_index()
        self.card_image_cache = {}
        self.back_image_cache = None

        self.timer_var = tk.StringVar(value=self._load_timer_choice())
        self.countdown_var = tk.StringVar(value="Time left: --:--")

        self._build_ui()
        self.timer_var.trace_add("write", self._on_timer_choice_change)

        self._refresh_scene()
        self.protocol("WM_DELETE_WINDOW", self._on_close)

    # ----------------------- UI -----------------------

    def _build_ui(self):
        top = tk.Frame(self, bg=self.DARK_BG)
        top.pack(fill="x", padx=20, pady=(16, 8))

        title = tk.Label(
            top,
            text="RTP Drillz",
            font=("Helvetica", 28, "bold"),
            fg=self.WHITE,
            bg=self.DARK_BG,
        )
        title.pack(side="left")

        timer_wrap = tk.Frame(top, bg=self.DARK_BG)
        timer_wrap.pack(side="right")

        timer_label = tk.Label(
            timer_wrap,
            text="Timer / street:",
            font=("Helvetica", 12, "bold"),
            fg=self.TEXT,
            bg=self.DARK_BG,
        )
        timer_label.pack(side="left", padx=(0, 8))

        self.timer_menu = tk.OptionMenu(timer_wrap, self.timer_var, *self.TIMER_OPTIONS)
        self.timer_menu.config(
            font=("Helvetica", 11),
            bg="#2b2b2b",
            fg=self.WHITE,
            activebackground=self.ORANGE,
            activeforeground="#111111",
            highlightthickness=0,
            bd=0,
            width=8,
        )
        self.timer_menu["menu"].config(
            bg="#2b2b2b",
            fg=self.WHITE,
            activebackground=self.ORANGE,
            activeforeground="#111111",
            font=("Helvetica", 11),
        )
        self.timer_menu.pack(side="left")

        self.table_frame = tk.Frame(
            self,
            bg=self.FELT_BG,
            highlightthickness=2,
            highlightbackground=self.ORANGE,
        )
        self.table_frame.pack(fill="both", expand=True, padx=20, pady=(6, 12))

        self.countdown_label = tk.Label(
            self.table_frame,
            textvariable=self.countdown_var,
            font=("Helvetica", 22, "bold"),
            fg=self.WHITE,
            bg=self.FELT_BG,
        )
        self.countdown_label.place(relx=0.98, rely=0.02, anchor="ne")

        self.time_overlay = tk.Label(
            self.table_frame,
            text="TIME!",
            font=("Helvetica", 72, "bold"),
            fg=self.ORANGE,
            bg=self.FELT_BG,
        )
        self.time_overlay.place_forget()

        self.start_title = tk.Label(
            self.table_frame,
            text="RTP Drillz",
            font=("Helvetica", 56, "bold"),
            fg=self.WHITE,
            bg=self.FELT_BG,
        )
        self.start_title.place(relx=0.5, rely=0.45, anchor="center")

        self.board_title = tk.Label(
            self.table_frame,
            text="Board",
            font=("Helvetica", 20, "bold"),
            fg=self.WHITE,
            bg=self.FELT_BG,
        )
        self.board_title.pack(pady=(24, 8))

        self.board_cards_frame = tk.Frame(self.table_frame, bg=self.FELT_BG)
        self.board_cards_frame.pack(pady=(0, 12))

        self.status_label = tk.Label(
            self.table_frame,
            text="Pick a timer and deal a hand.",
            font=("Helvetica", 14),
            fg=self.TEXT,
            bg=self.FELT_BG,
        )
        self.status_label.pack(pady=(8, 16))

        hand_wrap = tk.Frame(self, bg=self.DARK_BG)
        hand_wrap.pack(fill="x", padx=20, pady=(0, 10))

        hand_title = tk.Label(
            hand_wrap,
            text="Hero Hand",
            font=("Helvetica", 18, "bold"),
            fg=self.WHITE,
            bg=self.DARK_BG,
        )
        hand_title.pack(pady=(4, 8))

        self.hand_cards_frame = tk.Frame(hand_wrap, bg=self.DARK_BG)
        self.hand_cards_frame.pack()

        self.controls_frame = tk.Frame(self, bg=self.DARK_BG)
        self.controls_frame.pack(fill="x", padx=20, pady=(6, 20))

    def _set_controls(self, buttons):
        for w in self.controls_frame.winfo_children():
            w.destroy()

        row = tk.Frame(self.controls_frame, bg=self.DARK_BG)
        row.pack()

        for text, cmd, primary in buttons:
            btn = tk.Button(
                row,
                text=text,
                command=cmd,
                font=("Helvetica", 16 if primary else 13, "bold"),
                bg=self.ORANGE if primary else "#2a2a2a",
                fg="#111111" if primary else self.WHITE,
                activebackground=self.ORANGE_HOVER if primary else "#3a3a3a",
                activeforeground="#111111" if primary else self.WHITE,
                relief="flat",
                bd=0,
                cursor="hand2",
                padx=18,
                pady=10,
            )
            self._add_hover(btn, primary)
            btn.pack(side="left", padx=10)

    def _add_hover(self, button, primary):
        normal = self.ORANGE if primary else "#2a2a2a"
        hover = self.ORANGE_HOVER if primary else "#3a3a3a"

        button.bind("<Enter>", lambda _e: button.config(bg=hover))
        button.bind("<Leave>", lambda _e: button.config(bg=normal))

    def _refresh_scene(self):
        self._render_board()
        self._render_hand()

        if self.stage == "start":
            self.start_title.place(relx=0.5, rely=0.45, anchor="center")
            self.status_label.config(text="Pick a timer and deal a hand.")
            self._set_controls([("Deal Hand", self.deal_hand, True)])
        elif self.stage == "hand":
            self.start_title.place_forget()
            self.status_label.config(text="Keep this hand or reroll.")
            self._set_controls([
                ("Keep Hand", self.keep_hand, True),
                ("New Hand", self.deal_hand, False),
            ])
        elif self.stage == "flop":
            self.start_title.place_forget()
            self.status_label.config(text="Flop dealt. Make your decision.")
            self._set_controls([
                ("Keep Flop \u2192 Turn", self.keep_flop, True),
                ("New Flop", self.new_flop, False),
            ])
        elif self.stage == "turn":
            self.start_title.place_forget()
            self.status_label.config(text="Turn dealt. Decide and continue.")
            self._set_controls([
                ("Keep Turn \u2192 River", self.keep_turn, True),
                ("New Turn", self.new_turn, False),
            ])
        elif self.stage == "river":
            self.start_title.place_forget()
            self.status_label.config(text="River dealt. Final decision spot.")
            self._set_controls([
                ("Keep River", self.keep_river, True),
                ("New River", self.new_river, False),
            ])
        elif self.stage == "done":
            self.start_title.place_forget()
            self.status_label.config(text="Drill complete. Final board locked.")
            self._set_controls([
                ("Deal Hand", self.deal_hand, True),
                ("New River", self.new_river, False),
            ])

    def _render_board(self):
        for w in self.board_cards_frame.winfo_children():
            w.destroy()

        if not self.board:
            empty = tk.Label(
                self.board_cards_frame,
                text="No board yet",
                font=("Helvetica", 12),
                fg=self.TEXT,
                bg=self.FELT_BG,
            )
            empty.pack()
            return

        for card in self.board:
            widget = self._create_card_widget(self.board_cards_frame, card_code=card)
            widget.pack(side="left", padx=6, pady=6)

    def _render_hand(self):
        for w in self.hand_cards_frame.winfo_children():
            w.destroy()

        if not self.hand:
            for _ in range(2):
                widget = self._create_card_widget(self.hand_cards_frame, back=True)
                widget.pack(side="left", padx=8, pady=4)
            return

        for card in self.hand:
            widget = self._create_card_widget(self.hand_cards_frame, card_code=card)
            widget.pack(side="left", padx=8, pady=4)

    def _create_card_widget(self, parent, card_code=None, back=False):
        outer = tk.Frame(parent, bg=self.ORANGE, padx=2, pady=2)
        photo = self._get_back_image() if back else self._get_card_image(card_code)

        if photo is not None:
            lbl = tk.Label(outer, image=photo, bg="#ffffff", bd=0)
            lbl.image = photo
            lbl.pack()
        else:
            txt = "BACK" if back else self._format_card(card_code)
            canvas = tk.Canvas(
                outer,
                width=self.card_width,
                height=self.card_height,
                bg="#ffffff",
                highlightthickness=0,
            )
            canvas.create_text(
                self.card_width // 2,
                self.card_height // 2,
                text=txt,
                font=("Helvetica", 18, "bold"),
                fill="#222222",
            )
            canvas.pack()
        return outer

    # ----------------------- Game Logic -----------------------

    def deal_hand(self):
        self._stop_timer(reset_display=True)
        self._hide_time_overlay()
        self._set_felt_bg(self.FELT_BG)

        self.hand = self._generate_playable_hand()
        self.board = []
        self.stage = "hand"
        self._refresh_scene()

    def keep_hand(self):
        self._enter_flop()

    def new_flop(self):
        self._enter_flop()

    def keep_flop(self):
        self._enter_turn()

    def new_turn(self):
        self._enter_turn()

    def keep_turn(self):
        self._enter_river()

    def new_river(self):
        self._enter_river()

    def keep_river(self):
        self.stage = "done"
        self._stop_timer(reset_display=True)
        self._hide_time_overlay()
        self._refresh_scene()

    def _enter_flop(self):
        if len(self.hand) != 2:
            return
        self._reset_deck(excluded=self.hand)
        self.board = [self._deal_card(), self._deal_card(), self._deal_card()]
        self.stage = "flop"
        self._refresh_scene()
        self._start_timer_for_street()

    def _enter_turn(self):
        if len(self.board) < 3:
            return
        flop = self.board[:3]
        self._reset_deck(excluded=self.hand + flop)
        turn = self._deal_card()
        self.board = flop + [turn]
        self.stage = "turn"
        self._refresh_scene()
        self._start_timer_for_street()

    def _enter_river(self):
        if len(self.board) < 4:
            return
        first_four = self.board[:4]
        self._reset_deck(excluded=self.hand + first_four)
        river = self._deal_card()
        self.board = first_four + [river]
        self.stage = "river"
        self._refresh_scene()
        self._start_timer_for_street()

    def _build_full_deck(self):
        return [r + s for r in self.RANKS for s in self.SUITS]

    def _reset_deck(self, excluded=None):
        excluded = set(excluded or [])
        self.deck = [c for c in self._build_full_deck() if c not in excluded]
        random.shuffle(self.deck)

    def _deal_card(self):
        if not self.deck:
            self._reset_deck(excluded=self.hand + self.board)
        return self.deck.pop()

    def _generate_playable_hand(self):
        deck = self._build_full_deck()
        while True:
            c1, c2 = random.sample(deck, 2)
            if self._is_playable_hand(c1, c2):
                return sorted([c1, c2], key=lambda c: self._rank_value(c[0]), reverse=True)

    def _rank_value(self, rank):
        return self.RANKS.index(rank.upper()) + 2

    def _is_playable_hand(self, c1, c2):
        r1, s1 = c1[0], c1[1]
        r2, s2 = c2[0], c2[1]
        v1 = self._rank_value(r1)
        v2 = self._rank_value(r2)

        if v1 == v2:
            return True  # all pairs

        suited = (s1 == s2)
        if suited:
            return True  # very wide suited range

        high, low = max(v1, v2), min(v1, v2)
        gap = high - low - 1

        # Wide offsuit playable range, but avoids obvious trash.
        if high >= 12 and low >= 10:  # QTo+, broadway-heavy
            return True
        if high == 14 and low >= 7:   # A7o+
            return True
        if high == 13 and low >= 9:   # K9o+
            return True
        if high == 12 and low >= 9:   # Q9o+
            return True
        if high == 11 and low >= 9:   # J9o+
            return True
        if high >= 10 and low >= 7 and gap <= 2:  # 87o/98o/T9o + one/two gappers
            return True
        if (high, low) in {(9, 8), (8, 7)}:
            return True

        return False

    # ----------------------- Timer -----------------------

    def _start_timer_for_street(self):
        self._hide_time_overlay()
        self._set_felt_bg(self.FELT_BG)
        self._stop_timer(reset_display=False)

        seconds = self.TIMER_MAP.get(self.timer_var.get(), 0)
        if seconds <= 0:
            self.countdown_var.set("Time left: --:--")
            return

        self.time_left = seconds
        self._update_countdown()
        self.timer_job = self.after(1000, self._tick_timer)

    def _tick_timer(self):
        self.time_left -= 1
        self._update_countdown()

        if self.time_left <= 0:
            self.timer_job = None
            self._time_up()
            return

        self.timer_job = self.after(1000, self._tick_timer)

    def _update_countdown(self):
        if self.time_left < 0:
            self.time_left = 0
        mm = self.time_left // 60
        ss = self.time_left % 60
        self.countdown_var.set(f"Time left: {mm:02d}:{ss:02d}")

    def _time_up(self):
        self._show_time_overlay()
        self._flash_table()

    def _show_time_overlay(self):
        self.time_overlay.place(relx=0.5, rely=0.5, anchor="center")
        self.time_overlay.lift()

    def _hide_time_overlay(self):
        self.time_overlay.place_forget()

    def _flash_table(self, flashes=4, delay_ms=150):
        if self.flash_job is not None:
            self.after_cancel(self.flash_job)
            self.flash_job = None

        count = {"n": 0}

        def pulse():
            if count["n"] >= flashes:
                self._set_felt_bg(self.FELT_BG)
                self.flash_job = None
                return
            color = self.RED_FLASH if count["n"] % 2 == 0 else self.FELT_BG
            self._set_felt_bg(color)
            count["n"] += 1
            self.flash_job = self.after(delay_ms, pulse)

        pulse()

    def _stop_timer(self, reset_display=False):
        if self.timer_job is not None:
            self.after_cancel(self.timer_job)
            self.timer_job = None
        if reset_display:
            self.countdown_var.set("Time left: --:--")

    def _on_timer_choice_change(self, *_):
        choice = self.timer_var.get()
        if choice not in self.TIMER_OPTIONS:
            self.timer_var.set("None")
            choice = "None"
        self._save_timer_choice(choice)

        if self.stage in {"flop", "turn", "river"}:
            self._start_timer_for_street()
        elif choice == "None":
            self.countdown_var.set("Time left: --:--")

    # ----------------------- Cards / Images -----------------------

    def _build_card_file_index(self):
        index = {}
        try:
            entries = os.listdir(self.script_dir)
        except OSError:
            return index

        # PNG files directly beside script.
        for name in entries:
            path = os.path.join(self.script_dir, name)
            if os.path.isfile(path) and name.lower().endswith(".png"):
                index[name.lower()] = path

        # Scan likely deck/image folders one level below.
        likely_tokens = ("card", "deck", "png", "image", "img")
        for name in entries:
            path = os.path.join(self.script_dir, name)
            if not os.path.isdir(path):
                continue
            if not any(t in name.lower() for t in likely_tokens):
                continue

            for root, dirs, files in os.walk(path):
                depth = os.path.relpath(root, path).count(os.sep)
                if depth > 2:
                    dirs[:] = []
                    continue
                for f in files:
                    if f.lower().endswith(".png"):
                        index.setdefault(f.lower(), os.path.join(root, f))

        return index

    def _get_card_image(self, code):
        if not PIL_AVAILABLE or not code:
            return None
        if code in self.card_image_cache:
            return self.card_image_cache[code]

        path = self._find_card_file(code)
        if not path:
            return None

        img = self._load_and_resize(path)
        if img is None:
            return None

        self.card_image_cache[code] = img
        return img

    def _get_back_image(self):
        if not PIL_AVAILABLE:
            return None
        if self.back_image_cache is not None:
            return self.back_image_cache

        path = self._find_back_file()
        if not path:
            return None

        img = self._load_and_resize(path)
        self.back_image_cache = img
        return img

    def _load_and_resize(self, path):
        try:
            resample = Image.Resampling.LANCZOS if hasattr(Image, "Resampling") else Image.LANCZOS
            with Image.open(path) as im:
                im = im.convert("RGBA")
                ratio = self.card_height / float(im.height)
                width = max(1, int(im.width * ratio))
                im = im.resize((width, self.card_height), resample)
                return ImageTk.PhotoImage(im)
        except Exception:
            return None

    def _find_card_file(self, code):
        rank = code[0].upper()
        suit = code[1].lower()

        rank_variants = [rank, rank.lower()]
        if rank == "T":
            rank_variants.extend(["10"])

        suit_variants = [suit, suit.upper()]

        candidates = set()
        for r in rank_variants:
            for s in suit_variants:
                candidates.add(f"{r}{s}.png".lower())
                candidates.add(f"{r}_{s}.png".lower())

        return self._lookup_index(candidates)

    def _find_back_file(self):
        candidates = {
            "back.png",
            "cardback.png",
            "card_back.png",
            "backside.png",
            "blue_back.png",
            "red_back.png",
        }
        return self._lookup_index(candidates)

    def _lookup_index(self, names):
        for name in names:
            if name in self.card_file_index:
                return self.card_file_index[name]
        return None

    def _format_card(self, code):
        if not code:
            return "??"
        return f"{code[0].upper()}{code[1].lower()}"

    # ----------------------- Config / Utility -----------------------

    def _load_timer_choice(self):
        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                value = f.read().strip()
            if value in self.TIMER_OPTIONS:
                return value
        except OSError:
            pass
        return "None"

    def _save_timer_choice(self, value):
        try:
            with open(self.config_path, "w", encoding="utf-8") as f:
                f.write(value)
        except OSError:
            pass

    def _set_felt_bg(self, color):
        self.table_frame.config(bg=color)
        self.board_title.config(bg=color)
        self.board_cards_frame.config(bg=color)
        self.status_label.config(bg=color)
        self.start_title.config(bg=color)
        self.countdown_label.config(bg=color)
        self.time_overlay.config(bg=color)

    def _on_close(self):
        self._stop_timer(reset_display=False)
        if self.flash_job is not None:
            self.after_cancel(self.flash_job)
        self.destroy()


if __name__ == "__main__":
    app = RTPDrillzApp()
    app.mainloop()
