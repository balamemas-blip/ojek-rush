# Warung Rush v2 — build log

Entry for make.fun best-game-01 ($1,000). User prompt: "coba buat yang beda buat ojek rushnya".
Deadline: 19 Nov 2026 01:00 WIB (entries_close 2026-11-18T18:00:00Z).

## Game design

**Warung Rush — "Sore di Warung Bu Tini"**: a time-management serving game
(canvas 2D, mouse + keyboard). You run a small warung at dinner rush.

- 4 tables. Customers arrive, sit, and show an order bubble (nasi goreng,
  mie ayam, es teh — 1 or 2 items). Click a table (or select with Left/Right
  and press Enter) to take the order; the ticket goes on the order rail.
- Cook with keys 1/2/3 (or click a station): Wok = nasi goreng (4s),
  Panci = mie ayam (5s), Kulkas = es teh (2.5s). Finished dishes stack on
  the serving counter. Serve by interacting with a customer whose whole
  order is ready — coins + tip by remaining patience.
- Each customer has a patience bar. It runs out → they leave angry, lose 1
  of 3 hearts. Serve the day target (10 orders) before the 150s day timer
  ends to win; 3 angry customers or time up = lose.
- Difficulty ramps: arrivals get faster, patience shorter, 2-item orders
  more common. Combo grows the tip while no one leaves angry.
- Screens: title (how to play), playing, paused, day complete (win),
  day failed (lose). HUD: coins, hearts, served/target, timer, combo.
- Sound: tiny WebAudio synth (click, ding, coin, buzz), started on first
  gesture. All art is drawn in code — no assets, no network.

## Why this is different from v1

v1 was a top-down driving/delivery arcade game (steer a rider, dodge
traffic, deliver orders on the road). v2 is a stationary time-management
game: no driving, no traffic, no lanes — orders, cooking timers, patience
bars and serving. Different code, different mechanics, different genre.

## Files (one job each)

- game/index.html — canvas + module scripts
- game/src/config.js — constants: dishes, timings, prices, layout
- game/src/audio.js — WebAudio synth beeps
- game/src/state.js — state creation / reset / day progress
- game/src/customers.js — arrivals, patience, leaving
- game/src/kitchen.js — stations, cooking, ready-dish stacks
- game/src/input.js — mouse + keyboard
- game/src/render.js — all canvas drawing (scene, HUD, screens)
- game/src/main.js — game loop, screens, win/lose, debug handle
- serve.ts — local dev server (own code)
- main.ts — entrypoint: copy game/ + screenshots/, write dossier.json
- README.md — from the competition template
- LICENSE — MIT (kit starter)

## Build steps

1. Write game files (this session).
2. Serve locally, play in headless Chromium, fix bugs.
3. Screenshot driver (real play via keyboard/mouse): 1-title, 2-play,
   3-rush, 4-end.
4. Run main.ts twice into two dirs, diff — must be byte-identical.
5. Bundle transcripts (kit CLI, --muse-usage) + kit check.
6. Push to github.com/balamemas-blip/ojek-rush (PAT route). Do NOT submit.

## Tuning notes (from driver runs)

- Run 1 (19:0x WIB): import bug — kitchen.js imported customerAt from
  customers.js (it lives in state.js). Fixed; driver then played a full
  game: win, 10 served, 185 coins, 0 hearts lost, no page errors.
- But the warung felt empty (1 customer at a time) and the win came too
  fast (~70s of a 150s day). Tuned: arrivals 9→7s start, 4.5→3.5s end;
  patience 48→42s start, 30→26s end; double orders 15→20% start,
  45→50% end; target 10→12. Also removed emoji from canvas text (headless
  fonts may render them as boxes) and made the title target dynamic.
- Render fixes from screenshot review: HUD right side overlapped (Combo /
  Sore / Suara) — restructured, Sore label dropped; counter hint text
  collided with dish icons — removed (bottom bar explains serving);
  MEJA labels hid behind seated customers — drawn only on empty tables;
  message toast moved from y=132 (over the order bubbles) to y=660.
- Final driver run (19:15 WIB): all 4 shots, win again (189 koin, 12/12),
  0 hearts lost, no page errors. Screenshots 1280x720, 54–80 KiB each.
- Determinism (19:19 WIB): main.ts run twice into /tmp/wr-out1 and
  /tmp/wr-out2 — diff -r exit 0, byte-identical. dossier.json 387,177
  bytes, schema makefun/dossier/v1, 9 source files (34,479 bytes),
  4 embedded screenshots with sha256s.
- Bundle (trial, 19:23 WIB): 1,417,042 bytes, sha256
  3de8f3e5fd45993d345bed4859c3f0ef2ceb867f010fb6101192b38134eccb1c.
  4 sessions (this build 0c1a47f4, v1 build 25d034bd, parent 4557a8ee,
  d2537584), prompt handed-off with the user's exact words, MCP none,
  declared harness muse-app / 1.3 / muse-spark-1.3 / meta / default.
  The pre-open session bdcf35ad was correctly left out (thinking window).
  0 usage rows attached — the trial bundle is NOT submittable as-is:
  the parent must re-bundle with --muse-usage after this session ends
  (usage rows are written only when the subagent's run completes).
- Kit check (19:24 WIB): 12 passed, 1 failed, 6 skipped, 5 at-submission.
  thinking_reproduces 98.6% authored (898/910 lines, need 30%);
  thinking_turns 194 (need 5); thinking_revised render.js from 7
  messages, main.ts from 2. The single failure is thinking_priced
  (0 usage rows) — fixed only by the parent's re-bundle with usage rows.
  At-submission checks (repo_public, repo_owner, repo_created_after_open,
  commit_in_repo, duplicate_snapshot) pass once the commit is pushed to
  the public repo balamemas-blip/ojek-rush (created 2026-11-16, after open).
