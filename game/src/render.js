// Warung Rush — render: every pixel the game draws, in code.
// Scene: striped awning, warm wall, wooden floor, four round tables with
// customers, the order rail, the serving counter, three kitchen stations,
// HUD, floaters, and the title / pause / win / lose screens.

import { COLORS, DAY, DISHES, DISH_KEYS, LAYOUT, VIEW } from './config.js';
import { isMuted } from './audio.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function dishIcon(ctx, dish, x, y, s) {
  // s = icon size in px. Drawn with plain shapes: bowl, noodles, glass.
  if (dish === 'nasi') {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y + s * 0.18, s * 0.42, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = DISHES.nasi.color;
    ctx.beginPath();
    ctx.arc(x, y + s * 0.1, s * 0.34, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(x - s * 0.08, y - s * 0.28, s * 0.16, s * 0.1);
  } else if (dish === 'mie') {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y + s * 0.18, s * 0.42, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = DISHES.mie.color;
    ctx.lineWidth = s * 0.07;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.3, y - s * 0.05);
    ctx.quadraticCurveTo(x - s * 0.15, y - s * 0.22, x, y - s * 0.05);
    ctx.quadraticCurveTo(x + s * 0.15, y - s * 0.22, x + s * 0.3, y - s * 0.05);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#bfe3f0';
    ctx.fillRect(x - s * 0.22, y - s * 0.3, s * 0.44, s * 0.6);
    ctx.fillStyle = DISHES.teh.color;
    ctx.fillRect(x - s * 0.18, y - s * 0.12, s * 0.36, s * 0.38);
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = s * 0.06;
    ctx.beginPath();
    ctx.moveTo(x + s * 0.1, y - s * 0.1);
    ctx.lineTo(x + s * 0.22, y - s * 0.42);
    ctx.stroke();
  }
}

function drawBackground(ctx) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  // Awning stripes across the top.
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? COLORS.awningA : COLORS.awningB;
    ctx.fillRect(i * 80, 0, 80, 26);
  }
  // Wooden floor.
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 430, VIEW.w, VIEW.h - 430);
  ctx.strokeStyle = COLORS.floorLine;
  ctx.lineWidth = 2;
  for (let y = 470; y < VIEW.h; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(VIEW.w, y);
    ctx.stroke();
  }
  // Wall sign.
  text(ctx, 'WARUNG BU TINI', VIEW.w / 2, 44, 22, '#8b5a2b');
}

