// Ojek Rush — the rider: lane, lean, fuel and lives.
// The bike never steers freely: it snaps between three lanes, which keeps
// the controls instant on keyboard and on a mouse click.

import {
  LANE_CENTERS, RIDER_Y, RIDER_WIDTH, RIDER_HEIGHT,
  START_LIVES, START_FUEL,
} from './config.js';

export function createRider() {
  return {
    lane: 1, // middle lane
    x: LANE_CENTERS[1],
    y: RIDER_Y,
    tilt: 0, // leans into a lane change, -1..1
    lives: START_LIVES,
    fuel: START_FUEL,
    invulnerableUntil: 0,
    crashedUntil: 0,
  };
}

// Ease the bike toward its lane centre and lean into the move.
export function updateRider(rider, input, seconds, now) {
  if (input.wasPressed('left') && rider.lane > 0) rider.lane -= 1;
  if (input.wasPressed('right') && rider.lane < 2) rider.lane += 1;

  // A click on the left or right half of the road steers that way.
  if (input.click) {
    const middle = (LANE_CENTERS[0] + LANE_CENTERS[2]) / 2;
    if (input.click.x < middle - 40 && rider.lane > 0) rider.lane -= 1;
    if (input.click.x > middle + 40 && rider.lane < 2) rider.lane += 1;
  }

  const targetX = LANE_CENTERS[rider.lane];
  const previousX = rider.x;
  rider.x += (targetX - rider.x) * Math.min(1, seconds * 14);
  rider.tilt = Math.max(-1, Math.min(1, (rider.x - previousX) / Math.max(1, seconds * 60)));
  // Nearly out of fuel, the bike sputters: a small sideways shudder
  // the player can feel before the tank runs dry.
  if (rider.fuel < 20) {
    rider.x += (Math.random() - 0.5) * 1.6;
  }
}

export function riderHitbox(rider) {
  return {
    left: rider.x - RIDER_WIDTH / 2 + 6,
    right: rider.x + RIDER_WIDTH / 2 - 6,
    top: rider.y - RIDER_HEIGHT / 2 + 4,
    bottom: rider.y + RIDER_HEIGHT / 2 - 4,
  };
}

export function riderIsInvulnerable(rider, now) {
  return now < rider.invulnerableUntil;
}

export function riderIsCrashed(rider, now) {
  return now < rider.crashedUntil;
}

// A crash costs one life and grants a short shield so one mistake
// cannot chain into two. Returns false when the rider is out of lives.
export function crashRider(rider, now, invulnerableSeconds, crashedSeconds) {
  rider.lives -= 1;
  rider.invulnerableUntil = now + invulnerableSeconds;
  rider.crashedUntil = now + crashedSeconds;
  return rider.lives > 0;
}
