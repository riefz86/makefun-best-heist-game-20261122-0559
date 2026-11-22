// Midnight Vault — configuration: canvas, tuning constants and the three rooms.
// Every number that shapes how the game feels lives here, so tuning never
// means hunting through the draw or update code.
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;
export const HUD_HEIGHT = 64;
export const PLAY_TOP = HUD_HEIGHT;
export const PLAY_BOTTOM = CANVAS_HEIGHT - 8;
export const PLAY_LEFT = 8;
export const PLAY_RIGHT = CANVAS_WIDTH - 8;

export const THIEF_RADIUS = 14;
export const THIEF_SPEED = 185;
export const THIEF_SNEAK_SPEED = 96;
export const GUARD_SPEED = 92;
export const GUARD_CHASE_SPEED = 165;
export const GUARD_RADIUS = 15;
export const GUARD_VIEW_RANGE = 235;
export const GUARD_VIEW_HALF_ANGLE = 0.52; // ~60 degree cone
export const CAMERA_VIEW_RANGE = 265;
export const CAMERA_VIEW_HALF_ANGLE = 0.42;
export const CAMERA_SWEEP_SPEED = 0.55;

export const ALARM_MAX = 100;
export const ALARM_DECAY_PER_SECOND = 14;
export const SPOTTED_THRESHOLD = 30;
export const COIN_COUNT_START = 3;
export const EMP_COUNT_START = 1;
export const EMP_DISABLE_SECONDS = 7;
export const COIN_DISTRACT_RADIUS = 190;
export const COIN_INVESTIGATE_SECONDS = 3.5;

export const COLORS = {
  floorA: '#232946',
  floorB: '#1d2340',
  floorLine: '#2e3760',
  wall: '#12162b',
  wallTop: '#3b4370',
  coverCrate: '#6b4f2a',
  coverCrateTop: '#8a6a3b',
  coverStatue: '#7d8aa8',
  coverPlant: '#2f6b4f',
  coverPlantLeaf: '#3f9e6b',
  thief: '#e8c15a',
  thiefDark: '#8a6d1f',
  guard: '#e05252',
  guardDark: '#7a1f1f',
  coneGuard: 'rgba(255, 214, 90, 0.20)',
  coneGuardEdge: 'rgba(255, 214, 90, 0.55)',
  coneCamera: 'rgba(255, 70, 70, 0.18)',
  coneCameraEdge: 'rgba(255, 70, 70, 0.55)',
  loot: '#ffd94d',
  lootGlow: 'rgba(255, 217, 77, 0.35)',
  exit: '#39d98a',
  exitLocked: '#5a6b7a',
  alarmLow: '#39d98a',
  alarmMid: '#ffb020',
  alarmHigh: '#ff4040',
  text: '#eef1ff',
  textDim: '#9aa3c7',
  panel: 'rgba(10, 12, 28, 0.82)',
};

