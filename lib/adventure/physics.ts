import { GAME_CONFIG } from "../game/constants";
import type { FighterState } from "../game/types";

export function applyAdventurePhysics(
  fighter: FighterState,
  floorY: number,
  worldWidth: number,
): void {
  fighter.velocity.y = Math.min(
    fighter.velocity.y + GAME_CONFIG.gravity,
    GAME_CONFIG.maxFallSpeed,
  );

  fighter.position.x += fighter.velocity.x;
  fighter.position.y += fighter.velocity.y;

  if (fighter.position.x < 0) fighter.position.x = 0;
  if (fighter.position.x + fighter.width > worldWidth) {
    fighter.position.x = worldWidth - fighter.width;
  }

  if (fighter.position.y + fighter.height >= floorY) {
    fighter.position.y = floorY - fighter.height;
    fighter.velocity.y = 0;
    fighter.isGrounded = true;
  } else {
    fighter.isGrounded = false;
  }
}
