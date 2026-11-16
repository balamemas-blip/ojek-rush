// Ojek Rush — the menu screens: title, pause, game over and victory.
// Each draw returns the buttons it painted, so the game loop can test
// a mouse click against them. All text is Indonesian first, with the
// key controls spelled out on the title screen.

import { CANVAS_WIDTH, CANVAS_HEIGHT, SHIFT_GOAL } from './config.js';
import { formatRupiah } from './storage.js';

function drawButton(ctx, x, y, width, height, label, accent) {
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 12);
  ctx.fill();
  ctx.fillStyle = '#1a1210';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + width / 2, y + height / 2 + 1);
  return { x, y, width, height, label };
}

function dimBackground(ctx) {
  ctx.fillStyle = 'rgba(12, 8, 10, 0.72)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function titleText(ctx, text, y, size, color, bold) {
  ctx.font = `${bold ? 'bold' : ''} ${size}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, CANVAS_WIDTH / 2, y);
}

export function drawTitle(ctx, best, bestDeliveries) {
  dimBackground(ctx);
  titleText(ctx, 'OJEK RUSH', 110, 64, '#ffd93d', true);
  titleText(ctx, 'Antar pesanan, kejar cuan, jangan nabrak!', 168, 22, '#f5f0e6', false);
  titleText(ctx, 'Ambil order di warung, antar ke rumah sebelum waktu habis.', 210, 18, '#f5f0e6', false);
  titleText(ctx, 'Isi bensin di jalan, kumpulkan koin, jaga nyawa.', 236, 18, '#f5f0e6', false);
  titleText(ctx, '← → pindah jalur   •   ↑ ngebut   •   ↓ ngerem   •   P jeda   •   M suara', 285, 17, '#ffd93d', false);
  titleText(ctx, `Selesaikan ${SHIFT_GOAL} pesanan untuk menutup shift.`, 318, 17, '#f5f0e6', false);
  if (best > 0) {
    titleText(ctx, `Rekor terbaik: ${formatRupiah(best)}`, 352, 18, '#7fb069', true);
  }
  if (bestDeliveries > 0) {
    titleText(ctx, `Pesanan terbanyak dalam 1 shift: ${bestDeliveries}`, 378, 15, '#c9b8a3', false);
  }
  const button = drawButton(ctx, CANVAS_WIDTH / 2 - 110, 390, 220, 56, 'MULAI NARIK', '#ffd93d');
  titleText(ctx, 'atau tekan Enter', 470, 15, '#c9b8a3', false);
  return [{ ...button, action: 'start' }];
}

export function drawPaused(ctx) {
  dimBackground(ctx);
  titleText(ctx, 'JEDA', 220, 52, '#ffd93d', true);
  titleText(ctx, 'Istirahat dulu, ordernya nunggu.', 280, 18, '#f5f0e6', false);
  const resume = drawButton(ctx, CANVAS_WIDTH / 2 - 110, 320, 220, 52, 'LANJUT', '#7fb069');
  const restart = drawButton(ctx, CANVAS_WIDTH / 2 - 110, 388, 220, 52, 'ULANGI', '#e9b44c');
  return [
    { ...resume, action: 'resume' },
    { ...restart, action: 'restart' },
  ];
}

export function drawGameOver(ctx, score, deliveries, best, reason) {
  dimBackground(ctx);
  titleText(ctx, 'SHIFT BERAKHIR', 110, 48, '#e2725b', true);
  titleText(ctx, reason, 168, 20, '#f5f0e6', false);
  titleText(ctx, `Penghasilan: ${formatRupiah(score)}`, 220, 28, '#ffd93d', true);
  titleText(ctx, `Pesanan selesai: ${deliveries} dari ${SHIFT_GOAL}`, 262, 18, '#f5f0e6', false);
  titleText(ctx, `Rekor terbaik: ${formatRupiah(best)}`, 292, 18, '#7fb069', false);
  const again = drawButton(ctx, CANVAS_WIDTH / 2 - 110, 340, 220, 56, 'NARIK LAGI', '#ffd93d');
  titleText(ctx, 'atau tekan Enter', 420, 15, '#c9b8a3', false);
  return [{ ...again, action: 'restart' }];
}

export function drawVictory(ctx, score, tips, crashes, best) {
  dimBackground(ctx);
  titleText(ctx, 'SHIFT SELESAI!', 100, 52, '#ffd93d', true);
  titleText(ctx, `${SHIFT_GOAL} pesanan terantar — pelanggan senang semua.`, 158, 19, '#f5f0e6', false);
  const stars = crashes === 0 ? 3 : crashes === 1 ? 2 : 1;
  titleText(ctx, '★'.repeat(stars) + '☆'.repeat(3 - stars), 205, 40, '#ffd93d', true);
  titleText(ctx, `Penghasilan: ${formatRupiah(score)}`, 265, 28, '#ffd93d', true);
  titleText(ctx, `Termasuk tip: ${formatRupiah(tips)}  •  Tabrakan: ${crashes}`, 305, 17, '#f5f0e6', false);
  titleText(ctx, `Rekor terbaik: ${formatRupiah(best)}`, 335, 18, '#7fb069', false);
  const again = drawButton(ctx, CANVAS_WIDTH / 2 - 110, 380, 220, 56, 'SHIFT LAGI', '#ffd93d');
  titleText(ctx, 'atau tekan Enter', 460, 15, '#c9b8a3', false);
  return [{ ...again, action: 'restart' }];
}

// True when a click point lands inside a button.
export function buttonHit(button, click) {
  return (
    click &&
    click.x >= button.x && click.x <= button.x + button.width &&
    click.y >= button.y && click.y <= button.y + button.height
  );
}
