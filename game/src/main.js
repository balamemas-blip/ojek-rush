// Ojek Rush — bootstrap, game loop and the screen state machine.
// Title -> playing <-> paused -> game over / victory -> playing again.
// The loop owns the one state object every module reads and writes.

import {
  CANVAS_WIDTH, CANVAS_HEIGHT, RIDER_Y, SHIFT_GOAL,
  BASE_SCROLL_SPEED, ACCEL_SCROLL_BONUS, BRAKE_SCROLL_BONUS,
  MAX_LEVEL_SPEED_BONUS, FUEL_DRAIN_PER_SECOND, FUEL_DRAIN_ACCEL_EXTRA,
  FUEL_CAN_REFILL, COIN_VALUE, INVULNERABLE_SECONDS, SHAKE_SECONDS,
} from './config.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import {
  createRider, updateRider, riderHitbox, riderIsInvulnerable, crashRider,
} from './rider.js';
import {
  createTraffic, updateTraffic, vehicleHitbox, boxesOverlap,
} from './traffic.js';
import {
  createOrders, updateOrders, collectOrder, comboMultiplier, orderMarkerHitbox,
} from './orders.js';
import { createPickups, updatePickups, pickupHitbox } from './pickups.js';
import { createWorld, updateWorld, dayPhaseForDeliveries } from './world.js';
import { drawScene, addParticles, updateParticles } from './render.js';
import {
  drawTitle, drawPaused, drawGameOver, drawVictory, buttonHit,
} from './screens.js';
import { loadBest, saveBest, loadBestDeliveries, saveBestDeliveries, formatRupiah } from './storage.js';

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const ctx = canvas.getContext('2d');

const input = createInput(canvas);
const audio = createAudio();

const game = {
  screen: 'title',
  now: 0,
  score: 0,
  tips: 0,
  coins: 0,
  deliveries: 0,
  combo: 0,
  bestCombo: 0,
  crashes: 0,
  level: 1,
  best: loadBest(),
  bestDeliveries: loadBestDeliveries(),
  dayPhase: 0,
  scrollSpeed: 0,
  shakeUntil: 0,
  lastNearMiss: -10,
  gameOverReason: '',
  rider: createRider(),
  traffic: createTraffic(),
  orders: createOrders(),
  pickups: createPickups(),
  world: createWorld(),
  particles: [],
  messages: [],
  buttons: [],
  audio,
};

function addMessage(text, color) {
  game.messages.push({
    text,
    color: color ?? '#ffd93d',
    x: CANVAS_WIDTH / 2,
    y: 150,
    life: 1.4,
    maxLife: 1.4,
  });
}

function updateMessages(seconds) {
  for (const message of game.messages) {
    message.y -= 28 * seconds;
    message.life -= seconds;
  }
  game.messages = game.messages.filter((m) => m.life > 0);
}

function levelForDeliveries(deliveries) {
  return 1 + Math.floor(deliveries / 3);
}

function startGame() {
  game.screen = 'playing';
  game.score = 0;
  game.tips = 0;
  game.coins = 0;
  game.deliveries = 0;
  game.combo = 0;
  game.bestCombo = 0;
  game.crashes = 0;
  game.level = 1;
  game.dayPhase = 0;
  game.shakeUntil = 0;
  game.gameOverReason = '';
  game.rider = createRider();
  game.traffic = createTraffic();
  game.orders = createOrders();
  game.pickups = createPickups();
  game.world = createWorld();
  game.particles = [];
  game.messages = [];
  game.buttons = [];
  audio.unlock();
  setStatus('Narasi dimulai. Ambil order pertama di warung.');
}

function endShift(won, reason) {
  game.screen = won ? 'victory' : 'gameover';
  game.gameOverReason = reason;
  const isBest = game.score > game.best;
  if (isBest) {
    game.best = game.score;
    saveBest(game.score);
  }
  if (game.deliveries > game.bestDeliveries) {
    game.bestDeliveries = game.deliveries;
    saveBestDeliveries(game.deliveries);
  }
  if (won) audio.win();
  else audio.gameOver();
  audio.setEngine(0);
  setStatus(won
    ? `Shift selesai! Penghasilan ${formatRupiah(game.score)}.`
    : `Shift berakhir: ${reason} Penghasilan ${formatRupiah(game.score)}.`);
}

function setStatus(text) {
  statusEl.textContent = text;
}

