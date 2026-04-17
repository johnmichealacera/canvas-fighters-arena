"use client";

import { useEffect, useRef } from "react";
import { createSoundPlayer } from "../../lib/game/audio";
import { BACKGROUND_LAYERS, LoadedBackgrounds, preloadBackgrounds } from "../../lib/game/background";
import { resolveCombat } from "../../lib/game/collision";
import { GAME_CONFIG } from "../../lib/game/constants";
import { createFighter, resolveAnimation, tryStartAttack } from "../../lib/game/fighter";
import { applyPhysics } from "../../lib/game/physics";
import { renderCharacterSelect, renderFrame } from "../../lib/game/renderer";
import { CHARACTER_ROSTER, LoadedSpriteAssets, preloadSprites } from "../../lib/game/sprites";
import { CharacterDefinition, FighterState, MatchState } from "../../lib/game/types";

interface KeyState {
  pressed: Set<string>;
}

interface SelectState {
  p1Index: number;
  p2Index: number;
  p1Locked: boolean;
  p2Locked: boolean;
}

function createInitialMatch(
  canvasWidth: number,
  p1Character: CharacterDefinition,
  p2Character: CharacterDefinition,
): MatchState {
  const p1 = createFighter({
    id: "p1",
    name: `Player 1 (${p1Character.label})`,
    displayName: p1Character.label,
    color: p1Character.color,
    x: canvasWidth * 0.2,
    facing: 1,
    controls: { left: "KeyA", right: "KeyD", jump: "KeyW", attack: "KeyF" },
    sprites: p1Character.sprites,
    renderWidth: p1Character.renderWidth,
    renderHeight: p1Character.renderHeight,
    renderOffsetX: p1Character.renderOffsetX,
    renderOffsetY: p1Character.renderOffsetY,
    visualScale: p1Character.visualScale,
    reverseSpriteFacing: p1Character.reverseSpriteFacing,
  });

  const p2 = createFighter({
    id: "p2",
    name: `Player 2 (${p2Character.label})`,
    displayName: p2Character.label,
    color: p2Character.color,
    x: canvasWidth * 0.7,
    facing: -1,
    controls: {
      left: "ArrowLeft",
      right: "ArrowRight",
      jump: "ArrowUp",
      attack: "KeyL",
    },
    sprites: p2Character.sprites,
    renderWidth: p2Character.renderWidth,
    renderHeight: p2Character.renderHeight,
    renderOffsetX: p2Character.renderOffsetX,
    renderOffsetY: p2Character.renderOffsetY,
    visualScale: p2Character.visualScale,
    reverseSpriteFacing: p2Character.reverseSpriteFacing,
  });

  return {
    fighters: [p1, p2],
    winnerId: null,
    roundEndReason: null,
    isRoundOver: false,
    roundStartAt: performance.now(),
    roundNumber: 1,
    roundsToWin: 2,
    koAt: null,
  };
}

function resetFighterForRound(
  fighter: FighterState,
  nextX: number,
  facing: FighterState["facing"],
): void {
  fighter.position.x = nextX;
  fighter.position.y = 0;
  fighter.velocity.x = 0;
  fighter.velocity.y = 0;
  fighter.facing = facing;
  fighter.isGrounded = false;
  fighter.isAttacking = false;
  fighter.attackStartedAt = 0;
  fighter.attackCooldownUntil = 0;
  fighter.hitFlashUntil = 0;
  fighter.currentAnimation = "idle";
  fighter.health = 100;
}

