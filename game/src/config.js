// Ojek Rush — tuning constants and the art palette.
// One place for every number the rest of the game reads, so balancing
// never means hunting through the drawing or physics code.

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;

// The road: three lanes down the middle of the screen.
export const ROAD_LEFT = 240;
export const ROAD_RIGHT = 720;
export const LANE_COUNT = 3;
export const LANE_WIDTH = (ROAD_RIGHT - ROAD_LEFT) / LANE_COUNT;
export const LANE_CENTERS = [
  ROAD_LEFT + LANE_WIDTH * 0.5,
  ROAD_LEFT + LANE_WIDTH * 1.5,
  ROAD_LEFT + LANE_WIDTH * 2.5,
];

// The rider sits near the bottom and never leaves this row.
export const RIDER_Y = 430;
export const RIDER_WIDTH = 46;
export const RIDER_HEIGHT = 72;

// A shift: how many deliveries finish the day, and how many hits end it.
export const SHIFT_GOAL = 10;
export const START_LIVES = 3;
export const START_FUEL = 100;

// Speed in pixels per second of road scroll.
export const BASE_SCROLL_SPEED = 260;
export const ACCEL_SCROLL_BONUS = 170;
export const BRAKE_SCROLL_BONUS = -140;
export const MAX_LEVEL_SPEED_BONUS = 150;

// Fuel: drains per second, faster while accelerating. Tuned so a full
// tank lasts about 80 seconds of riding and a can is always worth the detour.
export const FUEL_DRAIN_PER_SECOND = 1.2;
export const FUEL_DRAIN_ACCEL_EXTRA = 1.1;
export const FUEL_CAN_REFILL = 40;

// Money is in rupiah. A fare pays a base plus a time bonus, times the combo.
export const FARE_BASE = 8000;
export const FARE_TIME_BONUS_MAX = 7000;
export const COIN_VALUE = 500;
export const COMBO_STEP = 0.1;
export const COMBO_CAP = 2.0;

// Orders: seconds to reach the pickup, then to reach the customer.
export const ORDER_PICKUP_TIME = 14;
export const ORDER_DELIVER_TIME = 12;
export const ORDER_SPAWN_GAP_SECONDS = 2.5;

// Traffic: seconds between spawns shrink as the level rises.
export const TRAFFIC_SPAWN_START = 1.15;
export const TRAFFIC_SPAWN_MIN = 0.5;
export const TRAFFIC_SPAWN_PER_LEVEL = 0.09;

// Crashes: how long the rider is invulnerable and the screen shakes.
export const INVULNERABLE_SECONDS = 2.0;
export const SHAKE_SECONDS = 0.35;

// Day cycle: deliveries 0..8 slide the palette from day to night.
export const NIGHT_AFTER_DELIVERIES = 8;

// Warm Indonesian street palette, day -> sunset -> night.
export const PALETTE = {
  day: {
    sky: '#8ec9e8', skyTop: '#5aa9d6', road: '#3d3a38', roadEdge: '#f5f0e6',
    laneMark: '#f5f0e6', grass: '#7fb069', sidewalk: '#c9b8a3',
    sun: '#ffd93d', buildingA: '#e2725b', buildingB: '#e9b44c', buildingC: '#7fb069',
  },
  sunset: {
    sky: '#f7a072', skyTop: '#c96f4a', road: '#37302e', roadEdge: '#f5d9b0',
    laneMark: '#f5d9b0', grass: '#5d8a4a', sidewalk: '#b09a80',
    sun: '#ff8c42', buildingA: '#c65b47', buildingB: '#d99a35', buildingC: '#5d8a4a',
  },
  night: {
    sky: '#1b2340', skyTop: '#0d1226', road: '#232022', roadEdge: '#8a8a9a',
    laneMark: '#8a8a9a', grass: '#2e4a2e', sidewalk: '#6e6258',
    sun: '#f4f1de', buildingA: '#8a4a3d', buildingB: '#a8842f', buildingC: '#2e4a2e',
  },
};

// Traffic vehicle colours, picked per vehicle so the road reads at a glance.
export const TRAFFIC_COLORS = ['#e2725b', '#4a90d9', '#e9b44c', '#9b7ede', '#e85d75', '#5fb8a6'];
