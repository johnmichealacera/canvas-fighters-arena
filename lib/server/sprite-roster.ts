import { promises as fs } from "fs";
import path from "path";
import { CharacterDefinition, FighterSpriteSet, SpriteClip } from "../game/types";

const SPRITES_ROOT = path.join(process.cwd(), "public", "sprites");
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

const PRESET_SHEET_COUNTS: Record<string, Partial<Record<keyof FighterSpriteSet, number>>> = {
  "martial-hero": { idle: 10, move: 8, attack: 6, hit: 4 },
  "medieval-king": { idle: 8, move: 8, attack: 4, hit: 4 },
  "yakuza-enemy": { idle: 6, move: 8, attack: 6, hit: 3 },
};

function toLabel(folderName: string): string {
  return folderName
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function normalizeName(fileName: string): string {
  return fileName.toLowerCase().replace(/\.(png|jpg|jpeg|webp)$/i, "");
}

function isImageFile(fileName: string): boolean {
  if (fileName.includes(":")) return false;
  const ext = path.extname(fileName).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

function isAtlasFile(fileName: string): boolean {
  return normalizeName(fileName) === "atlas";
}

function animationBucketFromName(name: string): keyof FighterSpriteSet {
  if (/run|walk|move/.test(name)) return "move";
  if (/attack|chop|slash|punch|kick/.test(name)) return "attack";
  if (/hit|hurt|stagger|damage/.test(name)) return "hit";
  return "idle";
}

function clipFromFrames(framePaths: string[], frameHold: number): SpriteClip {
  return { kind: "sequence", srcList: framePaths, frameHold };
}

function clipFromSheet(sheetPath: string, frameCount: number, frameHold: number): SpriteClip {
  return { kind: "sheet", src: sheetPath, frameCount, frameHold };
}

async function tryAtlasCharacter(folderPath: string, folderName: string): Promise<CharacterDefinition | null> {
  const atlasPng = path.join(folderPath, "atlas.png");
  const atlasJson = path.join(folderPath, "atlas.json");

  try {
    await fs.access(atlasPng);
    await fs.access(atlasJson);
  } catch {
    return null;
  }

  const raw = await fs.readFile(atlasJson, "utf-8");
  const parsed = JSON.parse(raw) as
    | { frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }> }
    | { frames: Array<{ filename: string; frame: { x: number; y: number; w: number; h: number } }> };

  const frameKeys = Array.isArray(parsed.frames)
    ? parsed.frames.map((entry) => entry.filename)
    : Object.keys(parsed.frames);

  const grouped: Record<keyof FighterSpriteSet, string[]> = {
    idle: [],
    move: [],
    attack: [],
    hit: [],
  };

  for (const key of frameKeys) {
    const bucket = animationBucketFromName(key.toLowerCase());
    grouped[bucket].push(key);
  }

  const idleFrames = grouped.idle.length > 0 ? grouped.idle : frameKeys.slice(0, 1);
  const moveFrames = grouped.move.length > 0 ? grouped.move : idleFrames;
  const attackFrames = grouped.attack.length > 0 ? grouped.attack : moveFrames;
  const hitFrames = grouped.hit.length > 0 ? grouped.hit : idleFrames;

  const imageSrc = `/sprites/${folderName}/atlas.png`;
  const atlasSrc = `/sprites/${folderName}/atlas.json`;

  return {
    id: folderName.toLowerCase(),
    label: toLabel(folderName),
    color: "#60a5fa",
    sprites: {
      idle: { kind: "atlas", imageSrc, atlasSrc, frameKeys: idleFrames, frameHold: 6 },
      move: { kind: "atlas", imageSrc, atlasSrc, frameKeys: moveFrames, frameHold: 5 },
      attack: { kind: "atlas", imageSrc, atlasSrc, frameKeys: attackFrames, frameHold: 4 },
      hit: { kind: "atlas", imageSrc, atlasSrc, frameKeys: hitFrames, frameHold: 7 },
    },
  };
}

function sortByNumericSuffix(a: string, b: string): number {
  const getNumber = (value: string): number => {
    const match = value.match(/(\d+)(?!.*\d)/);
    return match ? Number(match[1]) : 0;
  };
  return getNumber(a) - getNumber(b);
}

export async function buildCharacterRoster(): Promise<CharacterDefinition[]> {
  const entries = await fs.readdir(SPRITES_ROOT, { withFileTypes: true });
  const characters: CharacterDefinition[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const folderName = entry.name;
    const folderPath = path.join(SPRITES_ROOT, folderName);

    const atlasCharacter = await tryAtlasCharacter(folderPath, folderName);
    if (atlasCharacter) {
      characters.push(atlasCharacter);
      continue;
    }

    const files = await fs.readdir(folderPath);
    const imageFiles = files.filter(isImageFile).filter((file) => !isAtlasFile(file));
    if (imageFiles.length === 0) continue;

    const grouped: Record<keyof FighterSpriteSet, string[]> = {
      idle: [],
      move: [],
      attack: [],
      hit: [],
    };

    for (const file of imageFiles) {
      const normalized = normalizeName(file);
      const bucket = animationBucketFromName(normalized);
      grouped[bucket].push(file);
    }

    const toSequencePaths = (filesForClip: string[]): string[] =>
      filesForClip
        .sort(sortByNumericSuffix)
        .map((file) => `/sprites/${folderName}/${file}`);

    const chooseFiles = (bucket: keyof FighterSpriteSet, fallback: string[]): string[] => {
      const values = grouped[bucket];
      return values.length > 0 ? values : fallback;
    };

    const idleFiles = chooseFiles("idle", [imageFiles[0]]);
    const moveFiles = chooseFiles("move", idleFiles);
    const attackFiles = chooseFiles("attack", moveFiles);
    const hitFiles = chooseFiles("hit", idleFiles);

    const presets = PRESET_SHEET_COUNTS[folderName.toLowerCase()];
    const makeClip = (
      filesForClip: string[],
      bucket: keyof FighterSpriteSet,
      frameHold: number,
    ): SpriteClip => {
      if (filesForClip.length > 1) {
        return clipFromFrames(toSequencePaths(filesForClip), frameHold);
      }

      const singleSrc = `/sprites/${folderName}/${filesForClip[0]}`;
      const frameCount = presets?.[bucket] ?? 1;
      if (frameCount > 1) return clipFromSheet(singleSrc, frameCount, frameHold);
      return clipFromFrames([singleSrc], frameHold);
    };

    characters.push({
      id: folderName.toLowerCase().replace(/\s+/g, "-"),
      label: toLabel(folderName),
      color: "#60a5fa",
      sprites: {
        idle: makeClip(idleFiles, "idle", 7),
        move: makeClip(moveFiles, "move", 5),
        attack: makeClip(attackFiles, "attack", 4),
        hit: makeClip(hitFiles, "hit", 7),
      },
    });
  }

  return characters;
}
