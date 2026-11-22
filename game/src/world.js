// Midnight Vault — the room: walls, cover, loot and the getaway exit.
// Owns collision (circle vs rectangle), line of sight (segment vs rect)
// and loot pickup, so guards, cameras and the thief all ask the same world.
import { LEVELS, PLAY_LEFT, PLAY_RIGHT, PLAY_TOP, PLAY_BOTTOM } from './config.js';

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function circleHitsRect(cx, cy, radius, rect) {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

// Does segment (x1,y1)-(x2,y2) cross rectangle r? Used for vision cones.
export function segmentHitsRect(x1, y1, x2, y2, r) {
  if (x1 >= r.x && x1 <= r.x + r.w && y1 >= r.y && y1 <= r.y + r.h) return true;
  if (x2 >= r.x && x2 <= r.x + r.w && y2 >= r.y && y2 <= r.y + r.h) return true;
  const edges = [
    [r.x, r.y, r.x + r.w, r.y],
    [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h],
    [r.x, r.y + r.h, r.x, r.y],
  ];
  return edges.some(([ax, ay, bx, by]) => segmentsCross(x1, y1, x2, y2, ax, ay, bx, by));
}

function segmentsCross(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d1 = direction(x3, y3, x4, y4, x1, y1);
  const d2 = direction(x3, y3, x4, y4, x2, y2);
  const d3 = direction(x1, y1, x2, y2, x3, y3);
  const d4 = direction(x1, y1, x2, y2, x4, y4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function direction(ax, ay, bx, by, cx, cy) {
  return (cx - ax) * (by - ay) - (cy - ay) * (bx - ax);
}

export function createWorld(levelIndex) {
  const def = LEVELS[levelIndex];
  const world = {
    levelIndex,
    def,
    walls: def.walls.map((w) => ({ ...w })),
    cover: def.cover.map((c) => ({ ...c, solid: true })),
    mainLoot: { ...def.mainLoot, taken: false },
    loot: def.loot.map((l) => ({ ...l, taken: false })),
    exit: { ...def.exit, open: false },
    coins: [],
    // Every solid rectangle: walls, cover and the play-area border.
    solids() {
      return [...this.walls, ...this.cover];
    },
    // Move a circle by (dx, dy), sliding along solids and the room border.
    moveCircle(entity, dx, dy) {
      const nextX = entity.x + dx;
      if (!this.hitsSolid(nextX, entity.y, entity.radius)) {
        entity.x = Math.max(PLAY_LEFT + entity.radius,
          Math.min(PLAY_RIGHT - entity.radius, nextX));
      }
      const nextY = entity.y + dy;
      if (!this.hitsSolid(entity.x, nextY, entity.radius)) {
        entity.y = Math.max(PLAY_TOP + entity.radius,
          Math.min(PLAY_BOTTOM - entity.radius, nextY));
      }
    },
    hitsSolid(x, y, radius) {
      return this.solids().some((s) => circleHitsRect(x, y, radius, s));
    },
    // True when nothing solid stands between two points.
    hasLineOfSight(x1, y1, x2, y2) {
      return !this.solids().some((s) => segmentHitsRect(x1, y1, x2, y2, s));
    },
    // The thief grabs the main loot or a nearby gem with E.
    tryGrabLoot(thief) {
      const reach = 34;
      if (!this.mainLoot.taken &&
        Math.hypot(thief.x - this.mainLoot.x, thief.y - this.mainLoot.y) < reach + 16) {
        this.mainLoot.taken = true;
        this.exit.open = true;
        return { kind: 'main', value: this.mainLoot.value, label: this.mainLoot.label };
      }
      for (const gem of this.loot) {
        if (!gem.taken && Math.hypot(thief.x - gem.x, thief.y - gem.y) < reach + 12) {
          gem.taken = true;
          return { kind: 'gem', value: gem.value, label: gem.label };
        }
      }
      return null;
    },
    lootRemaining() {
      return this.loot.filter((g) => !g.taken).length + (this.mainLoot.taken ? 0 : 1);
    },
  };
  return world;
}
