import { CharacterDefinition, FighterSpriteSet, SpriteClip } from "./types";

export interface LoadedSprites {
  [src: string]: HTMLImageElement;
}

export interface AtlasFrameRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LoadedAtlas {
  imageSrc: string;
  frames: Record<string, AtlasFrameRect>;
}

export interface LoadedSpriteAssets {
  images: LoadedSprites;
  atlases: Record<string, LoadedAtlas>;
}

function sheet(src: string, frameCount: number, frameHold: number): SpriteClip {
  return { kind: "sheet", src, frameCount, frameHold };
}

function sequence(srcList: string[], frameHold: number): SpriteClip {
  return { kind: "sequence", srcList, frameHold };
}

function sequenceRange(
  prefix: string,
  count: number,
  frameHold: number,
  suffix = ".png",
): SpriteClip {
  const srcList = Array.from({ length: count }, (_, index) => `${prefix}${index + 1}${suffix}`);
  return sequence(srcList, frameHold);
}

function atlas(
  imageSrc: string,
  atlasSrc: string,
  frameKeys: string[],
  frameHold: number,
): SpriteClip {
  return { kind: "atlas", imageSrc, atlasSrc, frameKeys, frameHold };
}

function fallbackSet(base: FighterSpriteSet): FighterSpriteSet {
  return {
    idle: base.idle,
    move: base.move,
    attack: base.attack,
    hit: base.hit,
  };
}

