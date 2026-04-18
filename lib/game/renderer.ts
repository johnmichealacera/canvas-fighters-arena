import { BACKGROUND_LAYERS, LoadedBackgrounds } from "./background";
import { GAME_CONFIG } from "./constants";
import { LoadedSpriteAssets } from "./sprites";
import { CharacterDefinition, FighterState, MatchState, SpriteClip } from "./types";

interface RenderFrameOptions {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  match: MatchState;
  spriteAssets: LoadedSpriteAssets | null;
  backgrounds: LoadedBackgrounds | null;
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  now: number,
  backgrounds: LoadedBackgrounds | null,
): void {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#141e30");
  sky.addColorStop(1, "#0a0f1b");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  if (backgrounds) {
    for (const layer of BACKGROUND_LAYERS) {
      const image = backgrounds[layer.src];
      if (!image) continue;

      const imageWidth = (image.width / image.height) * height;
      const scrollX = -((now * layer.speed) % imageWidth);

      ctx.save();
      ctx.globalAlpha = layer.alpha;
      ctx.drawImage(image, scrollX, layer.yOffset, imageWidth, height);
      ctx.drawImage(image, scrollX + imageWidth, layer.yOffset, imageWidth, height);
      ctx.restore();
    }
  }

  // Keep background artwork visible across full canvas height.
}

function getClipForAnimation(fighter: FighterState): SpriteClip {
  switch (fighter.currentAnimation) {
    case "move":
      return fighter.sprites.move;
    case "attack":
      return fighter.sprites.attack;
    case "hit":
      return fighter.sprites.hit;
    default:
      return fighter.sprites.idle;
  }
}

function getClipFrame(
  clip: SpriteClip,
  now: number,
  spriteAssets: LoadedSpriteAssets,
): { image: HTMLImageElement; sourceX: number; sourceY: number; sourceWidth: number; sourceHeight: number } | null {
  if (clip.kind === "sheet") {
    const image = spriteAssets.images[clip.src];
    if (!image || clip.frameCount <= 0) return null;
    const frameWidth = image.width / clip.frameCount;
    const frameTick = Math.floor(now / (1000 / 60));
    const frameIndex = Math.floor(frameTick / clip.frameHold) % clip.frameCount;
    return {
      image,
      sourceX: frameWidth * frameIndex,
      sourceY: 0,
      sourceWidth: frameWidth,
      sourceHeight: image.height,
    };
  }

  const frameTick = Math.floor(now / (1000 / 60));
  if (clip.kind === "sequence") {
    const frameIndex = Math.floor(frameTick / clip.frameHold) % clip.srcList.length;
    const image = spriteAssets.images[clip.srcList[frameIndex]];
    if (!image) return null;
    return { image, sourceX: 0, sourceY: 0, sourceWidth: image.width, sourceHeight: image.height };
  }

  const atlas = spriteAssets.atlases[clip.imageSrc];
  const image = spriteAssets.images[clip.imageSrc];
  if (!atlas || !image || clip.frameKeys.length === 0) return null;
  const frameIndex = Math.floor(frameTick / clip.frameHold) % clip.frameKeys.length;
  const frameKey = clip.frameKeys[frameIndex];
  const rect = atlas.frames[frameKey];
  if (!rect) return null;
  return {
    image,
    sourceX: rect.x,
    sourceY: rect.y,
    sourceWidth: rect.w,
    sourceHeight: rect.h,
  };
}

function drawFighterFallback(ctx: CanvasRenderingContext2D, fighter: FighterState, now: number): void {
  const renderWidth = fighter.renderWidth * fighter.visualScale;
  const renderHeight = fighter.renderHeight * fighter.visualScale;
  const renderX = fighter.position.x + (fighter.width - renderWidth) / 2 + fighter.renderOffsetX;
  const renderY = fighter.position.y + (fighter.height - renderHeight) + fighter.renderOffsetY;
  const color = fighter.hitFlashUntil > now ? "#ff4d4d" : fighter.color;
  const bobOffset =
    fighter.currentAnimation === "idle"
      ? Math.sin(now / 130) * 2
      : fighter.currentAnimation === "move"
        ? Math.sin(now / 70) * 3
        : 0;

  ctx.fillStyle = color;
  ctx.fillRect(
    renderX,
    renderY + bobOffset,
    renderWidth,
    renderHeight - bobOffset,
  );

  if (fighter.currentAnimation === "attack") {
    const armX =
      fighter.facing === 1
        ? renderX + renderWidth
        : fighter.position.x - fighter.attackRange;
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(
      armX,
      renderY + renderHeight * 0.4,
      fighter.attackRange,
      renderHeight * 0.18,
    );
  }
}