function currentScrollSpeed() {
  const levelBonus = Math.min(
    MAX_LEVEL_SPEED_BONUS,
    (game.level - 1) * 25,
  );
  let speed = BASE_SCROLL_SPEED + levelBonus;
  if (input.up) speed += ACCEL_SCROLL_BONUS;
  if (input.down) speed += BRAKE_SCROLL_BONUS;
  return Math.max(120, speed);
}

function handleCrash() {
  const rider = game.rider;
  const survived = crashRider(rider, game.now, INVULNERABLE_SECONDS, 0.6);
  game.crashes += 1;
  game.combo = 0;
  game.shakeUntil = game.now + SHAKE_SECONDS;
  addParticles(game.particles, rider.x, rider.y, 26, ['#ff8c42', '#ffd93d', '#e2725b'], 260);
  audio.crash();
  addMessage('BRAK! Motor ketabrak!', '#ff6b5e');
  if (!survived) {
    endShift(false, 'Motor rusak parah setelah 3 tabrakan.');
  }
}

function updatePlaying(seconds) {
  game.now += seconds;
  const accelerating = input.up;

  game.scrollSpeed = currentScrollSpeed();
  game.dayPhase = dayPhaseForDeliveries(game.deliveries);

  // Fuel drains constantly, faster while accelerating.
  game.rider.fuel -= (FUEL_DRAIN_PER_SECOND + (accelerating ? FUEL_DRAIN_ACCEL_EXTRA : 0)) * seconds;
  if (game.rider.fuel <= 0) {
    game.rider.fuel = 0;
    endShift(false, 'Bensin habis di tengah jalan.');
    return;
  }

  updateRider(game.rider, input, seconds, game.now);
  updateWorld(game.world, game.scrollSpeed, seconds, game.deliveries, Math.random);
  updateTraffic(game.traffic, game.scrollSpeed, seconds, game.level, Math.random);

  const missed = updateOrders(game.orders, game.scrollSpeed, seconds, Math.random);
  if (missed) {
    game.combo = 0;
    addMessage('Order terlewat! Combo hilang.', '#ff6b5e');
  }

  updatePickups(game.pickups, game.scrollSpeed, seconds, Math.random);

  // Traffic collision, plus a near-miss bonus for threading the gap.
  const riderBox = riderHitbox(game.rider);
  if (!riderIsInvulnerable(game.rider, game.now)) {
    for (const vehicle of game.traffic.vehicles) {
      if (boxesOverlap(riderBox, vehicleHitbox(vehicle))) {
        handleCrash();
        break;
      }
    }
  }
  for (const vehicle of game.traffic.vehicles) {
    if (vehicle.nearMissed) continue;
    if (vehicle.y > RIDER_Y + 10) {
      vehicle.nearMissed = true;
      const lateralGap = Math.abs(vehicle.x - game.rider.x);
      const overlap = boxesOverlap(riderBox, vehicleHitbox(vehicle));
      if (!overlap && lateralGap < 95 && game.now - game.lastNearMiss > 1.2) {
        game.lastNearMiss = game.now;
        game.score += 250;
        audio.nearMiss();
        addParticles(game.particles, game.rider.x, game.rider.y - 30, 6, ['#f5f0e6'], 100);
        addMessage('Hampir! +Rp 250', '#f5f0e6');
      }
    }
  }

  // Order markers: drive through the ring in the right lane.
  const order = game.orders.current;
  if (order && Math.abs(order.y - RIDER_Y) < 52 && order.lane === game.rider.lane) {
    const result = collectOrder(game.orders, game.rider.lane);
    if (result && result.type === 'picked') {
      audio.pickup();
      addMessage(`Diambil: ${result.order.dish}`, '#ffd93d');
      setStatus(`Membawa ${result.order.dish}. Antar sebelum waktu habis!`);
    } else if (result && result.type === 'delivered') {
      const multiplier = comboMultiplier(game.combo);
      const paid = Math.round(result.fare * multiplier);
      const tip = paid - result.fare;
      game.score += paid;
      game.tips += tip;
      game.deliveries += 1;
      game.combo += 1;
      game.bestCombo = Math.max(game.bestCombo, game.combo);
      audio.deliver();
      addParticles(game.particles, game.rider.x, game.rider.y - 40, 30,
        ['#ffd93d', '#43aa5b', '#f5f0e6', '#ff8c42'], 220);
      addMessage(`+${formatRupiah(paid)}${tip > 0 ? ` (tip ${formatRupiah(tip)})` : ''}`, '#7fb069');
      setStatus(`Terkirim! ${game.deliveries}/${SHIFT_GOAL} pesanan selesai.`);
      const nextLevel = levelForDeliveries(game.deliveries);
      if (nextLevel > game.level) {
        game.level = nextLevel;
        audio.levelUp();
        addMessage(`Level ${game.level}! Jalan makin ramai.`, '#4a90d9');
      }
      if (game.deliveries >= SHIFT_GOAL) {
        endShift(true, '');
        return;
      }
    }
  }

  // Coins and fuel cans.
  for (const item of [...game.pickups.items]) {
    if (boxesOverlap(riderBox, pickupHitbox(item))) {
      game.pickups.items = game.pickups.items.filter((i) => i !== item);
      if (item.kind === 'coin') {
        game.score += COIN_VALUE;
        game.coins += 1;
        audio.coin();
        addParticles(game.particles, item.x, item.y, 8, ['#ffd93d'], 120);
      } else {
        game.rider.fuel = Math.min(100, game.rider.fuel + FUEL_CAN_REFILL);
        audio.fuel();
        addMessage('Bensin +35!', '#43aa5b');
      }
    }
  }

  if (input.wasPressed('horn')) audio.horn();
  if (input.wasPressed('mute')) {
    const muted = audio.toggleMute();
    addMessage(muted ? 'Suara dimatikan (M)' : 'Suara dinyalakan (M)', '#f5f0e6');
  }
  if (input.wasPressed('pause')) {
    game.screen = 'paused';
    audio.setEngine(0);
    setStatus('Jeda. Tekan P untuk lanjut.');
  }

  game.particles = updateParticles(game.particles, seconds);
  updateMessages(seconds);
  audio.setEngine((game.scrollSpeed - 120) / 320);
}

