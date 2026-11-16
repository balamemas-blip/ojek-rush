// Ojek Rush — traffic: cars, buses and trucks sharing the road.
// Vehicles spawn ahead of the rider and drift down the screen slower
// than the road scrolls, so the rider must weave between them. A spawn
// never blocks all three lanes at the same height.

import {
  LANE_CENTERS, CANVAS_HEIGHT, TRAFFIC_COLORS,
  TRAFFIC_SPAWN_START, TRAFFIC_SPAWN_MIN, TRAFFIC_SPAWN_PER_LEVEL,
} from './config.js';

const KINDS = [
  { name: 'car', width: 52, height: 84, speed: 60, weight: 5 },
  { name: 'angkot', width: 54, height: 88, speed: 45, weight: 3 },
  { name: 'bus', width: 60, height: 118, speed: 35, weight: 2 },
  { name: 'truck', width: 60, height: 110, speed: 40, weight: 2 },
  // A fellow rider: small, quick, drifts past slowly — a different read.
  { name: 'motor', width: 40, height: 64, speed: 120, weight: 2 },
];

function pickKind(random) {
  const total = KINDS.reduce((sum, kind) => sum + kind.weight, 0);
  let roll = random() * total;
  for (const kind of KINDS) {
    roll -= kind.weight;
    if (roll <= 0) return kind;
  }
  return KINDS[0];
}

export function createTraffic() {
  return { vehicles: [], spawnTimer: 1.0 };
}

export function spawnIntervalForLevel(level) {
  return Math.max(
    TRAFFIC_SPAWN_MIN,
    TRAFFIC_SPAWN_START - (level - 1) * TRAFFIC_SPAWN_PER_LEVEL,
  );
}

// Spawn one vehicle in a lane that is not already busy near the top.
export function spawnTraffic(traffic, level, random) {
  const busyLanes = new Set();
  for (const vehicle of traffic.vehicles) {
    if (vehicle.y < 40) busyLanes.add(vehicle.lane);
  }
  const freeLanes = [0, 1, 2].filter((lane) => !busyLanes.has(lane));
  if (freeLanes.length === 0) return;
  const lane = freeLanes[Math.floor(random() * freeLanes.length)];
  const kind = pickKind(random);
  traffic.vehicles.push({
    lane,
    x: LANE_CENTERS[lane],
    y: -kind.height,
    kind: kind.name,
    width: kind.width,
    height: kind.height,
    ownSpeed: kind.speed + random() * 20,
    color: TRAFFIC_COLORS[Math.floor(random() * TRAFFIC_COLORS.length)],
    wobble: random() * Math.PI * 2,
  });
}

export function updateTraffic(traffic, scrollSpeed, seconds, level, random) {
  traffic.spawnTimer -= seconds;
  if (traffic.spawnTimer <= 0) {
    spawnTraffic(traffic, level, random);
    traffic.spawnTimer = spawnIntervalForLevel(level) * (0.75 + random() * 0.5);
  }
  for (const vehicle of traffic.vehicles) {
    // Oncoming relative motion: the road scrolls past, the vehicle adds
    // a little of its own crawl.
    vehicle.y += (scrollSpeed - vehicle.ownSpeed) * seconds;
    vehicle.wobble += seconds * 2;
  }
  traffic.vehicles = traffic.vehicles.filter((v) => v.y < CANVAS_HEIGHT + 140);
}

export function vehicleHitbox(vehicle) {
  return {
    left: vehicle.x - vehicle.width / 2 + 4,
    right: vehicle.x + vehicle.width / 2 - 4,
    top: vehicle.y - vehicle.height / 2 + 4,
    bottom: vehicle.y + vehicle.height / 2 - 4,
  };
}

export function boxesOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}
