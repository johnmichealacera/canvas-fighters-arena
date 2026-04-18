import type { SoundPlayer } from "../game/audio";
import { isAttackActive } from "../game/collision";
import { GAME_CONFIG } from "../game/constants";
import { createFighter, resolveAnimation, tryStartAttack } from "../game/fighter";
import type { CharacterDefinition, FighterState } from "../game/types";
import { ADVENTURE_WORLD_WIDTH, BOSS_TRANSITION_X, FRAGMENT_ZONE_START, PLAZA_THRESHOLD, WAVE_COUNT } from "./constants";
import { createBoss, createFragment, createRunner } from "./enemies";
import { INTRO_PAGES, VICTORY_PAGES } from "./story";
import type { AdventureEnemy, AdventureState } from "./types";
import { applyAdventurePhysics } from "./physics";

interface KeyState {
  pressed: Set<string>;
}

function isPressed(keys: KeyState, code: string): boolean {
  return keys.pressed.has(code);
}

function intersects(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function getAttackHitbox(fighter: FighterState): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const offsetX = fighter.facing === 1 ? fighter.width : -fighter.attackRange;
  return {
    x: fighter.position.x + offsetX,
    y: fighter.position.y + fighter.height * 0.35,
    width: fighter.attackRange,
    height: fighter.height * 0.42,
  };
}

export function createAdventurePlayerFromSamurai(samurai: CharacterDefinition, startX: number): FighterState {
  return createFighter({
    id: "p1",
    name: "Ronin",
    displayName: "Samurai",
    x: startX,
    color: samurai.color,
    facing: 1,
    controls: { left: "KeyA", right: "KeyD", jump: "KeyW", attack: "KeyF" },
    sprites: samurai.sprites,
    renderWidth: samurai.renderWidth,
    renderHeight: samurai.renderHeight,
    renderOffsetY: samurai.renderOffsetY,
    visualScale: samurai.visualScale ?? 1,
    reverseSpriteFacing: samurai.reverseSpriteFacing,
  });
}

export function createInitialAdventureMeta(): AdventureState {
  return {
    story: { kind: "intro", page: 0 },
    cameraX: 0,
    beat: "approach",
    waveRemaining: 0,
    waveSpawnAt: 0,
    mileSpawnAt: 0,
    fragmentSpawnCount: 0,
    bossSpawned: false,
    bannerText: "",
    bannerUntil: 0,
    objectiveLine: "",
  };
}

function setBanner(meta: AdventureState, text: string, now: number, durationMs = 5200): void {
  meta.bannerText = text;
  meta.bannerUntil = now + durationMs;
}

function advanceStoryIntro(meta: AdventureState): void {
  if (meta.story.kind !== "intro") return;
  const last = INTRO_PAGES.length - 1;
  if (meta.story.page < last) {
    meta.story = { kind: "intro", page: meta.story.page + 1 };
  } else {
    meta.story = { kind: "playing" };
    meta.objectiveLine = "Reach Echo Plaza — follow the violet glow along the rooftops.";
  }
}

function advanceStoryVictory(meta: AdventureState): void {
  if (meta.story.kind !== "victory") return;
  const last = VICTORY_PAGES.length - 1;
  if (meta.story.page < last) {
    meta.story = { kind: "victory", page: meta.story.page + 1 };
  }
}

export function handleAdventureKeyDown(
  meta: AdventureState,
  event: KeyboardEvent,
  player: FighterState,
  now: number,
  sounds: SoundPlayer,
): void {
  if (meta.story.kind === "intro") {
    if (event.code === "Space" || event.code === "Enter") {
      advanceStoryIntro(meta);
    }
    return;
  }
  if (meta.story.kind === "victory") {
    if (event.code === "Space" || event.code === "Enter") {
      advanceStoryVictory(meta);
    }
    return;
  }
  if (meta.story.kind === "gameover") {
    return;
  }

  if (event.code === player.controls.attack) {
    const prev = player.isAttacking;
    tryStartAttack(player, now);
    if (!prev && player.isAttacking) sounds.playAttack();
  }
}

