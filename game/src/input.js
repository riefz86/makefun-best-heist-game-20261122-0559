// Midnight Vault — keyboard and mouse input.
// Tracks held keys, edge-triggered presses (E, Q, Space, R, P, M) and the
// mouse position in canvas coordinates, so the game loop reads one object.
export function createInput(canvas) {
  const input = {
    keys: new Set(),
    pressed: new Set(),
    mouse: { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 },
    sneak: false,
  };

  const GAME_KEYS = [
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight',
    'KeyE', 'KeyQ', 'KeyF', 'KeyR', 'KeyP', 'KeyM', 'Space', 'Enter',
  ];

  function onKeyDown(event) {
    if (GAME_KEYS.includes(event.code)) event.preventDefault();
    if (!event.repeat) input.pressed.add(event.code);
    input.keys.add(event.code);
  }
  function onKeyUp(event) {
    input.keys.delete(event.code);
  }
  function onMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    input.mouse.x = (event.clientX - rect.left) * (canvas.width / rect.width);
    input.mouse.y = (event.clientY - rect.top) * (canvas.height / rect.height);
  }
  function onMouseDown(event) {
    onMouseMove(event);
    input.mouse.clicked = true;
    input.mouse.clickX = input.mouse.x;
    input.mouse.clickY = input.mouse.y;
  }
  function onBlur() {
    input.keys.clear();
    input.pressed.clear();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('blur', onBlur);

  input.isDown = (code) => input.keys.has(code);
  input.wasPressed = (code) => input.pressed.has(code);
  input.consumePressed = (code) => {
    const hit = input.pressed.has(code);
    if (hit) input.pressed.delete(code);
    return hit;
  };
  // Movement vector from WASD / arrow keys, normalised.
  input.moveVector = () => {
    let x = 0;
    let y = 0;
    if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) x -= 1;
    if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) x += 1;
    if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) y -= 1;
    if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.hypot(x, y);
      x *= inv;
      y *= inv;
    }
    return { x, y };
  };
  input.isSneaking = () =>
    input.keys.has('ShiftLeft') || input.keys.has('ShiftRight');
  // Called at the end of each frame so presses fire exactly once.
  input.endFrame = () => {
    input.pressed.clear();
    input.mouse.clicked = false;
  };
  return input;
}
