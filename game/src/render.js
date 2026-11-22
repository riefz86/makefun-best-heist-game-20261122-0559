// Midnight Vault — everything drawn on the canvas.
// Floor, walls, cover, loot, exit, thief, guards and cameras with their
// vision cones, the HUD (alarm meter, loot, tools, timer) and the screens
// (title, pause, caught, level clear, getaway). Safe cover, danger and loot
// each read at a glance: gold is loot, yellow cones are guards, red is cameras.
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, HUD_HEIGHT, COLORS,
  GUARD_VIEW_RANGE, GUARD_VIEW_HALF_ANGLE,
  CAMERA_VIEW_RANGE, CAMERA_VIEW_HALF_ANGLE,
} from './config.js';

function drawVisionCone(ctx, x, y, angle, range, halfAngle, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle - halfAngle) * range, y + Math.sin(angle - halfAngle) * range);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle + halfAngle) * range, y + Math.sin(angle + halfAngle) * range);
  ctx.stroke();
}

function drawMarbleFloor(ctx, time) {
  const tile = 64;
  for (let row = 0; row * tile < CANVAS_HEIGHT; row++) {
    for (let col = 0; col * tile < CANVAS_WIDTH; col++) {
      const even = (row + col) % 2 === 0;
      ctx.fillStyle = even ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(col * tile, row * tile, tile, tile);
    }
  }
  ctx.strokeStyle = COLORS.floorLine;
  ctx.lineWidth = 1;
  for (let x = 0; x <= CANVAS_WIDTH; x += tile) {
    ctx.beginPath(); ctx.moveTo(x, HUD_HEIGHT); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
  }
  for (let y = HUD_HEIGHT; y <= CANVAS_HEIGHT; y += tile) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
  }
  // Faint moonlight pools drifting across the floor.
  const glow = ctx.createRadialGradient(420, 300, 10, 420, 300, 260);
  glow.addColorStop(0, 'rgba(150, 170, 255, 0.06)');
  glow.addColorStop(1, 'rgba(150, 170, 255, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, HUD_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT - HUD_HEIGHT);
  void time;
}

function drawWall(ctx, wall) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
  ctx.fillStyle = COLORS.wallTop;
  ctx.fillRect(wall.x, wall.y, wall.w, 5);
  ctx.strokeStyle = '#0a0d1d';
  ctx.lineWidth = 2;
  ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
}

