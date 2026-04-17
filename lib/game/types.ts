export interface Vector2 {
  x: number;
  y: number;
}

export interface FighterInput {
  left: string;
  right: string;
  jump: string;
  attack: string;
}

export interface SpriteClipSheet {
  kind: "sheet";
  src: string;
  frameCount: number;
  frameHold: number;
}

export interface SpriteClipSequence {
  kind: "sequence";
  srcList: string[];
  frameHold: number;
}

export interface SpriteClipAtlas {
  kind: "atlas";
  imageSrc: string;
  atlasSrc: string;
  frameKeys: string[];
  frameHold: number;
}

export type SpriteClip = SpriteClipSheet | SpriteClipSequence | SpriteClipAtlas;

export interface FighterSpriteSet {
  idle: SpriteClip;
  move: SpriteClip;
  attack: SpriteClip;
  hit: SpriteClip;
}

export interface FighterState {
  id: "p1" | "p2";
  name: string;
  displayName: string;
  color: string;
  position: Vector2;
  velocity: Vector2;
  width: number;
  height: number;
  renderWidth: number;
  renderHeight: number;
  renderOffsetX: number;
  renderOffsetY: number;
  speed: number;
  jumpForce: number;
  health: number;
  facing: 1 | -1;
  isGrounded: boolean;
  isAttacking: boolean;
  attackStartedAt: number;
  attackCooldownUntil: number;
  attackDurationMs: number;
  attackDamage: number;
  attackRange: number;
  hitFlashUntil: number;
  roundWins: number;
  currentAnimation: "idle" | "move" | "attack" | "hit";
  controls: FighterInput;
  sprites: FighterSpriteSet;
  visualScale: number;
  reverseSpriteFacing: boolean;
}

export interface CharacterDefinition {
  id: string;
  label: string;
  color: string;
  sprites: FighterSpriteSet;
  renderWidth?: number;
  renderHeight?: number;
  renderOffsetX?: number;
  renderOffsetY?: number;
  visualScale?: number;
  reverseSpriteFacing?: boolean;
}

export interface MatchState {
  fighters: [FighterState, FighterState];
  winnerId: FighterState["id"] | null;
  roundEndReason: "ko" | "time" | null;
  isRoundOver: boolean;
  roundStartAt: number;
  roundNumber: number;
  roundsToWin: number;
  koAt: number | null;
}
