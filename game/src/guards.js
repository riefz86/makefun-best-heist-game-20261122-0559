// Midnight Vault — patrolling guards with vision cones.
// A guard walks its waypoints, pauses, and sweeps its cone. When it sees the
// thief it raises the alarm and gives chase; a thrown coin pulls it to
// investigate instead. Detection is slower while the thief sneaks.
import {
  GUARD_SPEED, GUARD_CHASE_SPEED, GUARD_RADIUS, GUARD_VIEW_RANGE,
  GUARD_VIEW_HALF_ANGLE, COIN_INVESTIGATE_SECONDS,
} from './config.js';

export function createGuard(def, index) {
  const start = def.waypoints[0];
  return {
    x: start.x,
    y: start.y,
    radius: GUARD_RADIUS,
    angle: 0,
    waypointIndex: 1 % def.waypoints.length,
    pauseTimer: 0,
    pauseSeconds: def.pause ?? 1,
    state: 'patrol', // patrol | investigate | chase
    investigateX: 0,
    investigateY: 0,
    investigateTimer: 0,
    chaseTimer: 0,
    seen: 0, // 0..1, how sure this guard is that it sees the thief
    id: index,
  };
}

function angleTo(fromX, fromY, toX, toY) {
  return Math.atan2(toY - fromY, toX - fromX);
}

function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Can this guard see the thief right now? Range, cone and a clear line.
export function guardCanSee(guard, thief, world) {
  const dx = thief.x - guard.x;
  const dy = thief.y - guard.y;
  const distance = Math.hypot(dx, dy);
  if (distance > GUARD_VIEW_RANGE) return 0;
  const toThief = Math.atan2(dy, dx);
  const offAngle = Math.abs(angleDifference(toThief, guard.angle));
  if (offAngle > GUARD_VIEW_HALF_ANGLE) return 0;
  if (!world.hasLineOfSight(guard.x, guard.y, thief.x, thief.y)) return 0;
  // Closer and more centred = spotted faster; sneaking halves the rate.
  const closeness = 1 - distance / GUARD_VIEW_RANGE;
  const centred = 1 - offAngle / GUARD_VIEW_HALF_ANGLE;
  const sneakFactor = thief.sneaking ? 0.45 : 1;
  return (0.55 + 0.9 * closeness + 0.5 * centred) * sneakFactor;
}

export function updateGuard(guard, dt, thief, world, coins) {
  // A fresh coin landing nearby pulls the guard off patrol.
  for (const coin of coins) {
    if (!coin.claimed && Math.hypot(coin.x - guard.x, coin.y - guard.y) < 190) {
      coin.claimed = true;
      guard.state = 'investigate';
      guard.investigateX = coin.x;
      guard.investigateY = coin.y;
      guard.investigateTimer = COIN_INVESTIGATE_SECONDS;
      guard.seen = Math.max(0, guard.seen - 0.4);
    }
  }

  const sight = guardCanSee(guard, thief, world);
  if (sight > 0) {
    guard.seen = Math.min(1, guard.seen + sight * dt * 0.9);
    if (guard.seen > 0.55) {
      guard.state = 'chase';
      guard.chaseTimer = 2.5;
    }
  } else {
    guard.seen = Math.max(0, guard.seen - dt * 0.5);
    if (guard.state === 'chase') {
      guard.chaseTimer -= dt;
      if (guard.chaseTimer <= 0) guard.state = 'patrol';
    }
  }

  let targetX = guard.x;
  let targetY = guard.y;
  let speed = GUARD_SPEED;

  if (guard.state === 'chase') {
    targetX = thief.x;
    targetY = thief.y;
    speed = GUARD_CHASE_SPEED;
  } else if (guard.state === 'investigate') {
    targetX = guard.investigateX;
    targetY = guard.investigateY;
    guard.investigateTimer -= dt;
    if (guard.investigateTimer <= 0) guard.state = 'patrol';
  } else {
    const wp = guard.def
      ? guard.def.waypoints[guard.waypointIndex]
      : null;
    if (wp) {
      targetX = wp.x;
      targetY = wp.y;
    }
  }

  const dx = targetX - guard.x;
  const dy = targetY - guard.y;
  const distance = Math.hypot(dx, dy);
  if (distance > 4) {
    const step = Math.min(distance, speed * dt);
    const nx = guard.x + (dx / distance) * step;
    const ny = guard.y + (dy / distance) * step;
    if (!world.hitsSolid(nx, guard.y, guard.radius)) guard.x = nx;
    if (!world.hitsSolid(guard.x, ny, guard.radius)) guard.y = ny;
    guard.angle = Math.atan2(dy, dx);
  } else if (guard.state === 'patrol') {
    // Reached a waypoint: pause, look around, then move on.
    if (guard.pauseTimer <= 0) {
      guard.pauseTimer = guard.pauseSeconds;
    } else {
      guard.pauseTimer -= dt;
      guard.angle += dt * 0.8; // slow scan while waiting
      if (guard.pauseTimer <= 0) {
        guard.waypointIndex = (guard.waypointIndex + 1) % guard.def.waypoints.length;
      }
    }
  }
  return guard.seen;
}

// Attach the level definition to each guard so updateGuard can walk it.
export function createGuards(defs) {
  return defs.map((def, i) => {
    const guard = createGuard(def, i);
    guard.def = def;
    return guard;
  });
}

export { angleTo, angleDifference };