function drawFighterWithSprite(
  ctx: CanvasRenderingContext2D,
  fighter: FighterState,
  now: number,
  spriteAssets: LoadedSpriteAssets,
): void {
  const clip = getClipForAnimation(fighter);
  const frame = getClipFrame(clip, now, spriteAssets);
  if (!frame) {
    drawFighterFallback(ctx, fighter, now);
    return;
  }

  ctx.save();
  // Soft glow + stronger contrast to keep fighters readable.
  ctx.shadowColor = "rgba(255,255,255,0.3)";
  ctx.shadowBlur = 18;
  if (fighter.hitFlashUntil > now) {
    ctx.filter = "brightness(1.35) saturate(1.7) contrast(1.1)";
  } else {
    ctx.filter = "brightness(1.12) saturate(1.18) contrast(1.06)";
  }
  const renderWidth = fighter.renderWidth * fighter.visualScale;
  const renderHeight = fighter.renderHeight * fighter.visualScale;
  const renderX = fighter.position.x + (fighter.width - renderWidth) / 2 + fighter.renderOffsetX;
  const renderY = fighter.position.y + (fighter.height - renderHeight) + fighter.renderOffsetY;
  const shouldMirror = fighter.reverseSpriteFacing ? fighter.facing === 1 : fighter.facing === -1;

  if (shouldMirror) {
    ctx.translate(renderX + renderWidth, renderY);
    ctx.scale(-1, 1);
    ctx.drawImage(
      frame.image,
      frame.sourceX,
      frame.sourceY,
      frame.sourceWidth,
      frame.sourceHeight,
      0,
      0,
      renderWidth,
      renderHeight,
    );
  } else {
    ctx.drawImage(
      frame.image,
      frame.sourceX,
      frame.sourceY,
      frame.sourceWidth,
      frame.sourceHeight,
      renderX,
      renderY,
      renderWidth,
      renderHeight,
    );
  }
  ctx.restore();
}

function drawDownedFighter(
  ctx: CanvasRenderingContext2D,
  fighter: FighterState,
  now: number,
  spriteAssets: LoadedSpriteAssets | null,
): void {
  const renderWidth = fighter.renderWidth * fighter.visualScale;
  const renderHeight = fighter.renderHeight * fighter.visualScale;
  const centerX = fighter.position.x + fighter.width / 2 + fighter.renderOffsetX;
  const floorY = fighter.position.y + fighter.height + fighter.renderOffsetY;

  ctx.save();
  ctx.translate(centerX, floorY - 8);
  ctx.rotate(fighter.facing === 1 ? Math.PI / 2 : -Math.PI / 2);
  ctx.globalAlpha = 0.9;

  if (spriteAssets) {
    const clip = fighter.sprites.hit;
    const frame = getClipFrame(clip, now, spriteAssets) ?? getClipFrame(fighter.sprites.idle, now, spriteAssets);
    if (frame) {
      ctx.drawImage(
        frame.image,
        frame.sourceX,
        frame.sourceY,
        frame.sourceWidth,
        frame.sourceHeight,
        -renderWidth / 2,
        -renderHeight,
        renderWidth,
        renderHeight,
      );
      ctx.restore();
      return;
    }
  }

  ctx.fillStyle = "rgba(130,130,130,0.95)";
  ctx.fillRect(-renderWidth / 2, -renderHeight, renderWidth, renderHeight);
  ctx.restore();
}