// A room is: walls (rects), cover (rects with a kind), guards (patrol
// waypoints), cameras (fixed mount + sweep), loot (main + optional),
// the thief start and the getaway exit.
export const LEVELS = [
  {
    name: 'Room 1 — The Gallery',
    subtitle: 'Steal the Moonstone. Slip past the night watch.',
    mainLoot: { x: 640, y: 330, label: 'MOONSTONE', value: 500 },
    thiefStart: { x: 90, y: 620 },
    exit: { x: 1190, y: 100, w: 62, h: 90, label: 'SERVICE DOOR' },
    walls: [
      { x: 300, y: 150, w: 26, h: 220 },
      { x: 300, y: 470, w: 26, h: 150 },
      { x: 954, y: 150, w: 26, h: 220 },
      { x: 954, y: 470, w: 26, h: 150 },
      { x: 560, y: 470, w: 160, h: 26 },
    ],
    cover: [
      { x: 150, y: 180, w: 84, h: 84, kind: 'statue' },
      { x: 150, y: 480, w: 84, h: 84, kind: 'crate' },
      { x: 430, y: 240, w: 70, h: 70, kind: 'plant' },
      { x: 780, y: 240, w: 70, h: 70, kind: 'plant' },
      { x: 1046, y: 180, w: 84, h: 84, kind: 'statue' },
      { x: 1046, y: 480, w: 84, h: 84, kind: 'crate' },
      { x: 560, y: 560, w: 160, h: 60, kind: 'crate' },
    ],
    guards: [
      { waypoints: [{ x: 420, y: 160 }, { x: 860, y: 160 }], pause: 1.2 },
      { waypoints: [{ x: 860, y: 580 }, { x: 420, y: 580 }], pause: 1.2 },
    ],
    cameras: [
      { x: 640, y: 78, baseAngle: Math.PI / 2, sweep: 0.9 },
      { x: 1220, y: 380, baseAngle: Math.PI, sweep: 0.7 },
    ],
    loot: [
      { x: 210, y: 330, label: 'RUBY', value: 150 },
      { x: 1070, y: 330, label: 'EMERALD', value: 150 },
    ],
  },
  {
    name: 'Room 2 — The Vault',
    subtitle: 'The Sun Diamond sits behind two patrols and a camera web.',
    mainLoot: { x: 640, y: 300, label: 'SUN DIAMOND', value: 800 },
    thiefStart: { x: 90, y: 620 },
    exit: { x: 1190, y: 100, w: 62, h: 90, label: 'VAULT STAIRS' },
    walls: [
      { x: 200, y: 150, w: 26, h: 180 },
      { x: 200, y: 430, w: 26, h: 190 },
      { x: 1054, y: 150, w: 26, h: 180 },
      { x: 1054, y: 430, w: 26, h: 190 },
      { x: 460, y: 150, w: 360, h: 26 },
      { x: 460, y: 520, w: 360, h: 26 },
      { x: 620, y: 176, w: 40, h: 130 },
    ],
    cover: [
      { x: 120, y: 160, w: 60, h: 60, kind: 'crate' },
      { x: 120, y: 500, w: 60, h: 60, kind: 'crate' },
      { x: 340, y: 330, w: 70, h: 70, kind: 'statue' },
      { x: 870, y: 330, w: 70, h: 70, kind: 'statue' },
      { x: 1100, y: 160, w: 60, h: 60, kind: 'plant' },
      { x: 1100, y: 500, w: 60, h: 60, kind: 'plant' },
      { x: 500, y: 580, w: 120, h: 52, kind: 'crate' },
      { x: 700, y: 90, w: 120, h: 52, kind: 'crate' },
    ],
    guards: [
      { waypoints: [{ x: 330, y: 220 }, { x: 950, y: 220 }, { x: 950, y: 440 }, { x: 330, y: 440 }], pause: 0.8 },
      { waypoints: [{ x: 640, y: 620 }, { x: 640, y: 120 }], pause: 1.0 },
      { waypoints: [{ x: 1120, y: 620 }, { x: 1120, y: 120 }], pause: 1.0 },
    ],
    cameras: [
      { x: 640, y: 78, baseAngle: Math.PI / 2, sweep: 1.1 },
      { x: 60, y: 380, baseAngle: 0, sweep: 0.8 },
      { x: 1220, y: 380, baseAngle: Math.PI, sweep: 0.8 },
    ],
    loot: [
      { x: 140, y: 330, label: 'GOLD BAR', value: 200 },
      { x: 1140, y: 330, label: 'PEARL', value: 200 },
      { x: 640, y: 620, label: 'SAPPHIRE', value: 200 },
    ],
  },
  {
    name: 'Room 3 — The Rooftop',
    subtitle: 'Grab the Crown Jewels and reach the getaway van on the roof.',
    mainLoot: { x: 640, y: 300, label: 'CROWN JEWELS', value: 1200 },
    thiefStart: { x: 90, y: 620 },
    exit: { x: 1190, y: 100, w: 62, h: 90, label: 'GETAWAY VAN' },
    walls: [
      { x: 280, y: 150, w: 26, h: 200 },
      { x: 280, y: 450, w: 26, h: 170 },
      { x: 974, y: 150, w: 26, h: 200 },
      { x: 974, y: 450, w: 26, h: 170 },
      { x: 520, y: 380, w: 240, h: 26 },
    ],
    cover: [
      { x: 130, y: 170, w: 90, h: 70, kind: 'crate' },
      { x: 130, y: 500, w: 90, h: 70, kind: 'crate' },
      { x: 1060, y: 170, w: 90, h: 70, kind: 'crate' },
      { x: 1060, y: 500, w: 90, h: 70, kind: 'crate' },
      { x: 420, y: 230, w: 70, h: 70, kind: 'plant' },
      { x: 790, y: 230, w: 70, h: 70, kind: 'plant' },
      { x: 605, y: 560, w: 70, h: 70, kind: 'statue' },
    ],
    guards: [
      { waypoints: [{ x: 380, y: 160 }, { x: 900, y: 160 }], pause: 0.6 },
      { waypoints: [{ x: 900, y: 560 }, { x: 380, y: 560 }], pause: 0.6 },
      { waypoints: [{ x: 640, y: 480 }, { x: 640, y: 120 }], pause: 0.8 },
      { waypoints: [{ x: 150, y: 340 }, { x: 1130, y: 340 }], pause: 0.8 },
    ],
    cameras: [
      { x: 640, y: 78, baseAngle: Math.PI / 2, sweep: 1.2 },
      { x: 60, y: 200, baseAngle: 0, sweep: 1.0 },
      { x: 60, y: 560, baseAngle: 0, sweep: 1.0 },
      { x: 1220, y: 380, baseAngle: Math.PI, sweep: 1.0 },
    ],
    loot: [
      { x: 180, y: 330, label: 'GOLD BAR', value: 250 },
      { x: 1100, y: 330, label: 'RUBY', value: 250 },
    ],
  },
];
