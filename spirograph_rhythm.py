
# -*- coding: utf-8 -*-
import os
import random

import pyxel

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ---------- 定数 ----------
SCREEN_W = 256
SCREEN_H = 256
HUD_H = 40
FOOTER_H = 0
PLAY_TOP = HUD_H
PLAY_BOTTOM = SCREEN_H - FOOTER_H
PATH_LENGTH = 360 * 28

WINDOW_TITLE = "Spirograph Rhythm : Matrix"
FONT_PATH = os.path.join(BASE_DIR, "umplus_j10r.bdf")

MSG_TITLE = "スピログラフ リズム"
MSG_TITLE_1 = "ノーツは一定リズムで1つずつ流れます"
MSG_TITLE_2 = "判定点を通る瞬間に タップ / SPACE"
MSG_TITLE_3 = "通過した軌跡が緑に発光します"
MSG_TITLE_4 = "スマホは 判定点かノーツ付近をタップ"
MSG_TITLE_START = "ENTER / SPACE / タップでスタート"

MSG_DEFAULT = "判定点に重なった瞬間をタップ"
MSG_STAGE = "{stage}ステージ"
MSG_PERFECT = "パーフェクト"
MSG_GOOD = "グッド"
MSG_MISS = "ミス"
MSG_EARLY = "早すぎ"
MSG_LATE = "遅すぎ"
MSG_PAUSED = "PAUSED"
MSG_CURVE_NEW = "新しい軌道を生成"
MSG_CURVE_RETRY = "同じ軌道でやりなおし"

MSG_GAME_OVER = "ゲームオーバー"
MSG_GAME_OVER_SCORE = "スコア {score}"
MSG_GAME_OVER_STAGE = "到達ステージ {stage}"
MSG_GAME_OVER_COMBO = "最大コンボ {combo}"
MSG_GAME_OVER_RETRY = "R / タップでやりなおし"

MSG_SPEED_LABEL = "SPD {speed}"
MSG_BEAT_LABEL = "INT {beat}"
MSG_LIFE_LABEL = "LIFE {life}"
MSG_COMBO_LABEL = "CB {combo}"

BTN_RETRY = "RETRY"
BTN_NEW = "NEW"
BTN_RESUME = "RESUME"

TAP_RADIUS_MOBILE = 28
NOTE_TAP_RADIUS = 26
HIT_WINDOW_PERFECT = 14
HIT_WINDOW_GOOD = 28
DEFAULT_SPEED = 0.8
MAX_SPEED = 3.2
DEFAULT_BEAT_INTERVAL = 68
MIN_BEAT_INTERVAL = 40
NOTE_COUNT_BASE = 14
NOTE_COUNT_STEP = 3
SPATIAL_GAP_MIN = 120
SPATIAL_GAP_MAX = 260

SUCCESS_SPEED_STEP = 0.05

SEG_BRIGHT_AGE = 60
SEG_DIM_AGE = 180
SEG_MARK_AGE = 320
SEG_BRIGHT_AGE_FOCUS = 40
SEG_DIM_AGE_FOCUS = 110
SEG_MARK_AGE_FOCUS = 180
SAFE_MARGIN = 20

RESULT_RULES = {
    "perfect": {
        "message": MSG_PERFECT,
        "flash_kind": "perfect",
        "sound": 0,
        "flash_timer": 10,
        "combo_mode": "add",
        "combo_add": 1,
        "life_add": 0,
        "score_base": 180,
        "score_combo": 4,
        "gain_speed": True,
    },
    "good": {
        "message": MSG_GOOD,
        "flash_kind": "good",
        "sound": 1,
        "flash_timer": 10,
        "combo_mode": "add",
        "combo_add": 1,
        "life_add": 0,
        "score_base": 100,
        "score_combo": 2,
        "gain_speed": True,
    },
    "early": {
        "message": MSG_EARLY,
        "flash_kind": "miss",
        "sound": 2,
        "flash_timer": 10,
        "combo_mode": "reset",
        "combo_add": 0,
        "life_add": -1,
        "score_base": 0,
        "score_combo": 0,
        "gain_speed": False,
    },
    "late": {
        "message": MSG_LATE,
        "flash_kind": "miss",
        "sound": 2,
        "flash_timer": 10,
        "combo_mode": "reset",
        "combo_add": 0,
        "life_add": -1,
        "score_base": 0,
        "score_combo": 0,
        "gain_speed": False,
    },
    "miss": {
        "message": MSG_MISS,
        "flash_kind": "miss",
        "sound": 2,
        "flash_timer": 8,
        "combo_mode": "reset",
        "combo_add": 0,
        "life_add": -1,
        "score_base": 0,
        "score_combo": 0,
        "gain_speed": False,
    },
}


