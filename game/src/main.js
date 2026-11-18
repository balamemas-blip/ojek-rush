// Warung Rush — main: the game loop, screen flow, win/lose, and wiring.
// The loop ticks state forward, renders every frame, and exposes a small
// debug handle (window.__warung) so the screenshot driver can read the
// real game state while it plays.

import { DAY, LAYOUT } from './config.js';
import { createState, showMessage } from './state.js';
import { updateArrivals, updateCustomers, takeOrder } from './customers.js';
import { startCooking, updateKitchen, serveCustomer } from './kitchen.js';
import { attachInput } from './input.js';
import { render } from './render.js';
import { sfx, toggleMute, unlockAudio } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let state = createState();
let lastTs = 0;

function startDay() {
  state = createState();
  state.screen = 'playing';
  state.nextCustomerIn = 2;
  unlockAudio();
  sfx.takeOrder();
}

function endDay(won) {
  state.screen = won ? 'win' : 'lose';
  if (won) sfx.win();
  else sfx.lose();
}

function interactSelected() {
  if (state.screen !== 'playing') return;
  const table = state.selectedTable;
  const c = state.customers.find((x) => x.table === table);
  if (!c) {
    showMessage(state, 'Meja ' + (table + 1) + ' kosong — tunggu pelanggan datang', 1.4);
    return;
  }
  if (c.state === 'waiting') {
    takeOrder(state, table);
  } else if (c.state === 'ordered') {
    const result = serveCustomer(state, table);
    if (result === 'win') endDay(true);
  }
}

function tick(ts) {
  const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0);
  lastTs = ts;
  if (state.screen === 'playing') {
    state.time += dt;
    state.timeLeft = Math.max(0, DAY.lengthSeconds - state.time);
    updateArrivals(state, dt);
    updateCustomers(state, dt);
    updateKitchen(state);
    state.floaters = state.floaters.filter((f) => state.time < f.endsAt);
    if (state.hearts <= 0) {
      endDay(false);
    } else if (state.timeLeft <= 0) {
      endDay(state.served >= DAY.targetServed);
    }
  }
  render(ctx, state, ts / 1000);
  requestAnimationFrame(tick);
}

attachInput(canvas, {
  onTableClick(table) {
    if (state.screen === 'title') { startDay(); return; }
    if (state.screen === 'win' || state.screen === 'lose') { startDay(); return; }
    if (state.screen !== 'playing') return;
    state.selectedTable = table;
    interactSelected();
  },
  onCook(dish) {
    if (state.screen !== 'playing') return;
    if (!startCooking(state, dish)) {
      showMessage(state, 'Tidak ada pesanan yang butuh itu (atau dapur penuh)', 1.4);
    }
  },
  onBackgroundClick() {
    if (state.screen === 'title' || state.screen === 'win' || state.screen === 'lose') startDay();
  },
  onSelect(dir) {
    if (state.screen !== 'playing') return;
    state.selectedTable = (state.selectedTable + dir + LAYOUT.tables.length) % LAYOUT.tables.length;
    sfx.click();
  },
  onConfirm() {
    if (state.screen === 'title' || state.screen === 'win' || state.screen === 'lose') startDay();
    else if (state.screen === 'playing') interactSelected();
  },
  onPause() {
    if (state.screen === 'playing') state.screen = 'paused';
    else if (state.screen === 'paused') state.screen = 'playing';
  },
  onMute() {
    const m = toggleMute();
    showMessage(state, m ? 'Suara mati' : 'Suara hidup', 1.2);
  },
  onRestartKey() {
    if (state.screen === 'win' || state.screen === 'lose' || state.screen === 'paused') startDay();
  },
});

// Debug handle for the screenshot driver: read-only view of the live game.
window.__warung = {
  get screen() { return state.screen; },
  get time() { return state.time; },
  get timeLeft() { return state.timeLeft; },
  get coins() { return state.coins; },
  get hearts() { return state.hearts; },
  get served() { return state.served; },
  get combo() { return state.combo; },
  get selectedTable() { return state.selectedTable; },
  get tickets() { return state.tickets.map((t) => ({ id: t.id, customerId: t.customerId, items: t.items.map((i) => ({ dish: i.dish, done: i.done })) })); },
  get readyStack() { return { ...state.readyStack }; },
  get stations() { return state.stations.map((s) => ({ dish: s.dish, cooking: s.cooking ? { dish: s.cooking.dish, endsAt: s.cooking.endsAt } : null })); },
  get customers() {
    return state.customers.map((c) => ({
      id: c.id, table: c.table, state: c.state, items: [...c.items],
      patience: c.patience, patienceMax: c.patienceMax,
    }));
  },
};

requestAnimationFrame(tick);