function isPressed(keys: KeyState, code: string): boolean {
  return keys.pressed.has(code);
}

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const keysRef = useRef<KeyState>({ pressed: new Set<string>() });
  const matchRef = useRef<MatchState | null>(null);
  const selectRef = useRef<SelectState>({ p1Index: 0, p2Index: 1, p1Locked: false, p2Locked: false });
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

    const sounds = createSoundPlayer();

    void preloadSprites(CHARACTER_ROSTER.map((character) => character.sprites))
      .then((loadedAssets) => {
        if (!isMounted) return;
        spriteAssetsRef.current = loadedAssets;
      })
      .catch(() => {
        if (!isMounted) return;
        spriteAssetsRef.current = null;
      });

    void preloadBackgrounds(BACKGROUND_LAYERS)
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
      const match = matchRef.current;
      if (!match) return;
      const [p1, p2] = match.fighters;
      p1.position.x = Math.min(p1.position.x, canvasEl.width - p1.width);
      p2.position.x = Math.min(p2.position.x, canvasEl.width - p2.width);
    }

    function onKeyDown(event: KeyboardEvent): void {
      keysRef.current.pressed.add(event.code);
      const select = selectRef.current;
      const match = matchRef.current;

      if (!match) {
        const roster = CHARACTER_ROSTER;
        if (event.code === "KeyA" && !select.p1Locked) {
          select.p1Index = (select.p1Index - 1 + roster.length) % roster.length;
        } else if (event.code === "KeyD" && !select.p1Locked) {
          select.p1Index = (select.p1Index + 1) % roster.length;
        } else if (event.code === "ArrowLeft" && !select.p2Locked) {
          select.p2Index = (select.p2Index - 1 + roster.length) % roster.length;
        } else if (event.code === "ArrowRight" && !select.p2Locked) {
          select.p2Index = (select.p2Index + 1) % roster.length;
        } else if (event.code === "KeyF") {
          select.p1Locked = true;
        } else if (event.code === "KeyL") {
          select.p2Locked = true;
        }

        if (select.p1Locked && select.p2Locked) {
          const p1Character = roster[Math.max(0, select.p1Index)];
          const p2Character = roster[Math.max(0, select.p2Index)];
          matchRef.current = createInitialMatch(canvasEl.width, p1Character, p2Character);
        }
        return;
      }

      if (match.isRoundOver) return;

      const [p1, p2] = match.fighters;
      if (event.code === p1.controls.attack) {
        const prev = p1.isAttacking;
        tryStartAttack(p1, performance.now());
        if (!prev && p1.isAttacking) sounds.playAttack();
      }
      if (event.code === p2.controls.attack) {
        const prev = p2.isAttacking;
        tryStartAttack(p2, performance.now());
        if (!prev && p2.isAttacking) sounds.playAttack();
      }
    }

    function onKeyUp(event: KeyboardEvent): void {
      keysRef.current.pressed.delete(event.code);
    }

    function updateFighterMovement(fighter: FighterState): void {
      fighter.velocity.x = 0;
      if (isPressed(keysRef.current, fighter.controls.left)) fighter.velocity.x = -fighter.speed;
      if (isPressed(keysRef.current, fighter.controls.right)) fighter.velocity.x = fighter.speed;
      if (
        isPressed(keysRef.current, fighter.controls.jump) &&
        fighter.isGrounded
      ) {
        fighter.velocity.y = -fighter.jumpForce;
        fighter.isGrounded = false;
      }
    }

    function updateRoundState(now: number): void {
      const match = matchRef.current;
      if (!match) return;

      const [p1, p2] = match.fighters;
      p1.facing = p1.position.x < p2.position.x ? 1 : -1;
      p2.facing = p2.position.x < p1.position.x ? 1 : -1;

      if (!match.isRoundOver) {
        if (resolveCombat(p1, p2, now)) sounds.playHit();
        if (resolveCombat(p2, p1, now)) sounds.playHit();
      }

      p1.currentAnimation = resolveAnimation(p1, now);
      p2.currentAnimation = resolveAnimation(p2, now);

      if (!match.isRoundOver && (p1.health <= 0 || p2.health <= 0)) {
        match.isRoundOver = true;
        match.koAt = now;
        match.roundEndReason = "ko";
        match.winnerId = p1.health <= 0 ? "p2" : "p1";
        if (match.winnerId === "p1") p1.roundWins += 1;
        if (match.winnerId === "p2") p2.roundWins += 1;
      }

      if (!match.isRoundOver && now - match.roundStartAt >= GAME_CONFIG.roundDurationMs) {
        match.isRoundOver = true;
        match.koAt = now;
        match.roundEndReason = "time";
        if (p1.health > p2.health) {
          match.winnerId = "p1";
          p1.roundWins += 1;
        } else if (p2.health > p1.health) {
          match.winnerId = "p2";
          p2.roundWins += 1;
        } else {
          match.winnerId = null;
        }
      }

      if (match.isRoundOver && match.koAt && now - match.koAt >= GAME_CONFIG.roundResetDelayMs) {
        const isMatchOver =
          p1.roundWins >= match.roundsToWin || p2.roundWins >= match.roundsToWin;

        if (isMatchOver) {
          p1.roundWins = 0;
          p2.roundWins = 0;
          match.roundNumber = 1;
        } else {
          match.roundNumber += 1;
        }

        resetFighterForRound(p1, canvasEl.width * 0.2, 1);
        resetFighterForRound(p2, canvasEl.width * 0.7, -1);
        match.isRoundOver = false;
        match.koAt = null;
        match.winnerId = null;
        match.roundEndReason = null;
        match.roundStartAt = now;
      }
    }

    function step(now: number): void {
      const match = matchRef.current;
      if (!match) {
        const roster = CHARACTER_ROSTER;
        renderCharacterSelect({
          ctx,
          canvasWidth: canvasEl.width,
          canvasHeight: canvasEl.height,
          roster,
          p1Index: selectRef.current.p1Index,
          p2Index: selectRef.current.p2Index,
          p1Locked: selectRef.current.p1Locked,
          p2Locked: selectRef.current.p2Locked,
          spriteAssets: spriteAssetsRef.current,
        });
        animationFrameRef.current = requestAnimationFrame(step);
        return;
      }

      const [p1, p2] = match.fighters;

      if (!match.isRoundOver) {
        updateFighterMovement(p1);
        updateFighterMovement(p2);
      } else {
        p1.velocity.x = 0;
        p2.velocity.x = 0;
      }

      applyPhysics(p1, { width: canvasEl.width, height: canvasEl.height });
      applyPhysics(p2, { width: canvasEl.width, height: canvasEl.height });
      updateRoundState(now);

      renderFrame({
        ctx,
        canvasWidth: canvasEl.width,
        canvasHeight: canvasEl.height,
        match,
        spriteAssets: spriteAssetsRef.current,
        backgrounds: backgroundsRef.current,
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