export const CHARACTER_ROSTER: CharacterDefinition[] = [
  {
    id: "martial-hero",
    label: "Martial Hero",
    color: "#00d4ff",
    renderWidth: 800,
    renderHeight: 880,
    renderOffsetY: 380,
    sprites: fallbackSet({
      idle: sheet("/sprites/martial-hero/Idle.png", 8, 4),
      move: sheet("/sprites/martial-hero/Run.png", 8, 5),
      attack: sheet("/sprites/martial-hero/Attack1.png", 6, 1),
      hit: sheet("/sprites/martial-hero/Take Hit.png", 4, 1),
    }),
  },
  {
    id: "medieval-king",
    label: "Medieval King",
    color: "#f97316",
    renderWidth: 580,
    renderHeight: 480,
    renderOffsetY: 60,
    sprites: fallbackSet({
      idle: sheet("/sprites/medieval-king/Idle.png", 8, 5),
      move: sheet("/sprites/medieval-king/Run.png", 8, 5),
      attack: sheet("/sprites/medieval-king/Attack1.png", 4, 1),
      hit: sheet("/sprites/medieval-king/Take Hit.png", 4, 1),
    }),
  },
  {
    id: "fantasy-warrior",
    label: "Fantasy Warrior",
    color: "#fb7185",
    renderWidth: 780,
    renderHeight: 800,
    renderOffsetY: 340,
    sprites: fallbackSet({
      idle: sheet("/sprites/fantasy-warrior/Idle.png", 10, 6),
      move: sheet("/sprites/fantasy-warrior/Run.png", 8, 5),
      attack: sheet("/sprites/fantasy-warrior/Attack1.png", 7, 1),
      hit: sheet("/sprites/fantasy-warrior/Take hit.png", 3, 1),
    }),
  },
  {
    id: "medieval-warrior",
    label: "Medieval Warrior",
    color: "#f59e0b",
    renderWidth: 440,
    renderHeight: 400,
    renderOffsetY: 90,
    sprites: fallbackSet({
      // This pack lacks explicit idle/hit names, so we map closest available sheets.
      idle: sheet("/sprites/medieval-warrior/Run2.png", 8, 5),
      move: sheet("/sprites/medieval-warrior/Run2.png", 8, 5),
      attack: sheet("/sprites/medieval-warrior/Attack3.png", 4, 1),
      hit: sheet("/sprites/medieval-warrior/Slide.png", 2, 1),
    }),
  },
  {
    id: "wonderwoman",
    label: "Wonder Woman",
    color: "#ff3d7f",
    renderWidth: 400,
    renderHeight: 300,
    renderOffsetY: 50,
    sprites: fallbackSet({
      idle: sequence(
        [
          "/sprites/wonderwoman/WW-idle1.png",
          "/sprites/wonderwoman/WW-idle2.png",
          "/sprites/wonderwoman/WW-idle3.png",
          "/sprites/wonderwoman/WW-idle4.png",
          "/sprites/wonderwoman/WW-idle5.png",
          "/sprites/wonderwoman/WW-idle6.png",
          "/sprites/wonderwoman/WW-idle7.png",
          "/sprites/wonderwoman/WW-idle8.png",
          "/sprites/wonderwoman/WW-idle9.png",
          "/sprites/wonderwoman/WW-idle10.png",
          "/sprites/wonderwoman/WW-idle11.png",
          "/sprites/wonderwoman/WW-idle12.png",
          "/sprites/wonderwoman/WW-idle13.png",
          "/sprites/wonderwoman/WW-idle14.png",
          "/sprites/wonderwoman/WW-idle15.png",
          "/sprites/wonderwoman/WW-idle16.png",
        ],
        5,
      ),
      move: sequence(
        [
          "/sprites/wonderwoman/WW-run1.png",
          "/sprites/wonderwoman/WW-run2.png",
          "/sprites/wonderwoman/WW-run3.png",
          "/sprites/wonderwoman/WW-run4.png",
          "/sprites/wonderwoman/WW-run5.png",
          "/sprites/wonderwoman/WW-run6.png",
          "/sprites/wonderwoman/WW-run7.png",
          "/sprites/wonderwoman/WW-run8.png",
        ],
        4,
      ),
      attack: sequence(["/sprites/wonderwoman/WW-run8.png"], 10),
      hit: sequence(["/sprites/wonderwoman/WW-idle1.png"], 10),
    }),
  },
  // {
  //   id: "yakuza-enemy",
  //   label: "Yakuza Enemy",
  //   color: "#d946ef",
  //   sprites: fallbackSet({
  //     idle: sheet("/sprites/yakuza-enemy/idle.png", 6, 6),
  //     move: sheet("/sprites/yakuza-enemy/run.png", 8, 4),
  //     attack: sheet("/sprites/yakuza-enemy/chop.png", 6, 4),
  //     hit: sheet("/sprites/yakuza-enemy/stagger.png", 3, 8),
  //   }),
  // },
  {
    id: "knight",
    label: "Knight",
    color: "#84cc16",
    renderWidth: 520,
    renderHeight: 560,
    renderOffsetY: 200,
    sprites: fallbackSet({
      idle: sheet("/sprites/knight/IDLE.png", 7, 4),
      move: sheet("/sprites/knight/RUN.png", 8, 5),
      attack: sheet("/sprites/knight/ATTACK 1.png", 6, 1),
      hit: sheet("/sprites/knight/HURT.png", 4, 1),
    }),
  },
  {
    id: "samurai",
    label: "Samurai",
    color: "#22c55e",
    renderWidth: 540,
    renderHeight: 630,
    renderOffsetY: 140,
    sprites: fallbackSet({
      idle: sheet("/sprites/samurai/IDLE.png", 10, 6),
      move: sheet("/sprites/samurai/RUN.png", 16, 5),
      attack: sheet("/sprites/samurai/ATTACK 1.png", 7, 1),
      hit: sheet("/sprites/samurai/HURT.png", 4, 1),
    }),
  },
  {
    id: "warrior",
    label: "Warrior",
    color: "#facc15",
    renderWidth: 300,
    renderHeight: 310,
    renderOffsetY: 60,
    sprites: fallbackSet({
      idle: sequenceRange("/sprites/warrior/idle/Warrior_Idle_", 6, 5),
      move: sequenceRange("/sprites/warrior/Run/Warrior_Run_", 8, 5),
      attack: sequenceRange("/sprites/warrior/Attack/Warrior_Attack_", 12, 1),
      hit: sequenceRange("/sprites/warrior/HurtnoEffect/Warrior_hurt_", 4, 1),
    }),
  },
  {
    id: "bringer-of-death",
    label: "Bringer Of Death",
    color: "#a78bfa",
    renderWidth: 460,
    renderHeight: 350,
    renderOffsetY: 40,
    reverseSpriteFacing: true,
    sprites: fallbackSet({
      idle: sequenceRange(
        "/sprites/bringer-of-death/Idle/Bringer-of-Death_Idle_",
        8,
        6,
      ),
      move: sequenceRange(
        "/sprites/bringer-of-death/Walk/Bringer-of-Death_Walk_",
        8,
        1,
      ),
      attack: sequenceRange(
        "/sprites/bringer-of-death/Attack/Bringer-of-Death_Attack_",
        10,
        1,
      ),
      hit: sequenceRange(
        "/sprites/bringer-of-death/Hurt/Bringer-of-Death_Hurt_",
        3,
        1,
      ),
    }),
  },
];

export async function fetchCharacterRoster(): Promise<CharacterDefinition[]> {
  const response = await fetch("/api/sprites/roster");
  if (!response.ok) {
    return CHARACTER_ROSTER;
  }

  const data = (await response.json()) as { roster?: CharacterDefinition[] };
  if (!data.roster || data.roster.length < 2) {
    return CHARACTER_ROSTER;
  }

  return data.roster;
}

