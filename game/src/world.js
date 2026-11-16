// Ojek Rush — the street itself: scrolling road, roadside shops and
// trees, and the day sliding into night as the shift goes on.
// The palette is blended between day, sunset and night so the change
// is gradual and the screenshots at different levels look different.

import {
  CANVAS_HEIGHT, ROAD_LEFT, ROAD_RIGHT, PALETTE,
  NIGHT_AFTER_DELIVERIES,
} from './config.js';

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function mixColor(a, b, t) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return `rgb(${ca.map((v, i) => Math.round(v + (cb[i] - v) * t)).join(',')})`;
}

// Blend day -> sunset -> night across phase 0..1.
export function paletteAt(phase) {
  const first = phase < 0.5 ? PALETTE.day : PALETTE.sunset;
  const second = phase < 0.5 ? PALETTE.sunset : PALETTE.night;
  const local = phase < 0.5 ? phase * 2 : (phase - 0.5) * 2;
  const out = {};
  for (const key of Object.keys(PALETTE.day)) {
    out[key] = mixColor(first[key], second[key], local);
  }
  return out;
}

export function createWorld() {
  return {
    scroll: 0, // total road pixels scrolled, drives the lane dashes
    roadside: [], // { side, y, kind, color, height, width }
    spawnTimer: 0,
  };
}

const ROADSIDE_KINDS = ['building', 'building', 'building', 'tree', 'tree', 'lamp', 'warung'];

function spawnRoadside(world, random) {
  const side = random() < 0.5 ? 'left' : 'right';
  const kind = ROADSIDE_KINDS[Math.floor(random() * ROADSIDE_KINDS.length)];
  const buildings = ['#e2725b', '#e9b44c', '#7fb069', '#4a90d9', '#9b7ede'];
  world.roadside.push({
    side,
    y: -120,
    kind,
    color: buildings[Math.floor(random() * buildings.length)],
    height: kind === 'tree' ? 46 : kind === 'warung' ? 40 : 70 + random() * 50,
    width: kind === 'tree' ? 40 : 60 + random() * 40,
    awning: random() < 0.6,
  });
}

export function updateWorld(world, scrollSpeed, seconds, deliveries, random) {
  world.scroll += scrollSpeed * seconds;
  world.spawnTimer -= seconds;
  if (world.spawnTimer <= 0) {
    spawnRoadside(world, random);
    spawnRoadside(world, random);
    world.spawnTimer = 0.45 + random() * 0.4;
  }
  for (const item of world.roadside) {
    item.y += scrollSpeed * seconds;
  }
  world.roadside = world.roadside.filter((item) => item.y < CANVAS_HEIGHT + 140);
}

export function dayPhaseForDeliveries(deliveries) {
  return Math.min(1, deliveries / NIGHT_AFTER_DELIVERIES);
}

export { ROAD_LEFT, ROAD_RIGHT };