function drawHitImpact(ctx: CanvasRenderingContext2D, fighter: FighterState, now: number): void {
  const remaining = fighter.hitFlashUntil - now;
  if (remaining <= 0) return;

  const progress = remaining / 120;
  const radius = 12 + (1 - progress) * 20;
  const x = fighter.position.x + fighter.width / 2 + fighter.renderOffsetX + fighter.facing * 20;
  const y = fighter.position.y + fighter.renderHeight * fighter.visualScale * 0.42 + fighter.renderOffsetY;

  ctx.save();
  ctx.globalAlpha = Math.max(0.2, progress);
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawHealthBars(
  ctx: CanvasRenderingContext2D,
  fighters: [FighterState, FighterState],
  width: number,
): void {
  const [p1, p2] = fighters;
  const cardWidth = 360;
  const cardHeight = 74;
  const barWidth = 330;
  const barHeight = 14;
  const top = 16;
  const left = 16;
  const right = width - cardWidth - 16;

  function drawPlayerCard(
    fighter: FighterState,
    x: number,
    align: "left" | "right",
  ): void {
    const healthRatio = Math.max(0, Math.min(1, fighter.health / 100));
    const nameX = align === "left" ? x + 14 : x + cardWidth - 14;
    const barX = align === "left" ? x + 14 : x + cardWidth - 14 - barWidth;
    const fillWidth = Math.round(barWidth * healthRatio);

    ctx.save();
    ctx.fillStyle = "rgba(9,12,20,0.82)";
    ctx.strokeStyle = "rgba(148,163,184,0.28)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(x, top, cardWidth, cardHeight, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "600 16px sans-serif";
    ctx.textAlign = align;
    ctx.fillText(fighter.displayName, nameX, top + 24);

    ctx.fillStyle = "rgba(30,41,59,0.95)";
    ctx.beginPath();
    ctx.roundRect(barX, top + 36, barWidth, barHeight, 999);
    ctx.fill();

    const gradient = ctx.createLinearGradient(barX, top, barX + barWidth, top);
    gradient.addColorStop(0, "#22c55e");
    gradient.addColorStop(0.6, "#84cc16");
    gradient.addColorStop(1, "#eab308");
    ctx.fillStyle = gradient;
    if (align === "left") {
      ctx.beginPath();
      ctx.roundRect(barX, top + 36, fillWidth, barHeight, 999);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.roundRect(barX + (barWidth - fillWidth), top + 36, fillWidth, barHeight, 999);
      ctx.fill();
    }

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "600 13px sans-serif";
    ctx.fillText(`${fighter.health} HP`, nameX, top + 64);
    ctx.restore();
  }

  drawPlayerCard(p1, left, "left");
  drawPlayerCard(p2, right, "right");
}

function drawRoundInfo(
  ctx: CanvasRenderingContext2D,
  match: MatchState,
  width: number,
  now: number,
): void {
  const [p1, p2] = match.fighters;
  const elapsed = now - match.roundStartAt;
  const timeLeftMs = Math.max(0, GAME_CONFIG.roundDurationMs - elapsed);
  const seconds = Math.ceil(timeLeftMs / 1000);

  const panelWidth = 170;
  const panelHeight = 82;
  const panelX = width / 2 - panelWidth / 2;
  const panelY = 14;

  ctx.save();
  ctx.fillStyle = "rgba(10, 15, 28, 0.84)";
  ctx.strokeStyle = "rgba(148, 163, 184, 0.32)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#93c5fd";
  ctx.font = "600 12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`ROUND ${match.roundNumber}`, width / 2, panelY + 18);

  ctx.fillStyle = seconds <= 10 ? "#f87171" : "#f8fafc";
  ctx.font = "700 36px sans-serif";
  ctx.fillText(`${seconds}`, width / 2, panelY + 54);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "600 14px sans-serif";
  ctx.fillText(`${p1.roundWins}  -  ${p2.roundWins}`, width / 2, panelY + 74);
  ctx.textAlign = "start";
  ctx.restore();
}

function drawRoundEndOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  reason: MatchState["roundEndReason"],
): void {
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = reason === "time" ? "#facc15" : "#ff4d4d";
  ctx.font = "bold 88px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(reason === "time" ? "TIME UP" : "KO", width / 2, height / 2);
  ctx.textAlign = "start";
}

/** Draw a single fighter (sprites or fallback) for auxiliary canvases such as adventure mode. */
export function drawFighterWorldInstance(
  ctx: CanvasRenderingContext2D,
  fighter: FighterState,
  now: number,
  spriteAssets: LoadedSpriteAssets | null,
): void {
  if (!spriteAssets) {
    drawFighterFallback(ctx, fighter, now);
    return;
  }
  drawFighterWithSprite(ctx, fighter, now, spriteAssets);
}

export function renderFrame(options: RenderFrameOptions): void {
  const { ctx, canvasWidth, canvasHeight, match, spriteAssets, backgrounds } = options;
  const now = performance.now();
  drawBackground(ctx, canvasWidth, canvasHeight, now, backgrounds);
  drawHealthBars(ctx, match.fighters, canvasWidth);
  drawRoundInfo(ctx, match, canvasWidth, now);

  const downedFighterId = match.isRoundOver ? (match.winnerId === "p1" ? "p2" : "p1") : null;
  const standingFighters = downedFighterId
    ? match.fighters.filter((fighter) => fighter.id !== downedFighterId)
    : [...match.fighters];

  // Draw order: non-attacking first, then attacking on top.
  const orderedFighters = [...standingFighters].sort((a, b) => {
    if (a.isAttacking !== b.isAttacking) return a.isAttacking ? 1 : -1;
    return a.position.x - b.position.x;
  });

  if (spriteAssets) {
    for (const fighter of orderedFighters) {
      drawFighterWithSprite(ctx, fighter, now, spriteAssets);
    }
  } else {
    for (const fighter of orderedFighters) {
      drawFighterFallback(ctx, fighter, now);
    }
  }

  if (downedFighterId) {
    const downedFighter = match.fighters.find((fighter) => fighter.id === downedFighterId);
    if (downedFighter) {
      drawDownedFighter(ctx, downedFighter, now, spriteAssets);
    }
  }

  drawHitImpact(ctx, match.fighters[0], now);
  drawHitImpact(ctx, match.fighters[1], now);

  if (match.isRoundOver) {
    drawRoundEndOverlay(ctx, canvasWidth, canvasHeight, match.roundEndReason);
  }
}