function updateIdleBackdrop(seconds) {
  // Menus play over a slowly rolling street so the title never sits still.
  game.now += seconds;
  updateWorld(game.world, 110, seconds, game.deliveries, Math.random);
  game.particles = updateParticles(game.particles, seconds);
  updateMessages(seconds);
}

function clickOnButtons() {
  if (!input.click) return null;
  for (const button of game.buttons) {
    if (buttonHit(button, input.click)) return button.action;
  }
  return null;
}

let lastTime = performance.now();

function frame(nowMs) {
  const seconds = Math.min(0.05, (nowMs - lastTime) / 1000);
  lastTime = nowMs;

  if (input.wasPressed('click')) audio.unlock();

  if (game.screen === 'playing') {
    updatePlaying(seconds);
  } else if (game.screen === 'title' || game.screen === 'gameover' || game.screen === 'victory') {
    updateIdleBackdrop(seconds);
  }

  // Draw the world, then the menu overlay for the current screen.
  drawScene(ctx, game);
  game.buttons = [];
  if (game.screen === 'title') {
    game.buttons = drawTitle(ctx, game.best, game.bestDeliveries);
    if (input.wasPressed('confirm') || input.wasPressed('restart') || clickOnButtons() === 'start') {
      audio.click();
      startGame();
    }
  } else if (game.screen === 'paused') {
    game.buttons = drawPaused(ctx);
    const action = clickOnButtons();
    if (input.wasPressed('pause') || input.wasPressed('confirm') || action === 'resume') {
      game.screen = 'playing';
      setStatus('Lanjut narik!');
    } else if (action === 'restart') {
      startGame();
    }
  } else if (game.screen === 'gameover') {
    game.buttons = drawGameOver(ctx, game.score, game.deliveries, game.best, game.gameOverReason);
    if (input.wasPressed('confirm') || input.wasPressed('restart') || clickOnButtons() === 'restart') {
      audio.click();
      startGame();
    }
  } else if (game.screen === 'victory') {
    game.buttons = drawVictory(ctx, game.score, game.tips, game.crashes, game.best);
    if (input.wasPressed('confirm') || input.wasPressed('restart') || clickOnButtons() === 'restart') {
      audio.click();
      startGame();
    }
  }

  input.endFrame();
  requestAnimationFrame(frame);
}

setStatus('Ojek Rush. Tekan Enter untuk mulai narik.');
requestAnimationFrame(frame);
