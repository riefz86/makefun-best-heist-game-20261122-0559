// Midnight Vault — wall-mounted security cameras.
// A camera sits on a wall and sweeps its red cone back and forth. While it
// watches the thief the alarm climbs; an EMP shuts every camera down for a
// few seconds, and a camera never moves, so its sweep can be timed.
import { CAMERA_VIEW_RANGE, CAMERA_VIEW_HALF_ANGLE, CAMERA_SWEEP_SPEED } from './config.js';

export function createCamera(def) {
  return {
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    sweep: def.sweep ?? 1,
    angle: def.baseAngle,
    sweepPhase: 0,
    disabledTimer: 0,
    seen: 0,
  };
}

function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// How fast this camera is spotting the thief right now (0 when blind).
export function cameraSpotRate(camera, thief, world) {
  if (camera.disabledTimer > 0) return 0;
  const dx = thief.x - camera.x;
  const dy = thief.y - camera.y;
  const distance = Math.hypot(dx, dy);
  if (distance > CAMERA_VIEW_RANGE) return 0;
  const toThief = Math.atan2(dy, dx);
  if (Math.abs(angleDifference(toThief, camera.angle)) > CAMERA_VIEW_HALF_ANGLE) return 0;
  if (!world.hasLineOfSight(camera.x, camera.y, thief.x, thief.y)) return 0;
  const closeness = 1 - distance / CAMERA_VIEW_RANGE;
  return (0.5 + 0.8 * closeness) * (thief.sneaking ? 0.5 : 1);
}

export function updateCamera(camera, dt, thief, world) {
  if (camera.disabledTimer > 0) {
    camera.disabledTimer -= dt;
    camera.seen = Math.max(0, camera.seen - dt * 0.6);
    return camera.seen;
  }
  camera.sweepPhase += dt * CAMERA_SWEEP_SPEED * camera.sweep;
  camera.angle = camera.baseAngle + Math.sin(camera.sweepPhase) * 0.85;
  const rate = cameraSpotRate(camera, thief, world);
  if (rate > 0) {
    camera.seen = Math.min(1, camera.seen + rate * dt * 0.8);
  } else {
    camera.seen = Math.max(0, camera.seen - dt * 0.5);
  }
  return camera.seen;
}

export function disableAllCameras(cameras, seconds) {
  for (const camera of cameras) {
    camera.disabledTimer = seconds;
    camera.seen = 0;
  }
}

export { CAMERA_VIEW_RANGE, CAMERA_VIEW_HALF_ANGLE };