function updatePlayerMovement(player: FighterState, keys: KeyState): void {
  player.velocity.x = 0;
  if (isPressed(keys, player.controls.left)) {
    player.velocity.x = -player.speed;
    player.facing = -1;
  }
  if (isPressed(keys, player.controls.right)) {
    player.velocity.x = player.speed;
    player.facing = 1;
  }
  if (isPressed(keys, player.controls.jump) && player.isGrounded) {
    player.velocity.y = -player.jumpForce;
    player.isGrounded = false;
  }
}

function resolvePlayerHitsEnemies(
  player: FighterState,
  enemies: AdventureEnemy[],
  now: number,
  sounds: SoundPlayer,
): void {
  if (!isAttackActive(player, now)) return;
  const box = getAttackHitbox(player);
  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    if (enemy.lastDamageFromSwingAt === player.attackStartedAt) continue;
    const hit = intersects(box.x, box.y, box.width, box.height, enemy.worldX, enemy.y, enemy.width, enemy.height);
    if (!hit) continue;
    const dmg = enemy.kind === "boss" ? 9 : enemy.kind === "runner" ? 11 : 8;
    enemy.hp = Math.max(0, enemy.hp - dmg);
    enemy.lastDamageFromSwingAt = player.attackStartedAt;
    sounds.playHit();
  }
}

function resolveEnemyTouchesPlayer(
  player: FighterState,
  enemies: AdventureEnemy[],
  now: number,
  sounds: SoundPlayer,
): void {
  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    const bodyHit = intersects(
      player.position.x,
      player.position.y,
      player.width,
      player.height,
      enemy.worldX,
      enemy.y,
      enemy.width,
      enemy.height,
    );
    if (!bodyHit) continue;
    if (now - enemy.lastTouchDamageToPlayerAt < 820) continue;
    enemy.lastTouchDamageToPlayerAt = now;
    const dmg = enemy.kind === "boss" ? 15 : enemy.kind === "runner" ? 10 : 7;
    player.health = Math.max(0, player.health - dmg);
    player.hitFlashUntil = now + GAME_CONFIG.hitFlashDurationMs;
    player.velocity.x = (player.position.x < enemy.worldX ? -1 : 1) * 5;
    sounds.playHit();
  }
}

function moveEnemies(enemies: AdventureEnemy[], player: FighterState): void {
  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    const dir = player.position.x + player.width / 2 < enemy.worldX + enemy.width / 2 ? -1 : 1;
    enemy.worldX += dir * enemy.speed;
  }
}

function cullDead(enemies: AdventureEnemy[]): void {
  for (const e of enemies) {
    if (e.hp <= 0) {
      e.worldX = -99999;
    }
  }
}