interface TexturePackerLikeFrame {
  frame: AtlasFrameRect;
}

interface AtlasJsonWithObjectFrames {
  frames: Record<string, TexturePackerLikeFrame>;
}

interface AtlasJsonWithArrayFrames {
  frames: Array<{ filename: string; frame: AtlasFrameRect }>;
}

type AtlasJson = AtlasJsonWithObjectFrames | AtlasJsonWithArrayFrames;

function isObjectFramesAtlas(data: AtlasJson): data is AtlasJsonWithObjectFrames {
  return !Array.isArray(data.frames);
}

function normalizeAtlasFrames(data: AtlasJson): Record<string, AtlasFrameRect> {
  if (isObjectFramesAtlas(data)) {
    const result: Record<string, AtlasFrameRect> = {};
    for (const [key, value] of Object.entries(data.frames)) {
      result[key] = value.frame;
    }
    return result;
  }

  const result: Record<string, AtlasFrameRect> = {};
  for (const frame of data.frames) {
    result[frame.filename] = frame.frame;
  }
  return result;
}

export async function preloadSprites(spriteSet: FighterSpriteSet[]): Promise<LoadedSpriteAssets> {
  const allSources = new Set<string>();
  const atlasSources = new Set<string>();
  const atlasImageToJson = new Map<string, string>();
  for (const set of spriteSet) {
    const clips = [set.idle, set.move, set.attack, set.hit];
    for (const clip of clips) {
      if (clip.kind === "sheet") {
        allSources.add(clip.src);
      } else if (clip.kind === "sequence") {
        for (const src of clip.srcList) allSources.add(src);
      } else {
        allSources.add(clip.imageSrc);
        atlasSources.add(clip.atlasSrc);
        atlasImageToJson.set(clip.imageSrc, clip.atlasSrc);
      }
    }
  }

  const imageResults = await Promise.allSettled(
    Array.from(allSources).map(
      (src) =>
        new Promise<[string, HTMLImageElement]>((resolve, reject) => {
          const image = new Image();
          image.src = src;
          image.onload = () => resolve([src, image]);
          image.onerror = () => reject(new Error(`Failed to load sprite: ${src}`));
        }),
    ),
  );

  const entries = imageResults
    .filter((result): result is PromiseFulfilledResult<[string, HTMLImageElement]> => result.status === "fulfilled")
    .map((result) => result.value);

  const atlasResults = await Promise.allSettled(
    Array.from(atlasSources).map(async (atlasSrc) => {
      const response = await fetch(atlasSrc);
      if (!response.ok) {
        throw new Error(`Failed to load atlas: ${atlasSrc}`);
      }
      const data = (await response.json()) as AtlasJson;
      return [atlasSrc, normalizeAtlasFrames(data)] as const;
    }),
  );

  const atlasEntries = atlasResults
    .filter(
      (
        result,
      ): result is PromiseFulfilledResult<readonly [string, Record<string, AtlasFrameRect>]> =>
        result.status === "fulfilled",
    )
    .map((result) => result.value);

  const atlasBySource = Object.fromEntries(atlasEntries);
  const images = Object.fromEntries(entries);

  const atlasesByImage: Record<string, LoadedAtlas> = {};
  for (const [imageSrc, atlasSrc] of atlasImageToJson.entries()) {
    const frames = atlasBySource[atlasSrc];
    if (!frames) continue;
    atlasesByImage[imageSrc] = { imageSrc, frames };
  }

  return { images, atlases: atlasesByImage };
}

export const exampleAtlasCharacter: CharacterDefinition = {
  id: "atlas-example",
  label: "Atlas Example",
  color: "#22d3ee",
  sprites: {
    idle: atlas(
      "/sprites/atlas-fighter/atlas.png",
      "/sprites/atlas-fighter/atlas.json",
      ["idle_0.png", "idle_1.png", "idle_2.png", "idle_3.png"],
      6,
    ),
    move: atlas(
      "/sprites/atlas-fighter/atlas.png",
      "/sprites/atlas-fighter/atlas.json",
      ["run_0.png", "run_1.png", "run_2.png", "run_3.png", "run_4.png"],
      4,
    ),
    attack: atlas(
      "/sprites/atlas-fighter/atlas.png",
      "/sprites/atlas-fighter/atlas.json",
      ["attack_0.png", "attack_1.png", "attack_2.png", "attack_3.png"],
      4,
    ),
    hit: atlas(
      "/sprites/atlas-fighter/atlas.png",
      "/sprites/atlas-fighter/atlas.json",
      ["hurt_0.png", "hurt_1.png"],
      8,
    ),
  },
};
