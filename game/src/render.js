// Ojek Rush — every pixel: the street, the bike, the traffic, the
// markers, the particles and the HUD. Top-down view, warm Indonesian
// street colours, and a headlight cone once night falls.

import {
  CANVAS_WIDTH, CANVAS_HEIGHT, ROAD_LEFT, ROAD_RIGHT, LANE_COUNT,
  LANE_WIDTH, LANE_CENTERS, RIDER_WIDTH, RIDER_HEIGHT, SHIFT_GOAL,
} from './config.js';
import { formatRupiah } from './storage.js';
import { paletteAt } from './world.js';

function roundRectPath(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

export function addParticles(particles, x, y, count, colors, speed) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const power = speed * (0.4 + Math.random() * 0.6);
    particles.push({
      x, y,
      vx: Math.cos(angle) * power,
      vy: Math.sin(angle) * power - 40,
      life: 0.5 + Math.random() * 0.4,
      maxLife: 0.9,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 3 + Math.random() * 4,
    });
  }
}

export function updateParticles(particles, seconds) {
  for (const p of particles) {
    p.x += p.vx * seconds;
    p.y += p.vy * seconds;
    p.vy += 260 * seconds;
    p.life -= seconds;
  }
  return particles.filter((p) => p.life > 0);
}

function drawRoad(ctx, world, palette) {
  // Shoulders: grass, then sidewalk, then asphalt.
  ctx.fillStyle = palette.grass;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = palette.sidewalk;
  ctx.fillRect(ROAD_LEFT - 46, 0, 46, CANVAS_HEIGHT);
  ctx.fillRect(ROAD_RIGHT, 0, 46, CANVAS_HEIGHT);
  ctx.fillStyle = palette.road;
  ctx.fillRect(ROAD_LEFT, 0, ROAD_RIGHT - ROAD_LEFT, CANVAS_HEIGHT);

  // Edge lines and scrolling lane dashes.
  ctx.fillStyle = palette.roadEdge;
  ctx.fillRect(ROAD_LEFT - 3, 0, 3, CANVAS_HEIGHT);
  ctx.fillRect(ROAD_RIGHT, 0, 3, CANVAS_HEIGHT);
  ctx.fillStyle = palette.laneMark;
  const dashLength = 34;
  const gap = 30;
  const period = dashLength + gap;
  const offset = world.scroll % period;
  for (let lane = 1; lane < LANE_COUNT; lane++) {
    const x = ROAD_LEFT + LANE_WIDTH * lane;
    for (let y = -period + offset; y < CANVAS_HEIGHT + period; y += period) {
      ctx.fillRect(x - 3, y, 6, dashLength);
    }
  }
  // Zebra crossings every stretch of road, purely for the eye.
  const crossingPeriod = 900;
  const crossingOffset = world.scroll % crossingPeriod;
  for (let y = -crossingPeriod + crossingOffset; y < CANVAS_HEIGHT + crossingPeriod; y += crossingPeriod) {
    ctx.fillStyle = 'rgba(245, 240, 230, 0.85)';
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(ROAD_LEFT + 12 + i * 56, y, 34, 14);
    }
  }
}

function drawRoadside(ctx, world, palette) {
  for (const item of world.roadside) {
    const x = item.side === 'left'
      ? ROAD_LEFT - 46 - item.width / 2 - 8
      : ROAD_RIGHT + 46 + item.width / 2 + 8;
    if (item.kind === 'tree') {
      ctx.fillStyle = '#5d8a4a';
      ctx.beginPath();
      ctx.arc(x, item.y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7a5a3a';
      ctx.fillRect(x - 4, item.y + 12, 8, 18);
    } else if (item.kind === 'lamp') {
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(x - 2, item.y - 20, 4, 40);
      ctx.fillStyle = '#ffd93d';
      ctx.beginPath();
      ctx.arc(x, item.y - 22, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.kind === 'warung') {
      // A small food stall: bright awning, steam, a menu board.
      ctx.fillStyle = '#e2725b';
      ctx.fillRect(x - item.width / 2, item.y - 10, item.width, 34);
      ctx.fillStyle = '#ffd93d';
      ctx.fillRect(x - item.width / 2 - 4, item.y - 20, item.width + 8, 10);
      ctx.fillStyle = '#2a9d8f';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(x - item.width / 2 - 4 + (i * (item.width + 8)) / 4, item.y - 20, (item.width + 8) / 8, 10);
      }
      ctx.fillStyle = '#f5f0e6';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('WARUNG', x, item.y + 7);
    } else {
      // A shophouse: coloured wall, darker roof, striped awning.
      ctx.fillStyle = item.color;
      ctx.fillRect(x - item.width / 2, item.y - item.height / 2, item.width, item.height);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(x - item.width / 2, item.y - item.height / 2, item.width, 12);
      if (item.awning) {
        ctx.fillStyle = '#f5f0e6';
        ctx.fillRect(x - item.width / 2, item.y + item.height / 2 - 18, item.width, 10);
        ctx.fillStyle = '#e2725b';
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(x - item.width / 2 + (i * item.width) / 4, item.y + item.height / 2 - 18, item.width / 8, 10);
        }
      }
      ctx.fillStyle = '#ffe9a8';
      ctx.fillRect(x - 14, item.y - 6, 12, 16);
      ctx.fillRect(x + 2, item.y - 6, 12, 16);
    }
  }
}

