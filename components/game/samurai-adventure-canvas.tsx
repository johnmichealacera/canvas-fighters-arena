"use client";

import { useEffect, useRef } from "react";
import { renderAdventureFrame } from "../../lib/adventure/render";
import { ADVENTURE_CITY_LAYERS } from "../../lib/adventure/city-background";
import type { AdventureEnemy } from "../../lib/adventure/types";
import {
  createAdventurePlayerFromSamurai,
  createInitialAdventureMeta,
  handleAdventureKeyDown,
  stepAdventure,
} from "../../lib/adventure/update";
import { createSoundPlayer } from "../../lib/game/audio";
import { preloadBackgrounds, type LoadedBackgrounds } from "../../lib/game/background";
import { CHARACTER_ROSTER, preloadSprites, type LoadedSpriteAssets } from "../../lib/game/sprites";
import type { FighterState } from "../../lib/game/types";

interface KeyState {
  pressed: Set<string>;
}

export function SamuraiAdventureCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const keysRef = useRef<KeyState>({ pressed: new Set<string>() });
  const spriteAssetsRef = useRef<LoadedSpriteAssets | null>(null);
  const backgroundsRef = useRef<LoadedBackgrounds | null>(null);

  useEffect(() => {
    let isMounted = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasEl = canvas;
    const context = canvasEl.getContext("2d");
    if (!context) return;
    const ctx = context;

    const samurai = CHARACTER_ROSTER.find((c) => c.id === "samurai");
    if (!samurai) return;

    const sounds = createSoundPlayer();
    const meta = createInitialAdventureMeta();
    const playerRef: { current: FighterState } = {
      current: createAdventurePlayerFromSamurai(samurai, 200),
    };
    const enemiesRef: { current: AdventureEnemy[] } = { current: [] };

    void preloadSprites([samurai.sprites])
      .then((loaded) => {
        if (!isMounted) return;
        spriteAssetsRef.current = loaded;
      })
      .catch(() => {
        if (!isMounted) return;
        spriteAssetsRef.current = null;
      });

    void preloadBackgrounds(ADVENTURE_CITY_LAYERS)
      .then((loaded) => {
        if (!isMounted) return;
        backgroundsRef.current = loaded;
      })
      .catch(() => {
        if (!isMounted) return;
        backgroundsRef.current = null;
      });

    function resizeCanvas(): void {
      canvasEl.width = window.innerWidth;
      canvasEl.height = window.innerHeight;
    }

    function onKeyDown(event: KeyboardEvent): void {
      keysRef.current.pressed.add(event.code);
      handleAdventureKeyDown(meta, event, playerRef.current, performance.now(), sounds);
    }

    function onKeyUp(event: KeyboardEvent): void {
      keysRef.current.pressed.delete(event.code);
    }

    function step(now: number): void {
      const result = stepAdventure({
        meta,
        player: playerRef.current,
        enemies: enemiesRef.current,
        keys: keysRef.current,
        now,
        canvasWidth: canvasEl.width,
        canvasHeight: canvasEl.height,
        sounds,
      });
      playerRef.current = result.player;

      renderAdventureFrame({
        ctx,
        canvasWidth: canvasEl.width,
        canvasHeight: canvasEl.height,
        cameraX: result.cameraX,
        meta: result.meta,
        player: result.player,
        enemies: result.enemies,
        spriteAssets: spriteAssetsRef.current,
        backgrounds: backgroundsRef.current,
        now,
      });

      animationFrameRef.current = requestAnimationFrame(step);
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      isMounted = false;
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      sounds.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} style={{ display: "block", width: "100vw", height: "100vh" }} />;
}
