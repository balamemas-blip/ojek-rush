// Ojek Rush — synthesized sound, no audio files.
// Every effect is a small WebAudio oscillator burst, so the game ships
// zero assets and never fetches anything. The engine hum is a looped
// oscillator whose pitch follows the road speed.

export function createAudio() {
  const audio = {
    context: null,
    muted: false,
    engineOsc: null,
    engineGain: null,
  };

  // Browsers only let audio start after a user gesture; call on first input.
  audio.unlock = function unlock() {
    if (audio.context) {
      if (audio.context.state === 'suspended') audio.context.resume();
      return;
    }
    const Ctor = window.AudioContext ?? window.webkitAudioContext;
    if (!Ctor) return;
    audio.context = new Ctor();
    audio.engineOsc = audio.context.createOscillator();
    audio.engineOsc.type = 'sawtooth';
    audio.engineOsc.frequency.value = 55;
    audio.engineGain = audio.context.createGain();
    audio.engineGain.gain.value = 0.0;
    const filter = audio.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    audio.engineOsc.connect(filter);
    filter.connect(audio.engineGain);
    audio.engineGain.connect(audio.context.destination);
    audio.engineOsc.start();
  };

  function tone(freq, seconds, type, volume, slideTo) {
    if (!audio.context || audio.muted) return;
    const now = audio.context.currentTime;
    const osc = audio.context.createOscillator();
    const gain = audio.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + seconds);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
    osc.connect(gain);
    gain.connect(audio.context.destination);
    osc.start(now);
    osc.stop(now + seconds + 0.02);
  }

  audio.setEngine = function setEngine(speedRatio) {
    if (!audio.engineOsc || !audio.engineGain) return;
    const target = audio.muted ? 0 : 0.018 + speedRatio * 0.03;
    audio.engineGain.gain.setTargetAtTime(target, audio.context.currentTime, 0.1);
    audio.engineOsc.frequency.setTargetAtTime(50 + speedRatio * 90, audio.context.currentTime, 0.1);
  };

  audio.coin = function coin() { tone(880, 0.12, 'sine', 0.15, 1320); };
  audio.nearMiss = function nearMiss() { tone(1200, 0.09, 'sine', 0.07, 320); };
  audio.pickup = function pickup() { tone(523, 0.1, 'triangle', 0.2); tone(784, 0.14, 'triangle', 0.2); };
  audio.deliver = function deliver() {
    tone(659, 0.1, 'triangle', 0.2);
    setTimeout(() => tone(784, 0.1, 'triangle', 0.2), 90);
    setTimeout(() => tone(1047, 0.2, 'triangle', 0.22), 180);
  };
  audio.crash = function crash() { tone(140, 0.35, 'sawtooth', 0.3, 40); };
  audio.fuel = function fuel() { tone(392, 0.15, 'sine', 0.18, 587); };
  audio.click = function click() { tone(660, 0.06, 'square', 0.08); };
  audio.horn = function horn() { tone(370, 0.18, 'square', 0.12); tone(466, 0.18, 'square', 0.1); };
  audio.levelUp = function levelUp() {
    tone(523, 0.1, 'triangle', 0.2);
    setTimeout(() => tone(659, 0.1, 'triangle', 0.2), 100);
    setTimeout(() => tone(784, 0.18, 'triangle', 0.2), 200);
  };
  audio.gameOver = function gameOver() {
    tone(392, 0.25, 'triangle', 0.2, 311);
    setTimeout(() => tone(311, 0.4, 'triangle', 0.2, 233), 220);
  };
  audio.win = function win() {
    [523, 659, 784, 1047].forEach((freq, i) => {
      setTimeout(() => tone(freq, 0.25, 'triangle', 0.2), i * 130);
    });
  };

  audio.toggleMute = function toggleMute() {
    audio.muted = !audio.muted;
    if (audio.engineGain) {
      audio.engineGain.gain.value = audio.muted ? 0 : 0.02;
    }
    return audio.muted;
  };

  return audio;
}