function drawVehicle(ctx, vehicle) {
  const x = vehicle.x;
  const y = vehicle.y;
  const w = vehicle.width;
  const h = vehicle.height;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(vehicle.wobble) * 0.02);
  // Tyres.
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-w / 2 - 4, -h * 0.28, 6, 18);
  ctx.fillRect(w / 2 - 2, -h * 0.28, 6, 18);
  ctx.fillRect(-w / 2 - 4, h * 0.28 - 18, 6, 18);
  ctx.fillRect(w / 2 - 2, h * 0.28 - 18, 6, 18);
  // Body.
  ctx.fillStyle = vehicle.color;
  roundRectPath(ctx, -w / 2, -h / 2, w, h, 10);
  ctx.fill();
  // Windshield and roof.
  ctx.fillStyle = 'rgba(20, 30, 50, 0.85)';
  roundRectPath(ctx, -w / 2 + 6, -h / 2 + 10, w - 12, 16, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  roundRectPath(ctx, -w / 2 + 6, -h / 2 + 32, w - 12, h / 3, 4);
  ctx.fill();
  if (vehicle.kind === 'bus' || vehicle.kind === 'truck') {
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(-w / 2 + 8, -h / 2 + 52 + i * 18, w - 16, 8);
    }
  }
  if (vehicle.kind === 'angkot') {
    ctx.fillStyle = '#ffd93d';
    ctx.fillRect(-w / 2, -6, w, 12);
  }
  // Taillights face the rider (bottom edge).
  ctx.fillStyle = '#ff3b30';
  ctx.fillRect(-w / 2 + 6, h / 2 - 5, 10, 4);
  ctx.fillRect(w / 2 - 16, h / 2 - 5, 10, 4);
  ctx.restore();
}

function drawRider(ctx, rider, now) {
  const blink = now < rider.invulnerableUntil && Math.floor(now * 10) % 2 === 0;
  ctx.save();
  ctx.translate(rider.x, rider.y);
  ctx.rotate(rider.tilt * 0.16);
  if (blink) ctx.globalAlpha = 0.35;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(3, 6, 26, 40, 0, 0, Math.PI * 2);
  ctx.fill();
  // Wheels.
  ctx.fillStyle = '#1a1a1a';
  roundRectPath(ctx, -9, -RIDER_HEIGHT / 2, 18, 16, 6);
  ctx.fill();
  roundRectPath(ctx, -9, RIDER_HEIGHT / 2 - 16, 18, 16, 6);
  ctx.fill();
  // Bike body: teal, with a cream stripe.
  ctx.fillStyle = '#2a9d8f';
  roundRectPath(ctx, -13, -RIDER_HEIGHT / 2 + 8, 26, RIDER_HEIGHT - 16, 10);
  ctx.fill();
  ctx.fillStyle = '#f5f0e6';
  ctx.fillRect(-13, -8, 26, 8);
  // Delivery box on the back, the ojek's green box.
  ctx.fillStyle = '#43aa5b';
  roundRectPath(ctx, -17, RIDER_HEIGHT / 2 - 26, 34, 22, 5);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('OJEK', 0, RIDER_HEIGHT / 2 - 15);
  // Rider: orange helmet and shoulders.
  ctx.fillStyle = '#ff8c42';
  ctx.beginPath();
  ctx.arc(0, -6, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#264653';
  roundRectPath(ctx, -14, 2, 28, 16, 7);
  ctx.fill();
  ctx.restore();
}

function drawOrderMarker(ctx, order, now) {
  const pulse = 1 + Math.sin(now * 5) * 0.12;
  const x = LANE_CENTERS[order.lane];
  const y = order.y;
  const carrying = order.phase === 'carry';
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pulse, pulse);
  // Ring.
  ctx.strokeStyle = carrying ? '#43aa5b' : '#ff8c42';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 30, 0, Math.PI * 2);
  ctx.stroke();
  // Timer ring drains as the order ages.
  const fraction = Math.max(0, order.timer / order.maxTimer);
  ctx.strokeStyle = fraction > 0.35 ? '#ffd93d' : '#ff3b30';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, 36, -Math.PI / 2, -Math.PI / 2 + fraction * Math.PI * 2);
  ctx.stroke();
  // Icon: a shop awning for pickup, a house for delivery.
  if (carrying) {
    ctx.fillStyle = '#43aa5b';
    ctx.beginPath();
    ctx.moveTo(-14, 2);
    ctx.lineTo(0, -14);
    ctx.lineTo(14, 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-11, 2, 22, 13);
  } else {
    ctx.fillStyle = '#ff8c42';
    ctx.fillRect(-14, -8, 28, 8);
    ctx.fillStyle = '#e2725b';
    for (let i = 0; i < 4; i++) ctx.fillRect(-14 + i * 7, 0, 7, 6);
    ctx.fillStyle = '#f5f0e6';
    ctx.fillRect(-11, 6, 22, 10);
  }
  ctx.restore();
  // Label above the marker.
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 4;
  const label = carrying ? `ANTAR • ${order.dish}` : `AMBIL • ${order.dish}`;
  ctx.strokeText(label, x, y - 44);
  ctx.fillText(label, x, y - 44);
  if (order.rush) {
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillStyle = '#ff3b30';
    ctx.strokeText('RUSH • 1.5x TARIF', x, y - 64);
    ctx.fillText('RUSH • 1.5x TARIF', x, y - 64);
  }
}

