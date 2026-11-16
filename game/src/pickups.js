// Ojek Rush — coins and fuel cans lying on the road.
// Coins reward risky weaving; fuel cans keep the shift going. Both ride
// the scroll like everything else on the street.

import { LANE_CENTERS, CANVAS_HEIGHT } from './config.js';

export function createPickups() {
  return { items: [], coinTimer: 2.0, fuelTimer: 9.0 };
}

function spawnPickupsAt(pickups, kind, count, random) {
  for (let i = 0; i < count; i++) {
    const lane = Math.floor(random() * 3);
    pickups.items.push({
      kind,
      lane,
      x: LANE_CENTERS[lane],
      y: -40 - i * 90,
      bob: random() * Math.PI * 2,
    });
  }
}

export function updatePickups(pickups, scrollSpeed, seconds, random) {
  pickups.coinTimer -= seconds;
  pickups.fuelTimer -= seconds;
  if (pickups.coinTimer <= 0) {
    spawnPickupsAt(pickups, 'coin', 2 + Math.floor(random() * 2), random);
    pickups.coinTimer = 3.5 + random() * 2.5;
  }
  if (pickups.fuelTimer <= 0) {
    spawnPickupsAt(pickups, 'fuel', 1, random);
    pickups.fuelTimer = 8 + random() * 4;
  }
  for (const item of pickups.items) {
    item.y += scrollSpeed * seconds;
    item.bob += seconds * 4;
  }
  pickups.items = pickups.items.filter((item) => item.y < CANVAS_HEIGHT + 60);
}

export function pickupHitbox(item) {
  return {
    left: item.x - 26,
    right: item.x + 26,
    top: item.y - 26,
    bottom: item.y + 26,
  };
}
