// Midnight Vault — deterministic screenshot states.
// ?shot=start|play|alert|win&seed=N puts the game in a fixed, readable pose
// so screenshots are reproducible: the thief mid-room with a guard cone, a
// camera cone, the loot and the alarm meter all visible in one frame.
import { createRng } from './random.js';

export function parseShotQuery(search) {
  const params = new URLSearchParams(search);
  return {
    shot: params.get('shot') || null,
    seed: Number(params.get('seed') || '1'),
  };
}

// Position the game for a screenshot. Returns true when a shot was applied.
export function applyShot(game, shot, seed) {
  const rng = createRng(seed);
  if (shot === 'start') {
    game.screen = 'title';
    game.time = 1.2;
    return true;
  }
  if (shot === 'play') {
    game.screen = 'playing';
    game.time = 6.0;
    // Thief halfway across the gallery, in the open between two covers.
    game.thief.x = 560;
    game.thief.y = 400;
    game.thief.faceAngle = Math.PI / 4;
    game.thief.moving = true;
    // A guard mid-patrol sweeping its cone toward the thief.
    const guard = game.guards[0];
    guard.x = 640;
    guard.y = 200;
    guard.angle = Math.PI / 2.4;
    guard.state = 'patrol';
    const guard2 = game.guards[1];
    guard2.x = 780;
    guard2.y = 620;
    guard2.angle = -Math.PI / 2;
    // A camera sweeping its red cone across the room.
    const camera = game.cameras[0];
    camera.angle = Math.PI / 2 + 0.5;
    camera.disabledTimer = 0;
    // Alarm part-filled so the meter reads, one gem already pocketed.
    game.alarm = 42;
    game.world.loot[0].taken = true;
    game.lootTaken = 1;
    game.score = 150;
    game.coins = 2;
    game.timeSeconds = 38;
    void rng;
    return true;
  }
  if (shot === 'alert') {
    game.screen = 'playing';
    game.time = 3.0;
    // Thief caught inside a guard's cone, alarm nearly full.
    game.thief.x = 640;
    game.thief.y = 300;
    game.thief.faceAngle = -Math.PI / 2;
    const guard = game.guards[0];
    guard.x = 640;
    guard.y = 190;
    guard.angle = Math.PI / 2;
    guard.state = 'chase';
    guard.seen = 0.9;
    const camera = game.cameras[0];
    camera.angle = Math.PI / 2;
    game.alarm = 88;
    game.anySpotted = true;
    game.score = 150;
    game.timeSeconds = 52;
    void rng;
    return true;
  }
  if (shot === 'win') {
    game.screen = 'win';
    game.time = 2.0;
    game.score = 2650;
    game.lootTaken = 4;
    game.timeSeconds = 184;
    game.alarm = 12;
    return true;
  }
  return false;
}
