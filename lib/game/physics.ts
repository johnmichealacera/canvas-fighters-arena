import { GAME_CONFIG } from "./constants";
import { FighterState } from "./types";

interface ArenaBounds {
  width: number;
  height: number;
}

export function applyPhysics(fighter: FighterState, arena: ArenaBounds): void {
  const floorY = arena.height - GAME_CONFIG.floorPadding;

  fighter.velocity.y = Math.min(
    fighter.velocity.y + GAME_CONFIG.gravity,
    GAME_CONFIG.maxFallSpeed,
  );

  fighter.position.x += fighter.velocity.x;
  fighter.position.y += fighter.velocity.y;

  if (fighter.position.x < 0) fighter.position.x = 0;
  if (fighter.position.x + fighter.width > arena.width) {
    fighter.position.x = arena.width - fighter.width;
  }

  if (fighter.position.y + fighter.height >= floorY) {
    fighter.position.y = floorY - fighter.height;
    fighter.velocity.y = 0;
    fighter.isGrounded = true;
  } else {
    fighter.isGrounded = false;
  }
}
