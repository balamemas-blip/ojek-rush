// Warung Rush — customers: arrivals, orders, patience, leaving.
// A customer walks in, sits, orders, waits, then either pays happily or
// storms out. Difficulty (arrival speed, patience, double orders) scales
// with how far the day has gone.

import { CUSTOMERS, DAY, DISH_KEYS, LAYOUT } from './config.js';
import { dayProgress, freeTable, showMessage, addFloater } from './state.js';
import { sfx } from './audio.js';

const SKINS = [
  { shirt: '#e74c3c', skin: '#f1c27d', hat: null },
  { shirt: '#3498db', skin: '#e0ac69', hat: 'cap' },
  { shirt: '#9b59b6', skin: '#ffdbac', hat: 'band' },
  { shirt: '#16a085', skin: '#c68642', hat: null },
  { shirt: '#f39c12', skin: '#f1c27d', hat: 'cap' },
  { shirt: '#e67e22', skin: '#8d5524', hat: 'band' },
];

function pickItems(progress) {
  const twoChance =
    CUSTOMERS.doubleOrderChanceStart +
    (CUSTOMERS.doubleOrderChanceEnd - CUSTOMERS.doubleOrderChanceStart) * progress;
  const count = Math.random() < twoChance ? 2 : 1;
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push(DISH_KEYS[Math.floor(Math.random() * DISH_KEYS.length)]);
  }
  return items;
}

function patienceFor(progress) {
  return (
    CUSTOMERS.patienceStart +
    (CUSTOMERS.patienceEnd - CUSTOMERS.patienceStart) * progress
  );
}

export function updateArrivals(state, dt) {
  if (state.screen !== 'playing') return;
  state.nextCustomerIn -= dt;
  if (state.nextCustomerIn > 0) return;
  const progress = dayProgress(state);
  const interval =
    CUSTOMERS.arriveIntervalStart +
    (CUSTOMERS.arriveIntervalEnd - CUSTOMERS.arriveIntervalStart) * progress;
  state.nextCustomerIn = interval * (0.85 + Math.random() * 0.3);
  const table = freeTable(state);
  if (table === -1) return; // warung full — the next one waits outside
  const skin = SKINS[state.customerSeq % SKINS.length];
  const patience = patienceFor(progress);
  state.customers.push({
    id: ++state.customerSeq,
    table,
    state: 'arriving', // arriving -> waiting (order shown) -> ordered -> done/angry
    items: pickItems(progress),
    patience,
    patienceMax: patience,
    sitAt: state.time + CUSTOMERS.sitDelaySeconds,
    skin,
    bob: Math.random() * Math.PI * 2,
  });
}

export function updateCustomers(state, dt) {
  if (state.screen !== 'playing') return;
  for (const c of state.customers) {
    if (c.state === 'arriving' && state.time >= c.sitAt) {
      c.state = 'waiting';
    }
    if (c.state === 'waiting' || c.state === 'ordered') {
      c.patience -= dt;
      if (c.patience <= 0) {
        loseCustomer(state, c);
      }
    }
  }
  state.customers = state.customers.filter(
    (c) => c.state !== 'done' && c.state !== 'angry',
  );
}

function loseCustomer(state, c) {
  c.state = 'angry';
  state.hearts -= 1;
  state.lost += 1;
  state.combo = 0;
  // Their ticket, if any, is void — the kitchen stops cooking for them.
  state.tickets = state.tickets.filter((t) => t.customerId !== c.id);
  for (const st of state.stations) {
    if (st.cooking && st.cooking.customerId === c.id) {
      st.cooking = null;
      st.ready = false;
    }
  }
  const t = LAYOUT.tables[c.table];
  addFloater(state, t.x, t.y - 90, 'MARAH!', '#c0392b');
  sfx.angry();
  showMessage(state, 'Pelanggan pulang marah — hati berkurang!', 2.5);
}

// Take the order: the customer stops waiting, a ticket goes on the rail.
export function takeOrder(state, table) {
  const c = state.customers.find((x) => x.table === table);
  if (!c || c.state !== 'waiting') return false;
  c.state = 'ordered';
  state.tickets.push({
    id: ++state.ticketSeq,
    customerId: c.id,
    items: c.items.map((dish) => ({ dish, done: false })),
  });
  sfx.takeOrder();
  return true;
}

export function ticketForCustomer(state, customerId) {
  return state.tickets.find((t) => t.customerId === customerId) || null;
}

export function isOrderReady(state, c) {
  const t = ticketForCustomer(state, c.id);
  if (!t) return false;
  return t.items.every((it) => it.done);
}
