// Warung Rush — input: mouse clicks and keyboard, both driving the same
// actions. Click a table to select + interact with it; click a station to
// cook its dish; keys 1/2/3 cook, Left/Right pick a table, Enter interacts,
// P pauses, M mutes, R restarts.

import { DISH_KEYS, LAYOUT } from './config.js';
import { unlockAudio } from './audio.js';

export function attachInput(canvas, hooks) {
  function toGameCoords(ev) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((ev.clientX - rect.left) / rect.width) * canvas.width,
      y: ((ev.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function tableAt(x, y) {
    for (let i = 0; i < LAYOUT.tables.length; i++) {
      const t = LAYOUT.tables[i];
      const dx = x - t.x;
      const dy = y - t.y;
      if (dx * dx + dy * dy <= LAYOUT.tableRadius * LAYOUT.tableRadius) return i;
    }
    return -1;
  }

  function stationAt(x, y) {
    if (y < LAYOUT.kitchenY || y > LAYOUT.kitchenY + LAYOUT.kitchenHeight) return null;
    for (const s of LAYOUT.stations) {
      if (x >= s.x && x <= s.x + s.w) return s.dish;
    }
    return null;
  }

  canvas.addEventListener('click', (ev) => {
    unlockAudio();
    const { x, y } = toGameCoords(ev);
    const table = tableAt(x, y);
    if (table !== -1) {
      hooks.onTableClick(table);
      return;
    }
    const dish = stationAt(x, y);
    if (dish) {
      hooks.onCook(dish);
      return;
    }
    hooks.onBackgroundClick();
  });

  window.addEventListener('keydown', (ev) => {
    if (ev.repeat) return;
    unlockAudio();
    const k = ev.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
      hooks.onSelect(-1);
      ev.preventDefault();
    } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
      hooks.onSelect(1);
      ev.preventDefault();
    } else if (k === 'Enter' || k === ' ') {
      hooks.onConfirm();
      ev.preventDefault();
    } else if (k === '1' || k === '2' || k === '3') {
      hooks.onCook(DISH_KEYS[Number(k) - 1]);
    } else if (k === 'p' || k === 'P' || k === 'Escape') {
      hooks.onPause();
    } else if (k === 'm' || k === 'M') {
      hooks.onMute();
    } else if (k === 'r' || k === 'R') {
      hooks.onRestartKey();
    }
  });
}
