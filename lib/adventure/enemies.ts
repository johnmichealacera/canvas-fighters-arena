import { ADVENTURE_WORLD_WIDTH } from "./constants";
import type { AdventureEnemy } from "./types";

let enemySeq = 0;

function nextId(prefix: string): string {
  enemySeq += 1;
  return `${prefix}-${enemySeq}`;
}

export function createRunner(spawnAheadX: number, floorY: number): AdventureEnemy {
  const height = 200;
  return {
    id: nextId("runner"),
    worldX: spawnAheadX,
    y: floorY - height,
    width: 100,
    height,
    hp: 32,
    maxHp: 32,
    speed: 2.4,
    kind: "runner",
    tint: "#a78bfa",
    lastDamageFromSwingAt: -1,
    lastTouchDamageToPlayerAt: 0,
  };
}

export function createFragment(spawnAheadX: number, floorY: number): AdventureEnemy {
  const height = 120;
  return {
    id: nextId("fragment"),
    worldX: spawnAheadX,
    y: floorY - height,
    width: 72,
    height,
    hp: 18,
    maxHp: 18,
    speed: 3.1,
    kind: "fragment",
    tint: "#38bdf8",
    lastDamageFromSwingAt: -1,
    lastTouchDamageToPlayerAt: 0,
  };
}

export function createBoss(anchorX: number, floorY: number): AdventureEnemy {
  const height = 320;
  return {
    id: nextId("boss"),
    worldX: Math.min(anchorX, ADVENTURE_WORLD_WIDTH - 280),
    y: floorY - height,
    width: 200,
    height,
    hp: 160,
    maxHp: 160,
    speed: 1.15,
    kind: "boss",
    tint: "#f472b6",
    lastDamageFromSwingAt: -1,
    lastTouchDamageToPlayerAt: 0,
  };
}