function drawCustomer(ctx, state, c, now) {
  const t = LAYOUT.tables[c.table];
  const bob = Math.sin(now * 2 + c.bob) * 2;
  const cx = t.x;
  const cy = t.y - 62 + bob;
  // Chair.
  ctx.fillStyle = COLORS.chair;
  ctx.beginPath();
  ctx.arc(cx, t.y + 52, 26, 0, Math.PI * 2);
  ctx.fill();
  // Body.
  ctx.fillStyle = c.skin.shirt;
  ctx.beginPath();
  ctx.arc(cx, cy + 34, 30, 0, Math.PI * 2);
  ctx.fill();
  // Head.
  ctx.fillStyle = c.skin.skin;
  ctx.beginPath();
  ctx.arc(cx, cy, 24, 0, Math.PI * 2);
  ctx.fill();
  // Hat.
  if (c.skin.hat === 'cap') {
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(cx, cy - 8, 24, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(cx - 24, cy - 10, 48, 6);
  } else if (c.skin.hat === 'band') {
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(cx - 24, cy - 14, 48, 8);
  }
  // Eyes.
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(cx - 8, cy - 2, 2.5, 0, Math.PI * 2);
  ctx.arc(cx + 8, cy - 2, 2.5, 0, Math.PI * 2);
  ctx.fill();
  const angry = c.state === 'waiting' || c.state === 'ordered'
    ? c.patience / c.patienceMax < 0.3
    : false;
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (angry) {
    ctx.moveTo(cx - 6, cy + 12);
    ctx.lineTo(cx + 6, cy + 8);
  } else {
    ctx.arc(cx, cy + 8, 6, 0.15 * Math.PI, 0.85 * Math.PI);
  }
  ctx.stroke();

  // Order bubble + patience bar.
  if (c.state === 'waiting' || c.state === 'ordered') {
    const bw = 46 + c.items.length * 44;
    const bx = cx - bw / 2;
    const by = cy - 118;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    rr(ctx, bx, by, bw, 52, 10);
    ctx.fill();
    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = 2;
    ctx.stroke();
    c.items.forEach((dish, i) => {
      dishIcon(ctx, dish, bx + 30 + i * 44, by + 26, 30);
    });
    if (c.state === 'ordered') {
      ctx.fillStyle = '#2e7d32';
      ctx.beginPath();
      ctx.arc(bx + bw - 8, by + 8, 9, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, '✓', bx + bw - 8, by + 8, 12, '#fff');
    }
    // Patience bar under the bubble.
    const frac = Math.max(0, c.patience / c.patienceMax);
    ctx.fillStyle = '#ddd';
    rr(ctx, bx, by + 58, bw, 8, 4);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#2e7d32' : frac > 0.25 ? '#f39c12' : '#c0392b';
    rr(ctx, bx, by + 58, bw * frac, 8, 4);
    ctx.fill();
  }
}

function drawTables(ctx, state, now) {
  for (let i = 0; i < LAYOUT.tables.length; i++) {
    const t = LAYOUT.tables[i];
    // Table shadow + top.
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(t.x, t.y + 58, 86, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.table;
    ctx.beginPath();
    ctx.arc(t.x, t.y, LAYOUT.tableRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.tableTop;
    ctx.beginPath();
    ctx.arc(t.x, t.y, LAYOUT.tableRadius - 10, 0, Math.PI * 2);
    ctx.fill();
    // Selection ring.
    if (state.selectedTable === i && state.screen === 'playing') {
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(t.x, t.y, LAYOUT.tableRadius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Table label only when the table is empty — a seated customer covers it.
    const occupied = state.customers.some((c) => c.table === i);
    if (!occupied) {
      text(ctx, 'MEJA ' + (i + 1), t.x, t.y + 2, 15, 'rgba(255,255,255,0.75)');
    }
  }
  for (const c of state.customers) drawCustomer(ctx, state, c, now);
}

function drawRail(ctx, state) {
  ctx.fillStyle = COLORS.railBg;
  ctx.fillRect(0, LAYOUT.railY, VIEW.w, LAYOUT.railHeight);
  text(ctx, 'PESANAN', 62, LAYOUT.railY + 28, 15, '#8b5a2b', 'center');
  if (state.tickets.length === 0) {
    text(ctx, 'Belum ada pesanan — klik pelanggan untuk mengambil pesanan', 560, LAYOUT.railY + 28, 16, '#8b5a2b', 'left');
  }
  state.tickets.forEach((ticket, i) => {
    const x = 130 + i * 150;
    ctx.fillStyle = '#fff';
    rr(ctx, x, LAYOUT.railY + 6, 140, 44, 8);
    ctx.fill();
    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    text(ctx, '#' + ticket.customerId, x + 10, LAYOUT.railY + 28, 14, '#8b5a2b', 'left');
    ticket.items.forEach((it, j) => {
      const ix = x + 52 + j * 40;
      dishIcon(ctx, it.dish, ix, LAYOUT.railY + 28, 26);
      if (it.done) {
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.arc(ix + 10, LAYOUT.railY + 16, 8, 0, Math.PI * 2);
        ctx.fill();
        text(ctx, '✓', ix + 10, LAYOUT.railY + 16, 10, '#fff');
      }
    });
  });
}

function drawCounter(ctx, state) {
  const y = 440;
  ctx.fillStyle = COLORS.counter;
  ctx.fillRect(0, y, VIEW.w, 55);
  ctx.fillStyle = COLORS.counterTop;
  ctx.fillRect(0, y, VIEW.w, 10);
  text(ctx, 'MEJA SAJI', 90, y + 32, 16, '#ffe9b8', 'center');
  DISH_KEYS.forEach((dish, i) => {
    const x = 560 + i * 200;
    dishIcon(ctx, dish, x, y + 28, 34);
    const n = state.readyStack[dish];
    ctx.fillStyle = n > 0 ? '#2e7d32' : '#888';
    ctx.beginPath();
    ctx.arc(x + 24, y + 12, 13, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, String(n), x + 24, y + 12, 14, '#fff');
    text(ctx, DISHES[dish].short, x, y + 46, 11, '#ffe9b8');
  });
  // (The bottom hint bar explains serving; the counter stays uncluttered.)
}

function drawKitchen(ctx, state, now) {
  const y = LAYOUT.kitchenY;
  for (const st of LAYOUT.stations) {
    const station = state.stations.find((s) => s.dish === st.dish);
    const dish = DISHES[st.dish];
    ctx.fillStyle = COLORS.station;
    rr(ctx, st.x, y, st.w, LAYOUT.kitchenHeight - 10, 12);
    ctx.fill();
    if (station.cooking) {
      ctx.strokeStyle = dish.color;
      ctx.lineWidth = 6;
      const frac = 1 - (station.cooking.endsAt - state.time) / station.cooking.duration;
      ctx.beginPath();
      ctx.arc(st.x + st.w / 2, y + 62, 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, frac)));
      ctx.stroke();
      text(ctx, Math.ceil(station.cooking.endsAt - state.time) + ' dtk', st.x + st.w / 2, y + 62, 16, '#fff');
    } else {
      dishIcon(ctx, st.dish, st.x + st.w / 2, y + 62, 52);
    }
    text(ctx, st.label, st.x + st.w / 2, y + 112, 14, '#ffe9b8');
    text(ctx, 'tombol ' + dish.key + ' · ' + dish.price + ' koin · ' + dish.cookSeconds + ' dtk', st.x + st.w / 2, y + 132, 12, '#cfc4b0');
  }
}

function drawHud(ctx, state) {
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, VIEW.w, LAYOUT.hudHeight);
  text(ctx, 'Koin: ' + state.coins, 20, 32, 20, COLORS.hudText, 'left');
  // Hearts.
  for (let i = 0; i < DAY.hearts; i++) {
    ctx.fillStyle = i < state.hearts ? '#e74c3c' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(240 + i * 34, 30, 12, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, '♥', 240 + i * 34, 31, 13, '#fff');
  }
  text(ctx, 'Disajikan: ' + state.served + '/' + DAY.targetServed, 380, 32, 20, COLORS.hudText, 'left');
  // Day timer.
  const frac = Math.max(0, state.timeLeft / DAY.lengthSeconds);
  ctx.fillStyle = '#222';
  rr(ctx, 620, 16, 260, 26, 13);
  ctx.fill();
  ctx.fillStyle = frac > 0.3 ? '#f1c40f' : '#c0392b';
  rr(ctx, 620, 16, 260 * frac, 26, 13);
  ctx.fill();
  text(ctx, Math.ceil(state.timeLeft) + ' dtk', 750, 30, 16, '#fff');
  text(ctx, 'Combo x' + state.combo, 900, 32, 18, state.combo > 1 ? '#f1c40f' : COLORS.hudText, 'left');
  text(ctx, isMuted() ? 'Suara: OFF (M)' : 'Suara: ON (M)', 1260, 32, 15, COLORS.hudText, 'right');
}

function drawFloaters(ctx, state) {
  for (const f of state.floaters) {
    const age = 1.2 - (f.endsAt - state.time);
    const alpha = Math.max(0, 1 - age / 1.2);
    ctx.globalAlpha = alpha;
    text(ctx, f.text, f.x, f.y - age * 30, 20, f.color);
    ctx.globalAlpha = 1;
  }
}

function drawHint(ctx, state) {
  text(ctx, 'Klik meja = ambil/sajikan pesanan · 1/2/3 = masak · ← → = pilih meja · P = jeda', VIEW.w / 2, 700, 14, '#5d4037');
  if (state.message && state.time < state.messageUntil) {
    ctx.fillStyle = 'rgba(61,43,31,0.9)';
    rr(ctx, VIEW.w / 2 - 260, 660, 520, 30, 15);
    ctx.fill();
    text(ctx, state.message, VIEW.w / 2, 676, 15, '#ffe9b8');
  }
}

function drawTitle(ctx) {
  ctx.fillStyle = 'rgba(61,43,31,0.85)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  text(ctx, 'WARUNG RUSH', VIEW.w / 2, 150, 64, '#f1c40f');
  text(ctx, 'Sore di Warung Bu Tini', VIEW.w / 2, 210, 26, '#ffe9b8');
  text(ctx, 'Pelanggan datang lapar. Ambil pesanan, masak, sajikan sebelum mereka marah!', VIEW.w / 2, 260, 20, '#fff');
  const lines = [
    'Klik meja pelanggan untuk mengambil pesanan dan menyajikan',
    'Tombol 1 / 2 / 3 untuk memasak Nasi Goreng / Mie Ayam / Es Teh',
    'Panah ← → untuk memilih meja, Enter untuk berinteraksi, P untuk jeda',
    'Sajikan ' + DAY.targetServed + ' pesanan sebelum waktu habis. 3 pelanggan marah = kalah!',
  ];
  lines.forEach((l, i) => text(ctx, l, VIEW.w / 2, 330 + i * 36, 19, '#ffe9b8'));
  text(ctx, 'Tekan ENTER atau klik untuk mulai', VIEW.w / 2, 520, 24, '#f1c40f');
  text(ctx, 'Game lengkap: masak, sajikan, kejar target — selamat bertugas!', VIEW.w / 2, 560, 16, '#cfc4b0');
}

function drawEnd(ctx, state, won) {
  ctx.fillStyle = won ? 'rgba(46,125,50,0.88)' : 'rgba(120,20,20,0.88)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  text(ctx, won ? 'HARI BERHASIL!' : 'WARUNG TUTUP AWAL', VIEW.w / 2, 180, 52, '#fff');
  text(ctx, won
    ? 'Semua target tercapai — Bu Tini bangga padamu!'
    : 'Terlalu banyak pelanggan pulang marah…', VIEW.w / 2, 240, 22, '#ffe9b8');
  const lines = [
    'Koin didapat: ' + state.coins,
    'Pesanan disajikan: ' + state.served + ' / ' + DAY.targetServed,
    'Pelanggan marah: ' + state.lost,
    'Combo terbaik: x' + state.bestCombo,
    'Masakan selesai: ' + state.stats.cooked + ' · Tip: ' + state.stats.tips + ' koin',
  ];
  lines.forEach((l, i) => text(ctx, l, VIEW.w / 2, 320 + i * 34, 20, '#fff'));
  text(ctx, 'Tekan ENTER atau R untuk main lagi', VIEW.w / 2, 540, 24, '#f1c40f');
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  text(ctx, 'JEDA', VIEW.w / 2, 320, 56, '#fff');
  text(ctx, 'Tekan P untuk lanjut', VIEW.w / 2, 380, 22, '#ffe9b8');
}

export function render(ctx, state, now) {
  ctx.clearRect(0, 0, VIEW.w, VIEW.h);
  drawBackground(ctx);
  drawTables(ctx, state, now);
  drawRail(ctx, state);
  drawCounter(ctx, state);
  drawKitchen(ctx, state, now);
  drawHud(ctx, state);
  drawFloaters(ctx, state);
  drawHint(ctx, state);
  if (state.screen === 'title') drawTitle(ctx);
  else if (state.screen === 'paused') drawPaused(ctx);
  else if (state.screen === 'win') drawEnd(ctx, state, true);
  else if (state.screen === 'lose') drawEnd(ctx, state, false);
}
