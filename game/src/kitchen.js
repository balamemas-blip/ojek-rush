// Warung Rush — kitchen: stations, cooking, ready dishes, serving.
// Each station cooks one dish at a time. A finished dish stacks on the
// serving counter; serving a customer eats the dishes their order needs.

import { DAY, DISHES, LAYOUT, TIP } from './config.js';
import { addFloater, customerAt, orderPrice, showMessage } from './state.js';
import { sfx } from './audio.js';
import { ticketForCustomer } from './customers.js';

// Start cooking `dish` for the oldest ticket that still needs it.
export function startCooking(state, dish) {
  if (state.screen !== 'playing') return false;
  const station = state.stations.find((s) => s.dish === dish);
  if (!station || station.cooking) return false;
  for (const ticket of state.tickets) {
    const item = ticket.items.find((it) => it.dish === dish && !it.done);
    if (!item) continue;
    station.cooking = {
      ticketId: ticket.id,
      customerId: ticket.customerId,
      dish,
      endsAt: state.time + DISHES[dish].cookSeconds,
      duration: DISHES[dish].cookSeconds,
    };
    sfx.cookStart();
    return true;
  }
  return false;
}

export function updateKitchen(state) {
  if (state.screen !== 'playing') return;
  for (const station of state.stations) {
    if (station.cooking && state.time >= station.cooking.endsAt) {
      const { ticketId, dish, customerId } = station.cooking;
      station.cooking = null;
      const ticket = state.tickets.find((t) => t.id === ticketId);
      if (ticket) {
        const item = ticket.items.find((it) => it.dish === dish && !it.done);
        if (item) item.done = true;
      }
      state.readyStack[dish] += 1;
      state.stats.cooked += 1;
      sfx.dishReady();
      const st = LAYOUT.stations.find((s) => s.dish === dish);
      addFloater(state, st.x + st.w / 2, LAYOUT.kitchenY - 8, DISHES[dish].short + ' SIAP!', '#2e7d32');
      void customerId;
    }
  }
}

// Serve the selected table's customer if their whole order is ready.
export function serveCustomer(state, table) {
  const c = customerAt(state, table);
  if (!c || c.state !== 'ordered') return false;
  const ticket = ticketForCustomer(state, c.id);
  if (!ticket) return false;
  // Every item must be cooked AND sitting in the ready stack.
  const need = {};
  for (const it of ticket.items) need[it.dish] = (need[it.dish] || 0) + 1;
  for (const [dish, n] of Object.entries(need)) {
    if (state.readyStack[dish] < n) {
      showMessage(state, 'Belum lengkap — masak dulu yang kurang!', 1.6);
      return false;
    }
  }
  for (const [dish, n] of Object.entries(need)) state.readyStack[dish] -= n;
  const base = orderPrice(c.items);
  const patienceFrac = Math.max(0, c.patience / c.patienceMax);
  const comboBonus = Math.min(TIP.comboCap, state.combo * TIP.comboStep);
  const tip = Math.round(base * TIP.maxBonus * patienceFrac * (1 + comboBonus));
  const earned = base + tip;
  state.coins += earned;
  state.stats.tips += tip;
  state.served += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.tickets = state.tickets.filter((t) => t.id !== ticket.id);
  c.state = 'done';
  const t = LAYOUT.tables[c.table];
  addFloater(state, t.x, t.y - 90, '+' + earned + ' koin', '#2e7d32');
  sfx.coin();
  if (state.served >= DAY.targetServed) return 'win';
  return true;
}
