import { GAME_CONFIG } from "./constants";
import { FighterState } from "./types";

interface CreateFighterOptions {
  id: FighterState["id"];
  name: string;
  displayName: string;
  x: number;
  color: string;
  facing: 1 | -1;
  controls: FighterState["controls"];
  sprites: FighterState["sprites"];
  renderWidth?: number;
  renderHeight?: number;
  renderOffsetX?: number;
  renderOffsetY?: number;
  visualScale?: number;
  reverseSpriteFacing?: boolean;
}

export function createFighter(options: CreateFighterOptions): FighterState {
  return {
    id: options.id,
    name: options.name,
    displayName: options.displayName,
    color: options.color,
    position: { x: options.x, y: 0 },
    velocity: { x: 0, y: 0 },
    width: 180,
    height: 260,
    renderWidth: options.renderWidth ?? 180,
    renderHeight: options.renderHeight ?? 260,
    renderOffsetX: options.renderOffsetX ?? 0,
    renderOffsetY: options.renderOffsetY ?? 0,
    speed: 6,
    jumpForce: 15,
    health: 100,
    facing: options.facing,
    isGrounded: false,
    isAttacking: false,
    attackStartedAt: 0,
    attackCooldownUntil: 0,
    attackDurationMs: 170,
    attackDamage: 10,
    attackRange: 95,
    hitFlashUntil: 0,
    roundWins: 0,
    currentAnimation: "idle",
    controls: options.controls,
    sprites: options.sprites,
    visualScale: options.visualScale ?? 1,
    reverseSpriteFacing: options.reverseSpriteFacing ?? false,
  };
}

export function resolveAnimation(fighter: FighterState, now: number): FighterState["currentAnimation"] {
  if (fighter.hitFlashUntil > now) return "hit";
  if (fighter.isAttacking) return "attack";
  if (Math.abs(fighter.velocity.x) > 0.1) return "move";
  return "idle";
}

export function tryStartAttack(fighter: FighterState, now: number): void {
  if (fighter.isAttacking) return;
  if (now < fighter.attackCooldownUntil) return;

  fighter.isAttacking = true;
  fighter.attackStartedAt = now;
  fighter.attackCooldownUntil = now + GAME_CONFIG.attackCooldownMs;
}
