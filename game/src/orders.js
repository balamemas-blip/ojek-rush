// Ojek Rush — orders: pick up at the warung, deliver to the house.
// One order at a time keeps the loop readable: the player always knows
// the next stop, and the timer is always the tension. A delivery pays a
// fare plus a time bonus times the combo; a missed timer resets the combo.

import {
  LANE_CENTERS, CANVAS_HEIGHT, ORDER_PICKUP_TIME, ORDER_DELIVER_TIME,
  ORDER_SPAWN_GAP_SECONDS, FARE_BASE, FARE_TIME_BONUS_MAX,
  COMBO_STEP, COMBO_CAP,
} from './config.js';

// Food names for the order ticket, in Indonesian, all original.
const DISHES = [
  'Nasi Goreng', 'Mie Ayam', 'Sate Ayam', 'Bakso', 'Ayam Geprek',
  'Nasi Padang', 'Es Teh Manis', 'Martabak', 'Gado-Gado', 'Soto Ayam',
];

export function createOrders() {
  return {
    current: null, // the order being chased, or null between orders
    spawnTimer: 1.5,
    nextId: 1,
  };
}

function randomLane(random) {
  return Math.floor(random() * 3);
}

function makeOrder(orders, random) {
  const id = orders.nextId;
  orders.nextId += 1;
  // One in four orders is a rush job: less time, half again the fare.
  const rush = random() < 0.25;
  const pickupTime = rush ? ORDER_PICKUP_TIME * 0.7 : ORDER_PICKUP_TIME;
  return {
    id,
    dish: DISHES[Math.floor(random() * DISHES.length)],
    phase: 'pickup', // 'pickup' then 'carry'
    lane: randomLane(random),
    y: -60,
    timer: pickupTime,
    maxTimer: pickupTime,
    rush,
    fareMult: rush ? 1.5 : 1,
  };
}

export function updateOrders(orders, scrollSpeed, seconds, random) {
  if (orders.current) {
    const order = orders.current;
    order.y += scrollSpeed * seconds;
    order.timer -= seconds;
    // A marker that scrolls past uncollected is a missed order.
    if (order.y > CANVAS_HEIGHT + 80 || order.timer <= 0) {
      const missed = { ...order, missed: true };
      orders.current = null;
      orders.spawnTimer = ORDER_SPAWN_GAP_SECONDS;
      return missed;
    }
    return null;
  }
  orders.spawnTimer -= seconds;
  if (orders.spawnTimer <= 0) {
    orders.current = makeOrder(orders, random);
  }
  return null;
}

// The rider reached the marker. Returns what happened:
// 'picked' (now carrying), or a delivery {fare, tip} when delivered.
export function collectOrder(orders, riderLane) {
  const order = orders.current;
  if (!order || order.lane !== riderLane) return null;
  if (order.phase === 'pickup') {
    order.phase = 'carry';
    order.lane = randomLane(Math.random);
    order.y = -60;
    order.timer = ORDER_DELIVER_TIME;
    order.maxTimer = ORDER_DELIVER_TIME;
    return { type: 'picked', order };
  }
  // Delivered: fare = (base + time bonus) x rush multiplier, then the combo.
  const timeLeft = Math.max(0, order.timer / order.maxTimer);
  const fare = Math.round((FARE_BASE + FARE_TIME_BONUS_MAX * timeLeft) * order.fareMult);
  orders.current = null;
  orders.spawnTimer = ORDER_SPAWN_GAP_SECONDS;
  return { type: 'delivered', order, fare, timeLeft };
}

// Combo multiplier from consecutive clean deliveries: +10% each, cap 2x.
export function comboMultiplier(combo) {
  return Math.min(COMBO_CAP, 1 + combo * COMBO_STEP);
}

export function orderMarkerHitbox(order) {
  return {
    left: LANE_CENTERS[order.lane] - 34,
    right: LANE_CENTERS[order.lane] + 34,
    top: order.y - 34,
    bottom: order.y + 34,
  };
}