interface RenderSelectScreenOptions {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  roster: CharacterDefinition[];
  p1Index: number;
  p2Index: number;
  p1Locked: boolean;
  p2Locked: boolean;
  spriteAssets: LoadedSpriteAssets | null;
}

export function renderCharacterSelect(options: RenderSelectScreenOptions): void {
  const {
    ctx,
    canvasWidth,
    canvasHeight,
    roster,
    p1Index,
    p2Index,
    p1Locked,
    p2Locked,
    spriteAssets,
  } = options;

  const now = performance.now();
  drawBackground(ctx, canvasWidth, canvasHeight, now, null);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 44px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Character Select", canvasWidth / 2, 90);
  ctx.font = "18px sans-serif";
  ctx.fillText("P1: A/D + F lock    |    P2: \u2190/\u2192 + L lock", canvasWidth / 2, 122);

  const startX = 80;
  const gap = 24;
  const cardWidth = 220;
  const cardHeight = 260;
  const columns = 5;
  const totalGridWidth = columns * cardWidth + (columns - 1) * gap;
  const centeredStartX = Math.max(24, (canvasWidth - totalGridWidth) / 2);
  const rows = Math.ceil(roster.length / columns);
  const totalHeight = rows * cardHeight + (rows - 1) * gap;
  const startY = Math.max(150, canvasHeight * 0.5 - totalHeight / 2);

  for (let i = 0; i < roster.length; i += 1) {
    const character = roster[i];
    const row = Math.floor(i / columns);
    const column = i % columns;
    const x = centeredStartX + column * (cardWidth + gap);
    const y = startY + row * (cardHeight + gap);
    const isP1 = p1Index === i;
    const isP2 = p2Index === i;

    ctx.fillStyle = "#111827";
    ctx.fillRect(x, y, cardWidth, cardHeight);
    ctx.strokeStyle = isP1 ? "#38bdf8" : isP2 ? "#fb7185" : "#374151";
    ctx.lineWidth = isP1 || isP2 ? 4 : 2;
    ctx.strokeRect(x, y, cardWidth, cardHeight);

    const previewClip = character.sprites.idle;
    const frame = spriteAssets ? getClipFrame(previewClip, now, spriteAssets) : null;
    const baseRenderWidth = character.renderWidth ?? 180;
    const baseRenderHeight = character.renderHeight ?? 260;
    const scale = character.visualScale ?? 1;
    const previewWidth = baseRenderWidth * scale * 0.62;
    const previewHeight = baseRenderHeight * scale * 0.62;
    const previewX =
      x + (cardWidth - previewWidth) / 2 + (character.renderOffsetX ?? 0) * 0.4;
    const previewY =
      y + 188 - previewHeight + (character.renderOffsetY ?? 0) * 0.4;
    if (frame) {
      ctx.drawImage(
        frame.image,
        frame.sourceX,
        frame.sourceY,
        frame.sourceWidth,
        frame.sourceHeight,
        previewX,
        previewY,
        previewWidth,
        previewHeight,
      );
    } else {
      ctx.fillStyle = character.color;
      ctx.fillRect(previewX, previewY, previewWidth, previewHeight);
    }

    ctx.fillStyle = "#fff";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(character.label, x + cardWidth / 2, y + 214);

    if (isP1) {
      ctx.fillStyle = p1Locked ? "#22c55e" : "#38bdf8";
      ctx.fillText(`P1 ${p1Locked ? "Locked" : "Selecting"}`, x + cardWidth / 2, y + 236);
    } else if (isP2) {
      ctx.fillStyle = p2Locked ? "#22c55e" : "#fb7185";
      ctx.fillText(`P2 ${p2Locked ? "Locked" : "Selecting"}`, x + cardWidth / 2, y + 236);
    }
  }

  ctx.textAlign = "start";
}
