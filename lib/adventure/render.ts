import { ADVENTURE_CITY_LAYERS } from "./city-background";
import { ADVENTURE_WORLD_WIDTH } from "./constants";
import type { AdventureEnemy, AdventureState } from "./types";
import type { LoadedBackgrounds } from "../game/background";
import { GAME_CONFIG } from "../game/constants";
import { drawFighterWorldInstance } from "../game/renderer";
import type { LoadedSpriteAssets } from "../game/sprites";
import type { FighterState } from "../game/types";
import { ADVENTURE_TITLE, GAME_OVER_LINE, INTRO_PAGES, VICTORY_PAGES } from "./story";

function drawCityParallax(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cameraX: number,
  backgrounds: LoadedBackgrounds | null,
): void {
  const base = ctx.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, "#0b1220");
  base.addColorStop(1, "#020617");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  if (!backgrounds) return;

  for (const layer of ADVENTURE_CITY_LAYERS) {
    const image = backgrounds[layer.src];
    if (!image) continue;

    const imageWidth = (image.width / image.height) * height;
    const scrollX = -((cameraX * layer.speed) % imageWidth);

    ctx.save();
    ctx.globalAlpha = layer.alpha;
    ctx.drawImage(image, scrollX, layer.yOffset, imageWidth, height);
    ctx.drawImage(image, scrollX + imageWidth, layer.yOffset, imageWidth, height);
    ctx.restore();
  }
}

function drawGroundWorld(
  ctx: CanvasRenderingContext2D,
  floorY: number,
  worldWidth: number,
): void {
  const grad = ctx.createLinearGradient(0, floorY - 6, 0, floorY + 120);
  grad.addColorStop(0, "#1e293b");
  grad.addColorStop(1, "#020617");
  ctx.fillStyle = grad;
  ctx.fillRect(0, floorY - 4, worldWidth, 200);

  ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.lineTo(worldWidth, floorY);
  ctx.stroke();
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: AdventureEnemy, now: number): void {
  if (enemy.hp <= 0) return;

  const pulse = 0.65 + Math.sin(now / 220 + enemy.worldX * 0.01) * 0.12;
  ctx.save();
  ctx.shadowColor = enemy.tint;
  ctx.shadowBlur = enemy.kind === "boss" ? 28 : 16;
  ctx.fillStyle = enemy.kind === "boss" ? "rgba(244,114,182,0.45)" : "rgba(15,23,42,0.92)";
  const r = enemy.kind === "boss" ? 18 : 10;
  ctx.beginPath();
  ctx.roundRect(enemy.worldX, enemy.y, enemy.width, enemy.height, r);
  ctx.fill();

  ctx.strokeStyle = enemy.tint;
  ctx.globalAlpha = pulse;
  ctx.lineWidth = enemy.kind === "boss" ? 3 : 2;
  ctx.stroke();
  ctx.globalAlpha = 1;

  const barW = enemy.width * 0.92;
  const barH = 6;
  const bx = enemy.worldX + (enemy.width - barW) / 2;
  const by = enemy.y - 12;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
  ctx.fillStyle = "#334155";
  ctx.fillRect(bx, by, barW, barH);
  ctx.fillStyle = enemy.tint;
  ctx.fillRect(bx, by, barW * (enemy.hp / enemy.maxHp), barH);
  ctx.restore();
}

function wrapFillText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  for (let i = 0; i < lines.length; i += 1) {
    ctx.fillText(lines[i], x, y + i * lineHeight);
  }
  return lines.length * lineHeight;
}

