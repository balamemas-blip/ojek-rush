// Ojek Rush — keyboard and mouse input.
// Keeps one small state object: which keys are held, which were just
// pressed, and where the mouse clicked. The game loop reads it; nothing
// here knows what the game does with a press.

export function createInput(canvas) {
  const input = {
    left: false,
    right: false,
    up: false,
    down: false,
    // Edge-triggered presses, consumed by the game once each frame.
    pressed: new Set(),
    // Last mouse click in canvas pixels (null until the first click).
    click: null,
  };

  const keyMap = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    Enter: 'confirm', Space: 'confirm',
    KeyP: 'pause', Escape: 'pause',
    KeyM: 'mute', KeyH: 'horn', KeyR: 'restart',
  };

  function onKeyDown(event) {
    const name = keyMap[event.code];
    if (!name) return;
    event.preventDefault();
    if (!event.repeat) input.pressed.add(name);
    if (name === 'left' || name === 'right' || name === 'up' || name === 'down') {
      input[name] = true;
    }
  }

  function onKeyUp(event) {
    const name = keyMap[event.code];
    if (!name) return;
    if (name === 'left' || name === 'right' || name === 'up' || name === 'down') {
      input[name] = false;
    }
  }

  function onPointerDown(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    input.click = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
    input.pressed.add('click');
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);

  // Called at the end of each frame so a press fires exactly once.
  input.endFrame = function endFrame() {
    input.pressed.clear();
    input.click = null;
  };

  input.wasPressed = function wasPressed(name) {
    return input.pressed.has(name);
  };

  return input;
}
