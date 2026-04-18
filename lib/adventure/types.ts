export type AdventureBeat = "approach" | "wave" | "mile" | "boss" | "done";

export type AdventureStory =
  | { kind: "intro"; page: number }
  | { kind: "playing" }
  | { kind: "victory"; page: number }
  | { kind: "gameover" };

export interface AdventureEnemy {
  id: string;
  worldX: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  speed: number;
  kind: "runner" | "fragment" | "boss";
  tint: string;
  /** Prevents multi-tick damage from the same attack swing. */
  lastDamageFromSwingAt: number;
  lastTouchDamageToPlayerAt: number;
}

export interface AdventureState {
  story: AdventureStory;
  cameraX: number;
  beat: AdventureBeat;
  waveRemaining: number;
  waveSpawnAt: number;
  mileSpawnAt: number;
  fragmentSpawnCount: number;
  bossSpawned: boolean;
  bannerText: string;
  bannerUntil: number;
  /** Objective line under the HUD. */
  objectiveLine: string;
}