export function renderAdventureFrame(options: {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  cameraX: number;
  meta: AdventureState;
  player: FighterState;
  enemies: AdventureEnemy[];
  spriteAssets: LoadedSpriteAssets | null;
  backgrounds: LoadedBackgrounds | null;
  now: number;
}): void {
  const { ctx, canvasWidth, canvasHeight, cameraX, meta, player, enemies, spriteAssets, backgrounds, now } =
    options;
  const floorY = canvasHeight - GAME_CONFIG.floorPadding;

  drawCityParallax(ctx, canvasWidth, canvasHeight, cameraX, backgrounds);

  ctx.save();
  ctx.translate(-Math.floor(cameraX), 0);

  drawGroundWorld(ctx, floorY, ADVENTURE_WORLD_WIDTH);

  const orderedEnemies = [...enemies].filter((e) => e.hp > 0).sort((a, b) => a.worldX - b.worldX);
  for (const enemy of orderedEnemies) {
    drawEnemy(ctx, enemy, now);
  }

  drawFighterWorldInstance(ctx, player, now, spriteAssets);
  ctx.restore();

  drawHud(ctx, canvasWidth, player, meta, now);

  if (meta.story.kind === "intro") {
    drawStoryPanel(ctx, canvasWidth, canvasHeight, ADVENTURE_TITLE, INTRO_PAGES[meta.story.page], "Space / Enter — continue");
  } else if (meta.story.kind === "victory") {
    drawStoryPanel(ctx, canvasWidth, canvasHeight, "Weave restored", VICTORY_PAGES[meta.story.page], "Space / Enter — continue");
  } else if (meta.story.kind === "gameover") {
    drawStoryPanel(ctx, canvasWidth, canvasHeight, "Fallen ronin", GAME_OVER_LINE, "Return to menu and try again.");
  }

  if (meta.bannerUntil > now && meta.bannerText && meta.story.kind === "playing") {
    drawBanner(ctx, canvasWidth, meta.bannerText, now);
  }
}

function drawHud(
  ctx: CanvasRenderingContext2D,
  width: number,
  player: FighterState,
  meta: AdventureState,
  now: number,
): void {
  ctx.save();
  ctx.fillStyle = "rgba(15,23,42,0.82)";
  ctx.fillRect(16, 16, Math.min(420, width - 32), meta.objectiveLine ? 108 : 78);

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "700 18px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(ADVENTURE_TITLE, 32, 44);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 13px ui-sans-serif, system-ui, sans-serif";
  if (meta.objectiveLine) {
    wrapFillText(ctx, meta.objectiveLine, 32, 64, width - 80, 18);
  }

  const barW = Math.min(360, width - 64);
  const barH = 10;
  const bx = 32;
  const by = meta.objectiveLine ? 92 : 62;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
  ctx.fillStyle = "#334155";
  ctx.fillRect(bx, by, barW, barH);
  ctx.fillStyle = player.hitFlashUntil > now ? "#fca5a5" : "#4ade80";
  ctx.fillRect(bx, by, barW * (player.health / 100), barH);

  ctx.fillStyle = "#64748b";
  ctx.font = "600 11px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("A / D move   ·   W jump   ·   F strike", 32, by + 26);
  ctx.restore();
}

function drawStoryPanel(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  title: string,
  body: string,
  footer: string,
): void {
  ctx.save();
  ctx.fillStyle = "rgba(2,6,23,0.78)";
  ctx.fillRect(0, 0, width, height);

  const panelW = Math.min(720, width - 48);
  const panelX = (width - panelW) / 2;
  const panelY = height * 0.18;
  const panelH = height * 0.55;

  ctx.fillStyle = "rgba(15,23,42,0.95)";
  ctx.strokeStyle = "rgba(56,189,248,0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelW, panelH, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f8fafc";
  ctx.font = "700 26px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, width / 2, panelY + 52);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "500 17px ui-sans-serif, system-ui, sans-serif";
  const bodyX = panelX + 36;
  const bodyY = panelY + 96;
  ctx.textAlign = "left";
  wrapFillText(ctx, body, bodyX, bodyY, panelW - 72, 26);

  ctx.fillStyle = "#38bdf8";
  ctx.font = "600 14px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(footer, width / 2, panelY + panelH - 36);

  ctx.textAlign = "start";
  ctx.restore();
}

function drawBanner(ctx: CanvasRenderingContext2D, width: number, text: string, now: number): void {
  const t = Math.max(0, Math.min(1, Math.sin(now / 400) * 0.08 + 0.92));
  ctx.save();
  ctx.globalAlpha = t;
  ctx.fillStyle = "rgba(15,23,42,0.88)";
  const bw = Math.min(760, width - 40);
  const bx = (width - bw) / 2;
  const by = 120;
  const bh = 72;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 14);
  ctx.fill();
  ctx.strokeStyle = "rgba(167,139,250,0.6)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#f1f5f9";
  ctx.font = "600 16px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  wrapFillText(ctx, text, width / 2, by + 30, bw - 32, 22);
  ctx.textAlign = "start";
  ctx.restore();
}