class App:
    def __init__(self):
        pyxel.init(SCREEN_W, SCREEN_H, title=WINDOW_TITLE, fps=60)
        pyxel.mouse(True)

        self.font = None
        if os.path.exists(FONT_PATH):
            try:
                self.font = pyxel.Font(FONT_PATH)
            except Exception:
                self.font = None

        self.cx = pyxel.width // 2
        self.cy = pyxel.height // 2 + 6
        self.rng = random.Random()

        self.columns = []
        self.nodes = []
        self.path_points = []
        self.notes = []
        self.revealed_segments = []

        self.state = "title"
        self.stage = 1
        self.score = 0
        self.combo = 0
        self.best_combo = 0
        self.lives = 10
        self.speed = DEFAULT_SPEED
        self.beat_interval = DEFAULT_BEAT_INTERVAL
        self.song_time = 0
        self.message = MSG_DEFAULT
        self.flash_timer = 0
        self.hit_flash_kind = "perfect"
        self.menu_open = False
        self.fever = False
        self.fever_timer = 0
        self.fever_notice_timer = 0

        self.matrix_chars = "01X+-#*<>[]{}|:;."
        self.make_matrix_columns()
        self.make_noise_nodes()
        self.setup_sounds()
        self.build_stage(new_curve=True)
        pyxel.run(self.update, self.draw)

    # ---------- 基本 ----------
    def text(self, x, y, message, color):
        if self.font:
            try:
                pyxel.text(x, y, message, color, self.font)
                return
            except Exception:
                pass
        pyxel.text(x, y, message, color)

    def text_width(self, message):
        if self.font:
            try:
                return self.font.text_width(message)
            except Exception:
                pass
        return len(message) * 4

    def draw_text_center(self, x, y, w, message, color):
        tw = self.text_width(message)
        tx = x + (w - tw) // 2
        self.text(tx, y, message, color)

    def draw_menu_button(self, x, y, w, h, label, border_color):
        pyxel.rect(x, y, w, h, 1)
        pyxel.rectb(x, y, w, h, border_color)
        self.draw_text_center(x, y + 4, w, label, 11)

    def setup_sounds(self):
        try:
            pyxel.sounds[0].set("c3e3g3c4", "tttt", "7666", "nnnn", 16)
            pyxel.sounds[1].set("c2g2c3", "ppp", "655", "nnn", 22)
            pyxel.sounds[2].set("a1f1", "nn", "63", "ff", 30)
            pyxel.sounds[3].set("g2b2d3", "sss", "654", "nns", 18)
        except Exception:
            pass

    def play_sound(self, ch, snd):
        try:
            pyxel.play(ch, snd)
        except Exception:
            pass

    def gain_speed_on_success(self):
        self.speed = min(MAX_SPEED, self.speed + SUCCESS_SPEED_STEP)

    # ---------- 進行 ----------
    def reset_run(self):
        self.stage = 1
        self.score = 0
        self.combo = 0
        self.best_combo = 0
        self.lives = 10
        self.speed = DEFAULT_SPEED
        self.menu_open = False
        self.build_stage(new_curve=True)

    def restart_stage_same_curve(self):
        self.notes = self.build_notes()
        self.song_time = 0
        self.revealed_segments = []
        self.flash_timer = 0
        self.menu_open = False
        self.message = MSG_CURVE_RETRY

    def build_stage(self, new_curve=True):
        if new_curve or not self.path_points:
            while True:
                self.randomize_curve()
                candidate_points = [self.calc_point(t) for t in range(PATH_LENGTH)]
                if self.path_is_playable(candidate_points):
                    self.path_points = candidate_points
                    break

        self.beat_interval = max(
            MIN_BEAT_INTERVAL,
            DEFAULT_BEAT_INTERVAL - (self.stage - 1) * 2,
        )
        self.notes = self.build_notes()
        self.song_time = 0
        self.revealed_segments = []
        self.flash_timer = 0
        self.hit_flash_kind = "perfect"
        self.menu_open = False
        self.message = MSG_STAGE.format(stage=self.stage)

    def randomize_curve(self):
        self.base_R = self.rng.randint(36, 68)
        self.base_r = self.rng.randint(9, 26)
        self.base_d = self.rng.randint(18, 52)
        self.sub_amp_x = self.rng.randint(4, 18)
        self.sub_amp_y = self.rng.randint(4, 18)
        self.sub_freq_x = self.rng.choice([2, 3, 4, 5, 6, 7])
        self.sub_freq_y = self.rng.choice([3, 4, 5, 6, 7, 8])
        self.phase_x = self.rng.randint(0, 359)
        self.phase_y = self.rng.randint(0, 359)
        self.mod_amp = self.rng.uniform(0.02, 0.09)
        self.mod_freq = self.rng.choice([2, 3, 4, 5])

    def make_matrix_columns(self):
        self.columns = []
        for x in range(4, SCREEN_W - 4, 12):
            chars = "".join(self.rng.choice(self.matrix_chars) for _ in range(24))
            self.columns.append(
                {
                    "x": x,
                    "offset": self.rng.randint(0, 160),
                    "speed": self.rng.choice([1, 1, 2, 2, 3]),
                    "length": self.rng.randint(7, 16),
                    "chars": chars,
                    "phase": self.rng.randint(0, 99),
                }
            )

    def make_noise_nodes(self):
        self.nodes = []
        for _ in range(18):
            x = self.rng.randint(18, SCREEN_W - 18)
            y = self.rng.randint(PLAY_TOP + 8, PLAY_BOTTOM - 8)
            blink = self.rng.choice([14, 18, 22, 26])
            self.nodes.append((x, y, blink))

    # ---------- 軌道とノーツ ----------
    def calc_point(self, t):
        mod = 1 + self.mod_amp * pyxel.sin(self.mod_freq * t)
        main_x = (self.base_R - self.base_r) * pyxel.cos(t)
        main_y = (self.base_R - self.base_r) * pyxel.sin(t)
        inner_ratio = (self.base_R - self.base_r) * t / self.base_r
        orbit_x = self.base_d * pyxel.cos(inner_ratio)
        orbit_y = -self.base_d * pyxel.sin(inner_ratio)
        sub_x = self.sub_amp_x * pyxel.cos(self.sub_freq_x * t + self.phase_x)
        sub_y = self.sub_amp_y * pyxel.sin(self.sub_freq_y * t + self.phase_y)
        x = (main_x + orbit_x + sub_x) * mod
        y = (main_y + orbit_y + sub_y) * mod
        return int(self.cx + x), int(self.cy + y)

    # ノーツ種類やステージ個性を入れる場所
    def build_notes(self):
        notes = []
        note_count = NOTE_COUNT_BASE + self.stage * NOTE_COUNT_STEP
        current_index = self.rng.randint(30, 120)

        for i in range(note_count):
            target_index = min(
                current_index + self.rng.randint(SPATIAL_GAP_MIN, SPATIAL_GAP_MAX),
                PATH_LENGTH - 2,
            )
            exit_index = min(
                target_index + max(32, (target_index - current_index) // 3),
                PATH_LENGTH - 1,
            )
            notes.append(
                {
                    "start_index": current_index,
                    "target_index": target_index,
                    "exit_index": exit_index,
                    "appear_time": i * self.beat_interval,
                    "hit_time": (i + 1) * self.beat_interval,
                    "vanish_time": (i + 1) * self.beat_interval
                    + self.beat_interval // 2,
                    "judged": False,
                    "result": "",
                }
            )
            current_index = target_index
            if current_index >= PATH_LENGTH - SPATIAL_GAP_MIN:
                break
        return notes

    def current_note(self):
        for note in self.notes:
            if not note["judged"]:
                return note
        return None

    def current_judge_point(self):
        note = self.current_note()
        if not note:
            return None
        return self.path_points[note["target_index"]]

    def current_timing_delta(self):
        note = self.current_note()
        if not note:
            return None
        return note["hit_time"] - self.song_time

    def current_note_active(self):
        note = self.current_note()
        if not note:
            return False
        progress = self.note_progress(note)
        return progress is not None and progress >= 0

    def note_progress(self, note):
        if not note:
            return None
        if self.song_time < note["appear_time"] or self.song_time > note["vanish_time"]:
            return None
        if self.song_time <= note["hit_time"]:
            span = max(1, note["hit_time"] - note["appear_time"])
            return (self.song_time - note["appear_time"]) / span
        span = max(1, note["vanish_time"] - note["hit_time"])
        return 1.0 + (self.song_time - note["hit_time"]) / span

    def note_position(self, note):
        progress = self.note_progress(note)
        if progress is None:
            return None

        if progress <= 1.0:
            idx = int(
                note["start_index"]
                + (note["target_index"] - note["start_index"]) * progress
            )
        else:
            idx = int(
                note["target_index"]
                + (note["exit_index"] - note["target_index"]) * min(progress - 1.0, 1.0)
            )

        idx = max(0, min(idx, len(self.path_points) - 1))
        return self.path_points[idx]

    def distance(self, x1, y1, x2, y2):
        dx = x1 - x2
        dy = y1 - y2
        return (dx * dx + dy * dy) ** 0.5

    def in_focus_zone(self, x, y, margin=0):
        rx = 74 + margin
        ry = 60 + margin
        return abs(x - self.cx) <= rx and abs(y - self.cy) <= ry

    def bg_fade(self, x, y):
        rx = 92.0
        ry = 74.0
        dx = abs(x - self.cx) / rx
        dy = abs(y - self.cy) / ry
        d = max(dx, dy)
        d = max(0.0, min(1.0, d))
        return d * d * (3.0 - 2.0 * d)

    def segment_age_limits(self, seg):
        if seg.get("focus", False):
            return SEG_BRIGHT_AGE_FOCUS, SEG_DIM_AGE_FOCUS, SEG_MARK_AGE_FOCUS
        return SEG_BRIGHT_AGE, SEG_DIM_AGE, SEG_MARK_AGE

    def update_segment_ages(self):
        for seg in self.revealed_segments:
            seg["age"] = seg.get("age", 0) + 1

        kept = []
        for seg in self.revealed_segments:
            _, _, mark_age = self.segment_age_limits(seg)
            if seg.get("age", 0) < mark_age:
                kept.append(seg)
        self.revealed_segments = kept

    # ---------- メニュー矩形 ----------
    def gear_rect(self):
        return SCREEN_W - 24, 8, 16, 16

    def pause_panel_rect(self):
        w = 156
        h = 112
        x = (SCREEN_W - w) // 2
        y = (SCREEN_H - h) // 2 - 4
        return x, y, w, h

    def point_in_rect(self, px, py, x, y, w, h):
        return x <= px < x + w and y <= py < y + h

    def resume_button_rect(self):
        x, y, w, h = self.pause_panel_rect()
        return x + 16, y + 34, w - 32, 16

    def retry_button_rect(self):
        x, y, w, h = self.pause_panel_rect()
        return x + 16, y + 56, w - 32, 16

    def new_button_rect(self):
        x, y, w, h = self.pause_panel_rect()
        return x + 16, y + 78, w - 32, 16

    def is_menu_area_tap(self):
        if not pyxel.btnp(pyxel.MOUSE_BUTTON_LEFT):
            return False

        x = pyxel.mouse_x
        y = pyxel.mouse_y
        gx, gy, gw, gh = self.gear_rect()
        if self.point_in_rect(x, y, gx, gy, gw, gh):
            return True

        if self.menu_open:
            px, py, pw, ph = self.pause_panel_rect()
            if self.point_in_rect(x, y, px, py, pw, ph):
                return True

        return False

    # ---------- 入力 ----------
    def tap_requested(self):
        mouse_tap = pyxel.btnp(pyxel.MOUSE_BUTTON_LEFT)
        key_tap = pyxel.btnp(pyxel.KEY_SPACE) or pyxel.btnp(pyxel.KEY_RETURN)
        return mouse_tap or key_tap

    def should_ignore_tap(self):
        if not pyxel.btnp(pyxel.MOUSE_BUTTON_LEFT):
            return False
        return pyxel.mouse_y < HUD_H or self.is_menu_area_tap()

    def is_keyboard_tap(self):
        return pyxel.btnp(pyxel.KEY_SPACE) or pyxel.btnp(pyxel.KEY_RETURN)

    def is_mouse_tap_on_target(self, judge_point, note_pos):
        judge_ok = (
            self.distance(pyxel.mouse_x, pyxel.mouse_y, judge_point[0], judge_point[1])
            <= TAP_RADIUS_MOBILE
        )

        note_ok = False
        if note_pos:
            note_ok = (
                self.distance(pyxel.mouse_x, pyxel.mouse_y, note_pos[0], note_pos[1])
                <= NOTE_TAP_RADIUS
            )

        return judge_ok or note_ok

    def register_empty_tap_miss(self):
        self.combo = 0
        self.message = MSG_MISS

    def handle_ui_buttons(self):
        if not pyxel.btnp(pyxel.MOUSE_BUTTON_LEFT):
            return

        x = pyxel.mouse_x
        y = pyxel.mouse_y

        gx, gy, gw, gh = self.gear_rect()
        if self.point_in_rect(x, y, gx, gy, gw, gh):
            self.menu_open = not self.menu_open
            if self.menu_open:
                self.message = MSG_PAUSED
            return

        if not self.menu_open:
            return

        rx, ry, rw, rh = self.resume_button_rect()
        tx, ty, tw, th = self.retry_button_rect()
        nx, ny, nw, nh = self.new_button_rect()

        if self.point_in_rect(x, y, rx, ry, rw, rh):
            self.menu_open = False
            return

        if self.point_in_rect(x, y, tx, ty, tw, th):
            self.restart_stage_same_curve()
            return

        if self.point_in_rect(x, y, nx, ny, nw, nh):
            self.build_stage(new_curve=True)
            self.message = MSG_CURVE_NEW
            return

        px, py, pw, ph = self.pause_panel_rect()
        if not self.point_in_rect(x, y, px, py, pw, ph):
            self.menu_open = False

    # ---------- 判定 ----------
    def classify_tap_result(self, delta):
        abs_delta = abs(delta)
        if abs_delta <= HIT_WINDOW_PERFECT:
            return "perfect"
        if abs_delta <= HIT_WINDOW_GOOD:
            return "good"
        if delta > 0:
            return "early"
        return "late"

    def append_revealed_segment(self, note):
        end_x, end_y = self.path_points[note["target_index"]]
        self.revealed_segments.append(
            {
                "start_index": note["start_index"],
                "end_index": note["target_index"],
                "result": note["result"],
                "age": 0,
                "focus": self.in_focus_zone(end_x, end_y, 8),
            }
        )

    # FEVERゲージ、倍率、回復などの報酬を入れる場所
    def apply_result_state(self, result):
        rule = RESULT_RULES[result]

        # コンボ更新
        if rule["combo_mode"] == "reset":
            self.combo = 0
        else:
            self.combo += rule["combo_add"]
            self.best_combo = max(self.best_combo, self.combo)

        # FEVER設定
        was_fever = self.fever

        # 20コンボ以上の場合
        if self.combo >= 20:

            # FEVER設定をオンにする
            self.fever = True

            # 今ちょうど FEVER に入った瞬間だけ、通知タイマーを45にする
            if not was_fever:
                self.fever_notice_timer = 45

        # 20コンボ未満ならFEVER設定オフ
        else:
            self.fever = False

        # ライフ更新
        self.lives += rule["life_add"]

        # スコア加算
        multiplier = 2 if self.fever else 1
        # スコア倍率をかける（20 コンボ以上のときだけスコアをx2にする）
        self.score += (rule["score_base"] + self.combo * rule["score_combo"]) * multiplier

        # メッセージ更新
        self.message = rule["message"]
        self.hit_flash_kind = rule["flash_kind"]
        self.flash_timer = rule["flash_timer"]

        if rule["gain_speed"]:
            self.gain_speed_on_success()

        self.play_sound(0, rule["sound"])

    def judge_note_result(self, note, result):
        note["judged"] = True
        note["result"] = result
        self.append_revealed_segment(note)
        self.apply_result_state(result)

    def handle_tap(self):
        if not self.tap_requested():
            return

        if self.should_ignore_tap():
            return

        note = self.current_note()
        judge_point = self.current_judge_point()
        note_pos = self.note_position(note)

        if not note or not judge_point:
            self.register_empty_tap_miss()
            return

        if not self.is_keyboard_tap() and pyxel.btnp(pyxel.MOUSE_BUTTON_LEFT):
            if not self.is_mouse_tap_on_target(judge_point, note_pos):
                self.register_empty_tap_miss()
                return

        delta = note["hit_time"] - self.song_time
        result = self.classify_tap_result(delta)
        self.judge_note_result(note, result)

    def handle_miss(self):
        note = self.current_note()
        if not note:
            return

        delta = note["hit_time"] - self.song_time
        if delta < -HIT_WINDOW_GOOD:
            self.judge_note_result(note, "miss")

    # ---------- 更新 ----------
    def update(self):
        if pyxel.btnp(pyxel.KEY_Q):
            pyxel.quit()

        if self.state == "title":
            if self.tap_requested():
                self.state = "play"
                self.reset_run()
            return

        if self.state == "gameover":
            if pyxel.btnp(pyxel.KEY_R) or pyxel.btnp(pyxel.MOUSE_BUTTON_LEFT):
                self.state = "play"
                self.reset_run()
            return

        self.update_play()

    def update_play(self):
        self.handle_ui_buttons()

        if self.menu_open:
            self.message = MSG_PAUSED
            return

        if pyxel.btnp(pyxel.KEY_R):
            self.restart_stage_same_curve()
        if pyxel.btnp(pyxel.KEY_N):
            self.build_stage(new_curve=True)
            self.message = MSG_CURVE_NEW

        self.song_time += self.speed

        # 入力を先に処理して、境界フレームの押し負け感を減らす
        self.handle_tap()
        self.handle_miss()

        if self.flash_timer > 0:
            self.flash_timer -= 1

        self.update_segment_ages()

        if self.lives <= 0:
            self.state = "gameover"
            return

        if self.notes and all(note["judged"] for note in self.notes):
            self.stage += 1
            self.play_sound(0, 3)
            self.build_stage(new_curve=True)

    # ---------- 背景描画 ----------
    # コンボやFEVERで画面のテンションを上げる場所
    def draw_background(self):
        pyxel.cls(0)
        t = pyxel.frame_count

        for y in range(PLAY_TOP, PLAY_BOTTOM, 6):
            if y % 12 == 0:
                pyxel.line(0, y, SCREEN_W, y, 1)

        for col in self.columns:
            x = col["x"]
            head_y = (t * col["speed"] + col["offset"]) % (PLAY_BOTTOM - PLAY_TOP + 80)
            head_y += PLAY_TOP - 64

            for i in range(col["length"]):
                y = int(head_y - i * 8)
                if not (PLAY_TOP <= y < PLAY_BOTTOM):
                    continue

                fade = self.bg_fade(x, y)
                if fade < 0.08:
                    continue

                gate = (x * 7 + y * 5 + t + i * 11 + col["phase"]) % 100
                if fade < 0.22 and gate > 22:
                    continue
                if fade < 0.40 and gate > 48:
                    continue

                ch = col["chars"][(i + t // 8 + col["phase"]) % len(col["chars"])]

                if fade < 0.22:
                    c = 1
                elif fade < 0.45:
                    c = 3
                else:
                    if i == 0:
                        c = 7
                    elif i < 3:
                        c = 11
                    else:
                        c = 3

                if self.fever:
                    if c == 1:
                        c = 3
                    elif c == 3:
                        c = 11

                self.text(x, y, ch, c)

        for x in range(0, SCREEN_W, 32):
            pyxel.line(x, PLAY_TOP, x, PLAY_BOTTOM, 1)

        for x, y, blink in self.nodes:
            fade = self.bg_fade(x, y)
            if fade < 0.20:
                continue

            if (t + x + y) % blink < 2:
                col = 11 if fade > 0.55 else 3
                pyxel.rect(x - 1, y - 1, 3, 3, col)
            else:
                pyxel.pset(x, y, 3 if fade > 0.35 else 1)

        if self.flash_timer > 0:
            if self.hit_flash_kind == "perfect":
                col1, col2 = 7, 11
            elif self.hit_flash_kind == "good":
                col1, col2 = 11, 3
            else:
                col1, col2 = 3, 1

            r1 = 112 - self.flash_timer * 5
            r2 = 76 - self.flash_timer * 3
            if r1 > 8:
                pyxel.circb(self.cx, self.cy, r1, col1)
            if r2 > 8:
                pyxel.circb(self.cx, self.cy, r2, col2)

    # ---------- スピログラフ描画 ----------
    def segment_palette(self, result):
        if result == "perfect":
            return [11, 10, 7, 11]
        if result == "good":
            return [3, 11, 3, 10]
        if result in ("early", "late", "miss"):
            return [1, 3, 1, 3]
        return [3, 11, 3, 10]

    def marker_color(self, result):
        if result == "perfect":
            return 7
        if result == "good":
            return 11
        return 3

    def draw_revealed_curve(self):
        for seg in self.revealed_segments:
            start_idx = seg["start_index"]
            end_idx = seg["end_index"]
            result = seg["result"]
            age = seg.get("age", 0)
            bright_age, dim_age, mark_age = self.segment_age_limits(seg)

            if age < dim_age:
                for i in range(start_idx + 1, end_idx + 1):
                    x1, y1 = self.path_points[i - 1]
                    x2, y2 = self.path_points[i]

                    if age < bright_age:
                        palette = self.segment_palette(result)
                        if result in ("perfect", "good"):
                            glow = 3 if result == "good" else 11
                            pyxel.line(x1 + 1, y1, x2 + 1, y2, glow)
                            pyxel.line(x1 - 1, y1, x2 - 1, y2, 1)
                            pyxel.line(x1, y1 + 1, x2, y2 + 1, 1)
                        color = palette[((i - start_idx) // 18) % len(palette)]
                        pyxel.line(x1, y1, x2, y2, color)
                    else:
                        if result == "perfect":
                            color = 11 if ((i - start_idx) // 28) % 2 == 0 else 3
                        elif result == "good":
                            color = 3
                        else:
                            color = 1
                        pyxel.line(x1, y1, x2, y2, color)

            if age < mark_age:
                mx, my = self.path_points[end_idx]
                if age < bright_age:
                    mc = self.marker_color(result)
                    inner = 3 if result != "miss" else 1
                    dot = 7 if result == "perfect" else mc
                elif age < dim_age:
                    mc = 3 if result != "miss" else 1
                    inner = 1
                    dot = 11 if result == "perfect" else mc
                else:
                    mc = 1
                    inner = 1
                    dot = 3 if result != "miss" else 1

                pyxel.rectb(mx - 4, my - 4, 8, 8, mc)
                pyxel.rectb(mx - 2, my - 2, 4, 4, inner)
                pyxel.pset(mx, my, dot)

        current = self.current_note()
        progress = self.note_progress(current) if current else None
        if current and progress is not None:
            if progress <= 1.0:
                current_idx = int(
                    current["start_index"]
                    + (current["target_index"] - current["start_index"]) * progress
                )
            else:
                current_idx = int(
                    current["target_index"]
                    + (current["exit_index"] - current["target_index"])
                    * min(progress - 1.0, 1.0)
                )

            live_start = max(current["start_index"] + 1, current_idx - 120)
            for i in range(live_start, current_idx + 1):
                x1, y1 = self.path_points[i - 1]
                x2, y2 = self.path_points[i]
                age_ratio = (i - live_start) / max(1, current_idx - live_start + 1)

                if age_ratio < 0.45:
                    color = 3
                elif age_ratio < 0.8:
                    color = 11
                else:
                    color = 7

                pyxel.line(x1, y1, x2, y2, color)

    def draw_notes(self):
        current = self.current_note()
        if not current:
            return

        pos = self.note_position(current)
        if not pos:
            return

        x, y = pos
        pulse = (pyxel.frame_count // 4) % 2

        pyxel.rect(x - 7, y - 7, 14, 14, 1)
        pyxel.rectb(x - 6, y - 6, 12, 12, 11)
        pyxel.rectb(x - 4, y - 4, 8, 8, 7 if pulse else 10)
        pyxel.rect(x - 1, y - 1, 2, 2, 7)

    def draw_judge_point(self):
        judge_point = self.current_judge_point()
        if not judge_point:
            return

        x, y = judge_point
        delta = self.current_timing_delta()
        note_active = self.current_note_active()
        near_hit = note_active and delta is not None and abs(delta) <= HIT_WINDOW_GOOD
        very_near = (
            note_active and delta is not None and abs(delta) <= HIT_WINDOW_PERFECT
        )

        ring_color = 11 if near_hit else 3
        core_color = 7 if very_near else 11
        pulse = (pyxel.frame_count // 8) % 2
        outer = TAP_RADIUS_MOBILE - 8 + (pulse if near_hit else 0)

        pyxel.rectb(x - outer // 2, y - outer // 2, outer, outer, 1)
        pyxel.rectb(x - 12, y - 12, 24, 24, ring_color)
        pyxel.rectb(x - 6, y - 6, 12, 12, core_color)
        pyxel.rect(x - 1, y - 1, 2, 2, 7)

        pyxel.line(x - 18, y, x - 8, y, ring_color)
        pyxel.line(x + 8, y, x + 18, y, ring_color)
        pyxel.line(x, y - 18, x, y - 8, ring_color)
        pyxel.line(x, y + 8, x, y + 18, ring_color)

    # ---------- UI ----------
    # コンボやFEVERで画面のテンションを上げる場所
    def draw_hud(self):
        pyxel.rect(0, 0, SCREEN_W, HUD_H, 0)
        pyxel.line(0, HUD_H - 1, SCREEN_W, HUD_H - 1, 3)

        self.text(6, 6, MSG_TITLE, 11)
        self.text(6, 18, f"STG {self.stage}  SC {self.score}", 3)
        self.text(124, 18, MSG_COMBO_LABEL.format(combo=self.combo), 11)
        self.text(184, 18, MSG_LIFE_LABEL.format(life=self.lives), 7)

        self.text(6, 29, MSG_SPEED_LABEL.format(speed=f"{self.speed:.1f}"), 3)
        self.text(72, 29, MSG_BEAT_LABEL.format(beat=self.beat_interval), 11)
        self.text(130, 29, self.message[:18], 7)

    def draw_gear_icon(self, x, y):
        pyxel.rectb(x, y, 16, 16, 11)
        pyxel.circb(x + 8, y + 8, 4, 11)
        pyxel.pset(x + 8, y + 8, 7)
        pyxel.line(x + 8, y + 1, x + 8, y + 3, 11)
        pyxel.line(x + 8, y + 13, x + 8, y + 15, 11)
        pyxel.line(x + 1, y + 8, x + 3, y + 8, 11)
        pyxel.line(x + 13, y + 8, x + 15, y + 8, 11)
        pyxel.line(x + 3, y + 3, x + 4, y + 4, 11)
        pyxel.line(x + 12, y + 12, x + 13, y + 13, 11)
        pyxel.line(x + 12, y + 4, x + 13, y + 3, 11)
        pyxel.line(x + 3, y + 13, x + 4, y + 12, 11)

    def draw_pause_panel(self):
        x, y, w, h = self.pause_panel_rect()
        pyxel.rect(x, y, w, h, 0)
        pyxel.rectb(x, y, w, h, 11)
        pyxel.rect(x + 8, y + 8, w - 16, 18, 1)
        self.draw_text_center(x, y + 13, w, MSG_PAUSED, 11)

        rx, ry, rw, rh = self.resume_button_rect()
        tx, ty, tw, th = self.retry_button_rect()
        nx, ny, nw, nh = self.new_button_rect()

        self.draw_menu_button(rx, ry, rw, rh, BTN_RESUME, 11)
        self.draw_menu_button(tx, ty, tw, th, BTN_RETRY, 3)
        self.draw_menu_button(nx, ny, nw, nh, BTN_NEW, 11)

    def draw_touch_ui(self):
        gx, gy, gw, gh = self.gear_rect()
        self.draw_gear_icon(gx, gy)
        if self.menu_open:
            self.draw_pause_panel()

    def draw_title(self):
        self.draw_background()

        pyxel.rect(14, 34, 228, 160, 0)
        pyxel.rectb(14, 34, 228, 160, 11)
        pyxel.rect(22, 44, 212, 18, 1)
        self.text(68, 49, MSG_TITLE, 11)
        self.text(24, 82, MSG_TITLE_1, 3)
        self.text(24, 95, MSG_TITLE_2, 11)
        self.text(24, 116, MSG_TITLE_3, 7)
        self.text(24, 129, MSG_TITLE_4, 7)
        self.text(36, 168, MSG_TITLE_START, 11)

    def draw_gameover(self):
        self.draw_background()

        pyxel.rect(34, 76, 188, 98, 0)
        pyxel.rectb(34, 76, 188, 98, 11)
        self.text(94, 92, MSG_GAME_OVER, 7)
        self.text(72, 116, MSG_GAME_OVER_SCORE.format(score=self.score), 3)
        self.text(72, 128, MSG_GAME_OVER_STAGE.format(stage=self.stage), 11)
        self.text(72, 140, MSG_GAME_OVER_COMBO.format(combo=self.best_combo), 7)
        self.text(56, 156, MSG_GAME_OVER_RETRY, 11)

    # ---------- 全体描画 ----------
    def draw(self):
        if self.state == "title":
            self.draw_title()
            return

        if self.state == "gameover":
            self.draw_gameover()
            return

        self.draw_background()
        self.draw_revealed_curve()
        self.draw_notes()
        self.draw_judge_point()
        self.draw_hud()
        self.draw_touch_ui()

    def path_is_playable(self, points):
        min_x = min(x for x, y in points)
        max_x = max(x for x, y in points)
        min_y = min(y for x, y in points)
        max_y = max(y for x, y in points)

        return (
            min_x >= SAFE_MARGIN
            and max_x <= SCREEN_W - SAFE_MARGIN
            and min_y >= PLAY_TOP + SAFE_MARGIN
            and max_y <= PLAY_BOTTOM - SAFE_MARGIN
        )
App()