function drawPickupItem(ctx, item, now) {
  const bob = Math.sin(item.bob) * 3;
  if (item.kind === 'coin') {
    ctx.save();
    ctx.translate(item.x, item.y + bob);
    ctx.fillStyle = '#ffd93d';
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d99a35';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#d99a35';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Rp', 0, 1);
    ctx.restore();
  } else {
    ctx.save();
    ctx.translate(item.x, item.y + bob);
    ctx.fillStyle = '#43aa5b';
    roundRectPath(ctx, -13, -15, 26, 30, 4);
    ctx.fill();
    ctx.fillStyle = '#f5f0e6';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('B', 0, 1);
    ctx.restore();
  }
}

function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

function drawMessages(ctx, messages) {
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const message of messages) {
    ctx.globalAlpha = Math.max(0, message.life / message.maxLife);
    ctx.strokeStyle = 'rgba(0,0,0,0.65)';
    ctx.lineWidth = 4;
    ctx.strokeText(message.text, message.x, message.y);
    ctx.fillStyle = message.color;
    ctx.fillText(message.text, message.x, message.y);
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, game) {
  const { score, deliveries, level, combo } = game;
  // Lives and fuel live on the rider, not on the game object.
  const lives = game.rider.lives;
  const fuel = game.rider.fuel;
  // Top bar: score and shift progress.
  ctx.fillStyle = 'rgba(12, 8, 10, 0.55)';
  roundRectPath(ctx, 12, 12, 250, 64, 10);
  ctx.fill();
  ctx.fillStyle = '#ffd93d';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(formatRupiah(score), 24, 34);
  ctx.fillStyle = '#f5f0e6';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(`Pesanan ${deliveries}/${SHIFT_GOAL}  •  Level ${level}`, 24, 60);
  if (combo >= 2) {
    ctx.fillStyle = '#ff8c42';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(`Combo x${(1 + Math.min(2, combo * 0.1)).toFixed(1)}`, 24, 88);
  }
  // Lives as hearts, top right. U+2665 is a solid heart in plain fonts;
  // U+2764 renders as an outline where no emoji font is installed.
  ctx.font = '24px system-ui, sans-serif';
  ctx.textAlign = 'right';
  let hearts = '';
  for (let i = 0; i < 3; i++) hearts += i < lives ? '♥' : '♡';
  ctx.fillStyle = '#e85d75';
  ctx.fillText(hearts, CANVAS_WIDTH - 16, 34);
  // Day-phase sun/moon under the hearts.
  const phase = game.dayPhase;
  ctx.fillStyle = phase < 0.5 ? '#ffd93d' : '#f4f1de';
  ctx.beginPath();
  ctx.arc(CANVAS_WIDTH - 28, 66, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f5f0e6';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(phase < 0.33 ? 'Siang' : phase < 0.66 ? 'Sore' : 'Malam', CANVAS_WIDTH - 48, 66);
  // Fuel gauge, bottom left: label on the left, bar to its right.
  ctx.fillStyle = 'rgba(12, 8, 10, 0.55)';
  roundRectPath(ctx, 12, CANVAS_HEIGHT - 44, 300, 32, 10);
  ctx.fill();
  ctx.fillStyle = '#f5f0e6';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('BENSIN', 24, CANVAS_HEIGHT - 28);
  ctx.fillStyle = fuel > 25 ? '#43aa5b' : '#ff3b30';
  const fuelWidth = Math.max(0, Math.min(1, fuel / 100)) * 200;
  roundRectPath(ctx, 88, CANVAS_HEIGHT - 36, fuelWidth, 16, 6);
  ctx.fill();
  // Order timer bar, top centre, while an order is active.
  const order = game.orders.current;
  if (order) {
    const width = 260;
    const x = (CANVAS_WIDTH - width) / 2;
    const fraction = Math.max(0, order.timer / order.maxTimer);
    ctx.fillStyle = 'rgba(12, 8, 10, 0.55)';
    roundRectPath(ctx, x - 8, 12, width + 16, 46, 10);
    ctx.fill();
    ctx.fillStyle = fraction > 0.35 ? '#ffd93d' : '#ff3b30';
    roundRectPath(ctx, x, 20, width * fraction, 12, 6);
    ctx.fill();
    ctx.fillStyle = '#f5f0e6';
    ctx.font = '15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      order.phase === 'pickup' ? `Ambil: ${order.dish}` : `Antar: ${order.dish} • ${Math.ceil(order.timer)} dtk`,
      CANVAS_WIDTH / 2, 46,
    );
  }
  // Mute hint, bottom right.
  ctx.fillStyle = 'rgba(245,240,230,0.75)';
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(game.audio.muted ? 'Suara: mati (M)' : 'Suara: nyala (M)', CANVAS_WIDTH - 14, CANVAS_HEIGHT - 14);
}

