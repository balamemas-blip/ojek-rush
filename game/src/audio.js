// Warung Rush — sound: tiny WebAudio synth, no audio files.
// The context is created lazily on the first user gesture, so the game
// never blocks on audio and never needs a network request.

let ctx = null;
let muted = false;

function ensureCtx() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    } catch (e) {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function unlockAudio() {
  ensureCtx();
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, durMs, type, gain, whenMs = 0) {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  const t0 = ac.currentTime + whenMs / 1000;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + durMs / 1000);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + durMs / 1000 + 0.05);
}

export const sfx = {
  click() { tone(660, 60, 'sine', 0.12); },
  takeOrder() { tone(520, 70, 'triangle', 0.14); tone(780, 70, 'triangle', 0.12, 60); },
  cookStart() { tone(330, 90, 'square', 0.06); },
  dishReady() { tone(880, 90, 'sine', 0.16); tone(1174, 120, 'sine', 0.14, 90); },
  coin() { tone(988, 80, 'sine', 0.16); tone(1319, 140, 'sine', 0.16, 70); },
  angry() { tone(220, 180, 'sawtooth', 0.1); tone(185, 220, 'sawtooth', 0.1, 120); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 160, 'triangle', 0.16, i * 120)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, 200, 'triangle', 0.14, i * 140)); },
};
