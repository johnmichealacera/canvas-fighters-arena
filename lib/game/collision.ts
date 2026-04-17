import { GAME_CONFIG } from "./constants";
import { FighterState } from "./types";

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function intersects(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function getBodyRect(fighter: FighterState): Rect {
  return {
    x: fighter.position.x,
    y: fighter.position.y,
    width: fighter.width,
    height: fighter.height,
  };
}

function getAttackRect(attacker: FighterState): Rect {
  const offsetX = attacker.facing === 1 ? attacker.width : -attacker.attackRange;
  return {
    x: attacker.position.x + offsetX,
    y: attacker.position.y + attacker.height * 0.35,
    width: attacker.attackRange,
    height: attacker.height * 0.4,
  };
}

export function isAttackActive(fighter: FighterState, now: number): boolean {
  const elapsed = now - fighter.attackStartedAt;
  if (elapsed > fighter.attackDurationMs) {
    fighter.isAttacking = false;
    return false;
  }

  return elapsed >= 40 && elapsed <= fighter.attackDurationMs - 20;
}

export function resolveCombat(
  attacker: FighterState,
  defender: FighterState,
  now: number,
): boolean {
  if (!isAttackActive(attacker, now)) return false;
  if (attacker.attackStartedAt === 0) return false;
  if (attacker.attackStartedAt + 90 < now) return false;

  const hit = intersects(getAttackRect(attacker), getBodyRect(defender));
  if (!hit) return false;

  defender.health = Math.max(0, defender.health - attacker.attackDamage);
  defender.hitFlashUntil = now + GAME_CONFIG.hitFlashDurationMs;
  // Add small hit reaction so damage feels impactful.
  defender.velocity.x = attacker.facing * 4.5;
  defender.velocity.y = Math.min(defender.velocity.y, -2.2);
  attacker.attackStartedAt = -9999;
  return true;
}