function drawNightOverlay(ctx, game) {
  const phase = game.dayPhase;
  if (phase <= 0.05) return;
  // Darken the world as night falls.
  ctx.fillStyle = `rgba(10, 12, 40, ${phase * 0.38})`;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  if (phase > 0.5) {
    // Headlight cone ahead of the bike.
    const rider = game.rider;
    const gradient = ctx.createRadialGradient(rider.x, rider.y - 40, 20, rider.x, rider.y - 40, 320);
    gradient.addColorStop(0, 'rgba(255, 240, 180, 0.28)');
    gradient.addColorStop(1, 'rgba(255, 240, 180, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(rider.x - 26, rider.y - 30);
    ctx.lineTo(rider.x - 130, rider.y - 330);
    ctx.lineTo(rider.x + 130, rider.y - 330);
    ctx.lineTo(rider.x + 26, rider.y - 30);
    ctx.closePath();
    ctx.fill();
  }
}

// The full frame: world behind, HUD on top, night tint last.
export function drawScene(ctx, game) {
  const palette = paletteAt(game.dayPhase);
  ctx.save();
  if (game.now < game.shakeUntil) {
    const strength = 7;
    ctx.translate((Math.random() - 0.5) * strength, (Math.random() - 0.5) * strength);
  }
  drawRoad(ctx, game.world, palette);
  drawRoadside(ctx, game.world, palette);
  // Speed streaks on the asphalt when the rider is flat out.
  if (game.scrollSpeed > 380) {
    ctx.strokeStyle = 'rgba(245, 240, 230, 0.25)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const streakX = ROAD_LEFT + 40 + ((i * 97 + Math.floor(game.world.scroll * 2.4)) % 400);
      const streakY = (i * 130 + game.world.scroll * 3) % (CANVAS_HEIGHT + 80) - 40;
      ctx.beginPath();
      ctx.moveTo(streakX, streakY);
      ctx.lineTo(streakX, streakY + 46);
      ctx.stroke();
    }
  }
  if (game.orders.current) drawOrderMarker(ctx, game.orders.current, game.now);
  for (const item of game.pickups.items) drawPickupItem(ctx, item, game.now);
  for (const vehicle of game.traffic.vehicles) drawVehicle(ctx, vehicle);
  drawRider(ctx, game.rider, game.now);
  drawParticles(ctx, game.particles);
  drawMessages(ctx, game.messages);
  ctx.restore();
  drawNightOverlay(ctx, game);
  if (game.screen === 'playing' || game.screen === 'paused') drawHud(ctx, game);
}
