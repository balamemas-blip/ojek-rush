// Warung Rush — state: create a fresh day, reset, and day progress.
// Everything the game tracks lives in one object so the loop, input and
// render all read the same truth.

import { DAY, DISHES, DISH_KEYS, LAYOUT } from './config.js';

export function createState() {
  return {
    screen: 'title', // title | playing | paused | win | lose
    time: 0, // seconds since the day started
    timeLeft: DAY.lengthSeconds,
    coins: 0,
    hearts: DAY.hearts,
    served: 0,
    lost: 0,
    combo: 0,
    bestCombo: 0,
    selectedTable: 0,
    nextCustomerIn: 0,
    customers: [], // {id, table, state, items, patience, patienceMax, arriveT, servedAt}
    tickets: [], // {id, customerId, items:[{dish, done}], taken}
    stations: DISH_KEYS.map((dish) => ({
      dish,
      cooking: null, // {ticketId, itemIndex, dish, endsAt}
      ready: false,
    })),
    readyStack: { nasi: 0, mie: 0, teh: 0 }, // finished dishes on the counter
    floaters: [], // {x, y, text, color, endsAt} — coin popups and hints
    message: '', // one-line hint shown under the rail
    messageUntil: 0,
    stats: { cooked: 0, tips: 0 },
    customerSeq: 0,
    ticketSeq: 0,
  };
}

export function dayProgress(state) {
  return Math.min(1, state.time / DAY.lengthSeconds);
}

export function showMessage(state, text, seconds = 2) {
  state.message = text;
  state.messageUntil = state.time + seconds;
}

export function addFloater(state, x, y, text, color) {
  state.floaters.push({ x, y, text, color, endsAt: state.time + 1.2 });
}

export function freeTable(state) {
  for (let i = 0; i < LAYOUT.tables.length; i++) {
    if (!state.customers.some((c) => c.table === i)) return i;
  }
  return -1;
}

export function customerAt(state, table) {
  return state.customers.find((c) => c.table === table) || null;
}

export function dishPrice(dish) {
  return DISHES[dish].price;
}

export function orderPrice(items) {
  return items.reduce((sum, d) => sum + dishPrice(d), 0);
}