function drawCover(ctx, cover, time) {
  if (cover.kind === 'crate') {
    ctx.fillStyle = COLORS.coverCrate;
    ctx.fillRect(cover.x, cover.y, cover.w, cover.h);
    ctx.fillStyle = COLORS.coverCrateTop;
    ctx.fillRect(cover.x, cover.y, cover.w, 8);
    ctx.strokeStyle = '#3d2c15';
    ctx.lineWidth = 2;
    ctx.strokeRect(cover.x + 2, cover.y + 2, cover.w - 4, cover.h - 4);
    ctx.beginPath();
    ctx.moveTo(cover.x, cover.y); ctx.lineTo(cover.x + cover.w, cover.y + cover.h);
    ctx.moveTo(cover.x + cover.w, cover.y); ctx.lineTo(cover.x, cover.y + cover.h);
    ctx.stroke();
  } else if (cover.kind === 'statue') {
    ctx.fillStyle = '#4a5468';
    ctx.beginPath();
    ctx.ellipse(cover.x + cover.w / 2, cover.y + cover.h - 8, cover.w / 2, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.coverStatue;
    ctx.beginPath();
    ctx.arc(cover.x + cover.w / 2, cover.y + cover.h / 2 - 6, cover.w / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cover.x + cover.w / 2 - 5, cover.y + cover.h / 2 - 2, 10, cover.h / 2 - 8);
    ctx.fillStyle = '#aeb9d4';
    ctx.beginPath();
    ctx.arc(cover.x + cover.w / 2 - 6, cover.y + cover.h / 2 - 12, 3, 0, Math.PI * 2);
    ctx.arc(cover.x + cover.w / 2 + 6, cover.y + cover.h / 2 - 12, 3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Potted plant: dark pot, bright leaves that sway a little.
    const sway = Math.sin(time * 1.4 + cover.x) * 3;
    ctx.fillStyle = '#7a3b2e';
    ctx.fillRect(cover.x + 8, cover.y + cover.h - 26, cover.w - 16, 26);
    ctx.fillStyle = COLORS.coverPlant;
    for (let i = 0; i < 5; i++) {
      const lx = cover.x + cover.w / 2 + (i - 2) * 12 + sway * (i % 2 ? 1 : -1);
      ctx.beginPath();
      ctx.ellipse(lx, cover.y + 22 + (i % 2) * 8, 13, 22, (i - 2) * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = COLORS.coverPlantLeaf;
    ctx.beginPath();
    ctx.ellipse(cover.x + cover.w / 2 + sway, cover.y + 18, 12, 20, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLootGem(ctx, x, y, label, time, big) {
  const size = big ? 16 : 11;
  const pulse = 1 + Math.sin(time * 3 + x) * 0.12;
  const glow = ctx.createRadialGradient(x, y, 2, x, y, size * 3);
  glow.addColorStop(0, COLORS.lootGlow);
  glow.addColorStop(1, 'rgba(255, 217, 77, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(x, y, size * 3, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = COLORS.loot;
  ctx.fillRect(-size / 2, -size / 2, size, size);
  ctx.fillStyle = '#fff3b0';
  ctx.fillRect(-size / 4, -size / 4, size / 2, size / 2);
  ctx.restore();
  ctx.fillStyle = COLORS.loot;
  ctx.font = `bold ${big ? 13 : 11}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(label, x, y + size + 20);
}

function drawExit(ctx, exit, time) {
  const open = exit.open;
  ctx.fillStyle = open ? COLORS.exit : COLORS.exitLocked;
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  ctx.strokeStyle = open ? '#0d5c34' : '#2c3944';
  ctx.lineWidth = 3;
  ctx.strokeRect(exit.x, exit.y, exit.w, exit.h);
  ctx.fillStyle = '#0b1a12';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  const label = open ? 'ESCAPE!' : 'LOCKED';
  ctx.fillText(label, exit.x + exit.w / 2, exit.y + exit.h / 2 - 6);
  ctx.font = '10px monospace';
  ctx.fillText(exit.label, exit.x + exit.w / 2, exit.y + exit.h / 2 + 12);
  if (open) {
    const pulse = 0.5 + Math.sin(time * 4) * 0.3;
    ctx.strokeStyle = `rgba(57, 217, 138, ${pulse})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(exit.x - 6, exit.y - 6, exit.w + 12, exit.h + 12);
  }
}

function drawThief(ctx, thief, time) {
  const bob = Math.sin(time * 10) * (thief.moving ? 1.5 : 0);
  ctx.save();
  ctx.translate(thief.x, thief.y + bob * 0.3);
  // Shadow.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath(); ctx.ellipse(0, 10, 15, 6, 0, 0, Math.PI * 2); ctx.fill();
  // Hooded body.
  ctx.fillStyle = COLORS.thiefDark;
  ctx.beginPath(); ctx.arc(0, 0, THIEF_RADIUS, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COLORS.thief;
  ctx.beginPath(); ctx.arc(0, -2, 11, 0, Math.PI * 2); ctx.fill();
  // Hood point and eyes facing the move direction.
  const fa = thief.faceAngle ?? -Math.PI / 2;
  ctx.fillStyle = COLORS.thiefDark;
  ctx.beginPath();
  ctx.moveTo(Math.cos(fa) * 13, Math.sin(fa) * 13);
  ctx.lineTo(Math.cos(fa + 2.6) * 9, Math.sin(fa + 2.6) * 9);
  ctx.lineTo(Math.cos(fa - 2.6) * 9, Math.sin(fa - 2.6) * 9);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#10131f';
  ctx.beginPath();
  ctx.arc(Math.cos(fa - 0.4) * 5 - Math.sin(fa) * 3, Math.sin(fa - 0.4) * 5 + Math.cos(fa) * 3, 1.8, 0, Math.PI * 2);
  ctx.arc(Math.cos(fa - 0.4) * 5 + Math.sin(fa) * 3, Math.sin(fa - 0.4) * 5 - Math.cos(fa) * 3, 1.8, 0, Math.PI * 2);
  ctx.fill();
  if (thief.sneaking) {
    ctx.strokeStyle = 'rgba(232, 193, 90, 0.8)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(0, 0, 19, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawGuard(ctx, guard, time) {
  ctx.save();
  ctx.translate(guard.x, guard.y);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath(); ctx.ellipse(0, 11, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COLORS.guardDark;
  ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COLORS.guard;
  ctx.beginPath(); ctx.arc(0, -2, 12, 0, Math.PI * 2); ctx.fill();
  // Cap brim in the facing direction.
  ctx.fillStyle = '#2b0d0d';
  ctx.beginPath();
  ctx.arc(Math.cos(guard.angle) * 6, Math.sin(guard.angle) * 6, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(Math.cos(guard.angle - 0.35) * 4, Math.sin(guard.angle - 0.35) * 4, 1.6, 0, Math.PI * 2);
  ctx.arc(Math.cos(guard.angle + 0.35) * 4, Math.sin(guard.angle + 0.35) * 4, 1.6, 0, Math.PI * 2);
  ctx.fill();
  if (guard.state === 'chase') {
    ctx.fillStyle = '#ff4040';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('!', 0, -24 + Math.sin(time * 8) * 2);
  } else if (guard.state === 'investigate') {
    ctx.fillStyle = '#ffd65a';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('?', 0, -24);
  }
  ctx.restore();
}

function drawCamera(ctx, camera) {
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.fillStyle = '#39415f';
  ctx.fillRect(-4, -4, 8, 8);
  ctx.rotate(camera.angle);
  ctx.fillStyle = camera.disabledTimer > 0 ? '#5a6b7a' : '#c8cede';
  ctx.fillRect(0, -5, 18, 10);
  ctx.fillStyle = camera.disabledTimer > 0 ? '#333' : '#ff4040';
  ctx.beginPath(); ctx.arc(18, 0, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  if (camera.disabledTimer > 0) {
    ctx.fillStyle = '#9aa3c7';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`OFF ${Math.ceil(camera.disabledTimer)}s`, camera.x, camera.y - 16);
  }
}

function drawHud(ctx, game) {
  ctx.fillStyle = '#0d1024';
  ctx.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);
  ctx.fillStyle = '#2e3760';
  ctx.fillRect(0, HUD_HEIGHT - 2, CANVAS_WIDTH, 2);

  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 17px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('MIDNIGHT VAULT', 16, 26);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '12px monospace';
  ctx.fillText(game.world.def.name, 16, 46);

  // Alarm meter.
  const meterX = 300;
  const meterW = 320;
  ctx.fillStyle = COLORS.textDim;
  ctx.font = 'bold 12px monospace';
  ctx.fillText('ALARM', meterX, 22);
  ctx.fillStyle = '#1a1f3a';
  ctx.fillRect(meterX, 30, meterW, 16);
  const ratio = game.alarm / 100;
  const alarmColor = ratio < 0.35 ? COLORS.alarmLow : ratio < 0.7 ? COLORS.alarmMid : COLORS.alarmHigh;
  ctx.fillStyle = alarmColor;
  ctx.fillRect(meterX, 30, meterW * ratio, 16);
  ctx.strokeStyle = '#3b4370';
  ctx.lineWidth = 1;
  ctx.strokeRect(meterX, 30, meterW, 16);
  if (game.alarm >= 30) {
    ctx.fillStyle = alarmColor;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(game.alarm >= 100 ? 'CAUGHT!' : 'SPOTTED!', meterX + meterW + 10, 44);
  }

  // Score, loot, tools, timer.
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${game.score}`, 700, 26);
  ctx.fillStyle = COLORS.loot;
  ctx.fillText(`LOOT ${game.lootTaken}/${game.lootTotal}`, 700, 46);
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`COINS ${game.coins}  [Q]`, 880, 26);
  ctx.fillText(`EMP ${game.emp}  [SPACE]`, 880, 46);
  ctx.fillStyle = COLORS.textDim;
  const mins = Math.floor(game.timeSeconds / 60);
  const secs = Math.floor(game.timeSeconds % 60);
  ctx.fillText(`TIME ${mins}:${String(secs).padStart(2, '0')}`, 1080, 26);
  ctx.fillText(`ROOM ${game.levelIndex + 1}/3`, 1080, 46);
}

function drawBanner(ctx, text, subtext, color) {
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(0, 250, CANVAS_WIDTH, 130);
  ctx.fillStyle = color;
  ctx.font = 'bold 44px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, CANVAS_WIDTH / 2, 305);
  if (subtext) {
    ctx.fillStyle = COLORS.text;
    ctx.font = '16px monospace';
    ctx.fillText(subtext, CANVAS_WIDTH / 2, 345);
  }
}

function drawTitle(ctx, game) {
  ctx.fillStyle = 'rgba(8, 10, 24, 0.72)';
  ctx.fillRect(0, HUD_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT - HUD_HEIGHT);
  ctx.fillStyle = COLORS.loot;
  ctx.font = 'bold 56px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('MIDNIGHT VAULT', CANVAS_WIDTH / 2, 220);
  ctx.fillStyle = COLORS.text;
  ctx.font = '18px monospace';
  ctx.fillText('A three-room heist. Steal the loot, dodge the cones, reach the getaway.', CANVAS_WIDTH / 2, 260);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '15px monospace';
  const lines = [
    'WASD / Arrows — move      SHIFT — sneak (slower, harder to spot)',
    'E — grab loot      Q or CLICK — toss a coin to distract a guard',
    'SPACE — EMP: shut the cameras down for 7 seconds (1 per room)',
    'R — restart room      P — pause      M — mute',
    '',
    'Guards sweep yellow cones. Cameras sweep red cones. When the ALARM',
    'meter fills, you are caught. Grab the main loot to unlock the exit.',
  ];
  lines.forEach((line, i) => ctx.fillText(line, CANVAS_WIDTH / 2, 310 + i * 24));
  ctx.fillStyle = COLORS.exit;
  ctx.font = 'bold 20px monospace';
  const blink = Math.sin(game.time * 3) > -0.2;
  if (blink) ctx.fillText('Press ENTER to start the heist', CANVAS_WIDTH / 2, 500);
}

function drawOverlay(ctx, game) {
  if (game.screen === 'title') drawTitle(ctx, game);
  else if (game.screen === 'paused') {
    drawBanner(ctx, 'PAUSED', 'Press P to keep sneaking', COLORS.textDim);
  } else if (game.screen === 'caught') {
    drawBanner(ctx, 'CAUGHT!', 'The alarm hit 100. Press R to retry the room.', COLORS.alarmHigh);
  } else if (game.screen === 'levelComplete') {
    drawBanner(ctx, 'ROOM CLEARED!', `${game.world.def.mainLoot.label} secured. Press ENTER for the next room.`, COLORS.exit);
  } else if (game.screen === 'win') {
    ctx.fillStyle = 'rgba(8, 10, 24, 0.78)';
    ctx.fillRect(0, HUD_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT - HUD_HEIGHT);
    ctx.fillStyle = COLORS.loot;
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CLEAN GETAWAY!', CANVAS_WIDTH / 2, 280);
    ctx.fillStyle = COLORS.text;
    ctx.font = '20px monospace';
    ctx.fillText(`All three rooms cleared — final score ${game.score}`, CANVAS_WIDTH / 2, 330);
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '15px monospace';
    ctx.fillText('The Moonstone, the Sun Diamond and the Crown Jewels are yours.', CANVAS_WIDTH / 2, 365);
    ctx.fillStyle = COLORS.exit;
    ctx.font = 'bold 18px monospace';
    ctx.fillText('Press R to run it again', CANVAS_WIDTH / 2, 420);
  }
}

export function render(ctx, game) {
  const { world } = game;
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawMarbleFloor(ctx, game.time);

  // Vision cones first, so walls and cover occlude them.
  for (const guard of game.guards) {
    drawVisionCone(ctx, guard.x, guard.y, guard.angle, GUARD_VIEW_RANGE,
      GUARD_VIEW_HALF_ANGLE, COLORS.coneGuard, COLORS.coneGuardEdge);
  }
  for (const camera of game.cameras) {
    if (camera.disabledTimer <= 0) {
      drawVisionCone(ctx, camera.x, camera.y, camera.angle, CAMERA_VIEW_RANGE,
        CAMERA_VIEW_HALF_ANGLE, COLORS.coneCamera, COLORS.coneCameraEdge);
    }
  }

  for (const wall of world.walls) drawWall(ctx, wall);
  for (const cover of world.cover) drawCover(ctx, cover, game.time);

  // Exit, loot, coins.
  drawExit(ctx, world.exit, game.time);
  if (!world.mainLoot.taken) {
    drawLootGem(ctx, world.mainLoot.x, world.mainLoot.y, world.mainLoot.label, game.time, true);
  }
  for (const gem of world.loot) {
    if (!gem.taken) drawLootGem(ctx, gem.x, gem.y, gem.label, game.time, false);
  }
  for (const coin of world.coins) {
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath(); ctx.arc(coin.x, coin.y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255, 217, 77, 0.7)';
    ctx.beginPath(); ctx.arc(coin.x, coin.y, 12 + Math.sin(game.time * 6) * 2, 0, Math.PI * 2); ctx.stroke();
  }

  for (const camera of game.cameras) drawCamera(ctx, camera);
  for (const guard of game.guards) drawGuard(ctx, guard, game.time);
  drawThief(ctx, game.thief, game.time);

  drawHud(ctx, game);

  // Fair-warning banner while anyone is spotting the thief.
  if (game.screen === 'playing' && game.anySpotted && game.alarm < 100) {
    ctx.fillStyle = '#ff4040';
    ctx.font = 'bold 26px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('! SPOTTED — BREAK LINE OF SIGHT !', CANVAS_WIDTH / 2, 110);
  }

  drawOverlay(ctx, game);
}