function updateBeatProgression(
  meta: AdventureState,
  player: FighterState,
  enemies: AdventureEnemy[],
  now: number,
  floorY: number,
): void {
  const px = player.position.x;
  const alive = enemies.filter((e) => e.hp > 0);

  if (meta.beat === "approach" && px >= PLAZA_THRESHOLD) {
    meta.beat = "wave";
    meta.waveRemaining = WAVE_COUNT;
    meta.waveSpawnAt = now + 400;
    setBanner(
      meta,
      "Echo Plaza: the Weave thins here. Shade Runners coalesce from the static — cut them down!",
      now,
    );
    meta.objectiveLine = `Clear the plaza (${WAVE_COUNT} Shade Runners).`;
  }

  if (meta.beat === "wave") {
    if (alive.length === 0 && meta.waveRemaining <= 0) {
      meta.beat = "mile";
      meta.mileSpawnAt = now + 1200;
      meta.fragmentSpawnCount = 0;
      setBanner(meta, "Neon Mile: corrupted fragments chase the Weave's echo. Keep moving east.", now);
      meta.objectiveLine = "Run the Neon Mile — reach the anchor spire past the overpass.";
    } else if (alive.length === 0 && meta.waveRemaining > 0 && now >= meta.waveSpawnAt) {
      const spawnX = Math.min(px + 520 + Math.random() * 180, ADVENTURE_WORLD_WIDTH - 120);
      enemies.push(createRunner(spawnX, floorY));
      meta.waveRemaining -= 1;
      meta.waveSpawnAt = now + 1100;
    }
  }

  if (meta.beat === "mile" && px >= FRAGMENT_ZONE_START) {
    if (now >= meta.mileSpawnAt && meta.fragmentSpawnCount < 6) {
      const spawnX = Math.min(px + 400 + Math.random() * 260, ADVENTURE_WORLD_WIDTH - 100);
      enemies.push(createFragment(spawnX, floorY));
      meta.fragmentSpawnCount += 1;
      meta.mileSpawnAt = now + 1900;
    }
  }

  if (meta.beat === "mile" && px >= BOSS_TRANSITION_X) {
    meta.beat = "boss";
    meta.objectiveLine = "Sever the Weave Node — the heart of the corruption.";
  }

  if (meta.beat === "boss" && !meta.bossSpawned) {
    meta.bossSpawned = true;
    const bx = Math.min(px + 480, ADVENTURE_WORLD_WIDTH - 240);
    enemies.push(createBoss(bx, floorY));
    setBanner(meta, "The Weave Node manifests. It is slow, vast, and hungry — do not trade blows carelessly.", now, 6500);
  }

  const boss = enemies.find((e) => e.kind === "boss" && e.hp > 0);
  if (meta.beat === "boss" && meta.bossSpawned && !boss) {
    meta.beat = "done";
    meta.story = { kind: "victory", page: 0 };
    meta.objectiveLine = "";
  }
}

export interface AdventureStepResult {
  meta: AdventureState;
  player: FighterState;
  enemies: AdventureEnemy[];
  cameraX: number;
}

export function stepAdventure(options: {
  meta: AdventureState;
  player: FighterState;
  enemies: AdventureEnemy[];
  keys: KeyState;
  now: number;
  canvasWidth: number;
  canvasHeight: number;
  sounds: SoundPlayer;
}): AdventureStepResult {
  const { meta, player, enemies, keys, now, canvasWidth, canvasHeight, sounds } = options;
  const floorY = canvasHeight - GAME_CONFIG.floorPadding;

  if (meta.story.kind === "intro" || meta.story.kind === "victory" || meta.story.kind === "gameover") {
    player.velocity.x = 0;
    player.velocity.y = 0;
    player.position.y = floorY - player.height;
    player.isGrounded = true;
    player.currentAnimation = meta.story.kind === "gameover" ? "hit" : "idle";
    const anchor = canvasWidth * 0.32;
    const cameraX = Math.max(
      0,
      Math.min(player.position.x - anchor, Math.max(0, ADVENTURE_WORLD_WIDTH - canvasWidth)),
    );
    meta.cameraX = cameraX;
    return { meta, player, enemies, cameraX };
  }

  updatePlayerMovement(player, keys);
  applyAdventurePhysics(player, floorY, ADVENTURE_WORLD_WIDTH);

  moveEnemies(enemies, player);
  resolvePlayerHitsEnemies(player, enemies, now, sounds);
  resolveEnemyTouchesPlayer(player, enemies, now, sounds);
  cullDead(enemies);

  void isAttackActive(player, now);
  player.currentAnimation = resolveAnimation(player, now);

  updateBeatProgression(meta, player, enemies, now, floorY);

  if (player.health <= 0) {
    meta.story = { kind: "gameover" };
    player.health = 0;
  }

  const anchor = canvasWidth * 0.32;
  const cameraX = Math.max(
    0,
    Math.min(player.position.x - anchor, Math.max(0, ADVENTURE_WORLD_WIDTH - canvasWidth)),
  );
  meta.cameraX = cameraX;

  return { meta, player, enemies, cameraX };
}
