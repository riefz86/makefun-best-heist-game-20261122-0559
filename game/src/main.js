// Midnight Vault — game loop and state machine.
// Owns the thief, the alarm, tools (coins, EMP), level flow and the screens:
// title -> playing -> (caught | levelComplete) -> ... -> win.
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, LEVELS, THIEF_RADIUS, THIEF_SPEED,
  THIEF_SNEAK_SPEED, ALARM_MAX, ALARM_DECAY_PER_SECOND, SPOTTED_THRESHOLD,
  COIN_COUNT_START, EMP_COUNT_START, EMP_DISABLE_SECONDS,
} from './config.js';
import { createWorld } from './world.js';
import { createGuards, updateGuard } from './guards.js';
import { createCamera, updateCamera, disableAllCameras } from './cameras.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { render } from './render.js';
import { parseShotQuery, applyShot } from './shots.js';

export function createGame(canvas) {
  const ctx = canvas.getContext('2d');
  const input = createInput(canvas);
  const audio = createAudio();

  const game = {
    screen: 'title', // title | playing | paused | caught | levelComplete | win
    levelIndex: 0,
    world: null,
    thief: null,
    guards: [],
    cameras: [],
    alarm: 0,
    anySpotted: false,
    score: 0,
    lootTaken: 0,
    lootTotal: 0,
    coins: COIN_COUNT_START,
    emp: EMP_COUNT_START,
    time: 0,
    timeSeconds: 0,
    message: '',
    messageTimer: 0,
    alarmBeepTimer: 0,
    shotMode: false,
  };

  function loadLevel(index) {
    game.levelIndex = index;
    game.world = createWorld(index);
    const start = LEVELS[index].thiefStart;
    game.thief = {
      x: start.x, y: start.y, radius: THIEF_RADIUS,
      faceAngle: -Math.PI / 2, moving: false, sneaking: false,
    };
    game.guards = createGuards(LEVELS[index].guards);
    game.cameras = LEVELS[index].cameras.map((c) => createCamera(c));
    game.alarm = 0;
    game.anySpotted = false;
    game.coins = COIN_COUNT_START;
    game.emp = EMP_COUNT_START;
    game.lootTotal = 1 + LEVELS[index].loot.length;
    game.timeSeconds = 0;
    game.message = '';
    game.messageTimer = 0;
  }

  function startLevel(index) {
    loadLevel(index);
    game.screen = 'playing';
  }

  function restartRoom() {
    audio.ensure();
    startLevel(game.levelIndex);
  }

  function throwCoin(targetX, targetY) {
    if (game.coins <= 0) return;
    game.coins -= 1;
    game.world.coins.push({ x: targetX, y: targetY, claimed: false, timer: 4 });
    audio.coin();
  }

  function useEmp() {
    if (game.emp <= 0) return;
    game.emp -= 1;
    disableAllCameras(game.cameras, EMP_DISABLE_SECONDS);
    audio.emp();
    game.message = 'EMP! Cameras down for 7s';
    game.messageTimer = 2;
  }

  function updatePlaying(dt) {
    const thief = game.thief;
    const move = input.moveVector();
    thief.sneaking = input.isSneaking();
    const speed = thief.sneaking ? THIEF_SNEAK_SPEED : THIEF_SPEED;
    thief.moving = move.x !== 0 || move.y !== 0;
    if (thief.moving) {
      thief.faceAngle = Math.atan2(move.y, move.x);
      game.world.moveCircle(thief, move.x * speed * dt, move.y * speed * dt);
      if (Math.random() < dt * 4) audio.step();
    }

    // Tools: E grabs loot, Q or a mouse click tosses a coin, Space/F fires EMP.
    if (input.consumePressed('KeyE')) {
      const grabbed = game.world.tryGrabLoot(thief);
      if (grabbed) {
        game.score += grabbed.value;
        game.lootTaken += 1;
        audio.grabLoot();
        if (grabbed.kind === 'main') {
          audio.unlock();
          game.message = `${grabbed.label} secured — the exit is open!`;
          game.messageTimer = 3;
        } else {
          game.message = `${grabbed.label} pocketed (+${grabbed.value})`;
          game.messageTimer = 2;
        }
      }
    }
    if (input.consumePressed('KeyQ') || input.mouse.clicked) {
      throwCoin(input.mouse.clickX || thief.x + Math.cos(thief.faceAngle) * 120,
        input.mouse.clickY || thief.y + Math.sin(thief.faceAngle) * 120);
    }
    if (input.consumePressed('Space') || input.consumePressed('KeyF')) useEmp();

    // Watchers: guards and cameras raise the alarm when they see the thief.
    let spotted = false;
    let alarmRate = 0;
    for (const guard of game.guards) {
      const seen = updateGuard(guard, dt, thief, game.world, game.world.coins);
      if (seen > 0.3) {
        spotted = true;
        alarmRate += 26 * seen;
      }
      // A chasing guard that touches the thief ends the run.
      if (guard.state === 'chase' &&
        Math.hypot(guard.x - thief.x, guard.y - thief.y) < guard.radius + thief.radius + 2) {
        game.alarm = ALARM_MAX;
      }
    }
    for (const camera of game.cameras) {
      const seen = updateCamera(camera, dt, thief, game.world);
      if (seen > 0.3) {
        spotted = true;
        alarmRate += 20 * seen;
      }
    }

    const wasSpotted = game.anySpotted;
    game.anySpotted = spotted && game.alarm >= SPOTTED_THRESHOLD;
    if (game.anySpotted && !wasSpotted) audio.spotted();

    if (alarmRate > 0) {
      game.alarm = Math.min(ALARM_MAX, game.alarm + alarmRate * dt);
      game.alarmBeepTimer -= dt;
      if (game.alarmBeepTimer <= 0 && game.alarm > 50) {
        audio.alarmLoop();
        game.alarmBeepTimer = 0.9;
      }
    } else {
      game.alarm = Math.max(0, game.alarm - ALARM_DECAY_PER_SECOND * dt);
    }

    // Coins fade after a few seconds.
    for (const coin of game.world.coins) coin.timer -= dt;
    game.world.coins = game.world.coins.filter((c) => c.timer > 0);

    game.timeSeconds += dt;
    if (game.messageTimer > 0) game.messageTimer -= dt;

    // Caught: the alarm filled.
    if (game.alarm >= ALARM_MAX) {
      game.screen = 'caught';
      audio.caught();
      return;
    }

    // Getaway: step into the open exit.
    const exit = game.world.exit;
    if (exit.open &&
      thief.x > exit.x - 10 && thief.x < exit.x + exit.w + 10 &&
      thief.y > exit.y - 10 && thief.y < exit.y + exit.h + 10) {
      game.score += Math.max(0, 300 - Math.floor(game.timeSeconds) * 2);
      if (game.levelIndex >= LEVELS.length - 1) {
        game.screen = 'win';
        audio.win();
      } else {
        game.screen = 'levelComplete';
        audio.win();
      }
    }
  }

  function update(dt) {
    game.time += dt;

    if (input.consumePressed('KeyM')) audio.toggleMute();
    if (input.consumePressed('KeyR') && game.screen !== 'title') {
      restartRoom();
      input.endFrame();
      return;
    }

    if (game.screen === 'title') {
      if (input.consumePressed('Enter')) {
        audio.ensure();
        startLevel(0);
      }
    } else if (game.screen === 'playing') {
      if (input.consumePressed('KeyP')) {
        game.screen = 'paused';
      } else {
        updatePlaying(dt);
      }
    } else if (game.screen === 'paused') {
      if (input.consumePressed('KeyP')) game.screen = 'playing';
    } else if (game.screen === 'caught') {
      if (input.consumePressed('Enter')) restartRoom();
    } else if (game.screen === 'levelComplete') {
      if (input.consumePressed('Enter')) startLevel(game.levelIndex + 1);
    } else if (game.screen === 'win') {
      if (input.consumePressed('Enter')) {
        game.score = 0;
        game.lootTaken = 0;
        startLevel(0);
      }
    }
    input.endFrame();
  }

  let lastTimestamp = 0;
  function frame(timestamp) {
    const dt = Math.min(0.05, (timestamp - lastTimestamp) / 1000 || 0.016);
    lastTimestamp = timestamp;
    if (!game.shotMode) update(dt);
    render(ctx, game);
    requestAnimationFrame(frame);
  }

  // Exposed for automated play-testing (window.__midnightVault).
  game.debug = {
    state: () => ({
      screen: game.screen,
      level: game.levelIndex,
      alarm: game.alarm,
      score: game.score,
      thief: { x: game.thief.x, y: game.thief.y },
      lootTaken: game.lootTaken,
      exitOpen: game.world.exit.open,
    }),
    teleport: (x, y) => { game.thief.x = x; game.thief.y = y; },
    start: () => startLevel(0),
  };

  function init() {
    loadLevel(0);
    const { shot, seed } = parseShotQuery(window.location.search);
    if (shot) {
      game.shotMode = applyShot(game, shot, seed);
      if (game.shotMode) {
        // One deterministic render, then keep rendering the frozen pose.
        render(ctx, game);
      }
    }
    requestAnimationFrame(frame);
  }

  return { game, init };
}

const canvas = document.getElementById('game');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const { game, init } = createGame(canvas);
window.__midnightVault = game;
init();
