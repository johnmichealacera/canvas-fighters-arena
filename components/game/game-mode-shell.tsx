"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { BasicThreeScene } from "./basic-three-scene";
import { GameCanvas } from "./game-canvas";
import { SamuraiAdventureCanvas } from "./samurai-adventure-canvas";

type GameMode = "pick" | "versus" | "adventure" | "three";

const shell: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  background: "radial-gradient(1200px 800px at 50% 20%, #1e293b 0%, #020617 55%)",
  color: "#e2e8f0",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "32px 20px",
  boxSizing: "border-box",
};

const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 24,
  maxWidth: 1040,
  width: "100%",
};

const card: CSSProperties = {
  borderRadius: 16,
  padding: "28px 24px",
  textAlign: "left" as const,
  border: "1px solid rgba(148,163,184,0.35)",
  background: "rgba(15,23,42,0.72)",
  cursor: "pointer",
  transition: "transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
};

export function GameModeShell() {
  const [mode, setMode] = useState<GameMode>("pick");

  if (mode === "versus") {
    return (
      <div style={{ position: "relative", minHeight: "100vh", background: "#020617" }}>
        <button
          type="button"
          onClick={() => setMode("pick")}
          style={{
            position: "fixed",
            top: 16,
            left: 16,
            zIndex: 50,
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid rgba(148,163,184,0.45)",
            background: "rgba(15,23,42,0.9)",
            color: "#e2e8f0",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ← Mode select
        </button>
        <GameCanvas />
      </div>
    );
  }

  if (mode === "adventure") {
    return (
      <div style={{ position: "relative", minHeight: "100vh", background: "#020617" }}>
        <button
          type="button"
          onClick={() => setMode("pick")}
          style={{
            position: "fixed",
            top: 16,
            left: 16,
            zIndex: 50,
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid rgba(56,189,248,0.45)",
            background: "rgba(15,23,42,0.9)",
            color: "#e2e8f0",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ← Mode select
        </button>
        <SamuraiAdventureCanvas />
      </div>
    );
  }

  if (mode === "three") {
    return (
      <div style={{ position: "relative", minHeight: "100vh", background: "#020617" }}>
        <button
          type="button"
          onClick={() => setMode("pick")}
          style={{
            position: "fixed",
            top: 16,
            left: 16,
            zIndex: 50,
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid rgba(167,139,250,0.55)",
            background: "rgba(15,23,42,0.92)",
            color: "#e2e8f0",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ← Mode select
        </button>
        <BasicThreeScene />
      </div>
    );
  }

  return (
    <main style={shell}>
      <p style={{ margin: "0 0 8px", letterSpacing: "0.12em", fontSize: 12, color: "#94a3b8", textTransform: "uppercase" }}>
        Canvas fighters arena
      </p>
      <h1 style={{ margin: "0 0 12px", fontSize: "clamp(1.75rem, 4vw, 2.4rem)", fontWeight: 800, textAlign: "center" }}>
        Choose your mode
      </h1>
      <p style={{ margin: "0 0 36px", maxWidth: 640, textAlign: "center", color: "#94a3b8", lineHeight: 1.55 }}>
        2D versus, samurai adventure, or a tiny WebGL sandbox — all from this Next.js app. Multiplayer / Node.js would layer
        on top later (e.g. Socket.io) if you want shared worlds.
      </p>

      <div style={grid}>
        <button
          type="button"
          style={{
            ...card,
            boxShadow: "0 0 0 0 rgba(56,189,248,0)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.borderColor = "rgba(56,189,248,0.65)";
            e.currentTarget.style.boxShadow = "0 12px 40px rgba(8,145,178,0.18)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.borderColor = "rgba(148,163,184,0.35)";
            e.currentTarget.style.boxShadow = "none";
          }}
          onClick={() => setMode("adventure")}
        >
          <div style={{ fontSize: 13, color: "#38bdf8", fontWeight: 700, marginBottom: 8 }}>Single player</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Weavebreaker — Central Mile</div>
          <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.5 }}>
            Story-led samurai run through the sidescroller Central City pack: plaza ambush, neon mile, and a Weave Node
            showdown.
          </div>
        </button>

        <button
          type="button"
          style={card}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.borderColor = "rgba(251,191,36,0.55)";
            e.currentTarget.style.boxShadow = "0 12px 40px rgba(245,158,11,0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.borderColor = "rgba(148,163,184,0.35)";
            e.currentTarget.style.boxShadow = "none";
          }}
          onClick={() => setMode("versus")}
        >
          <div style={{ fontSize: 13, color: "#fbbf24", fontWeight: 700, marginBottom: 8 }}>Two players</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Versus arena</div>
          <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.5 }}>
            Classic roster select and rounds: movement, jumps, strikes, and KOs on the space-station backdrop.
          </div>
        </button>

        <button
          type="button"
          style={card}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.borderColor = "rgba(167,139,250,0.6)";
            e.currentTarget.style.boxShadow = "0 12px 40px rgba(139,92,246,0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.borderColor = "rgba(148,163,184,0.35)";
            e.currentTarget.style.boxShadow = "none";
          }}
          onClick={() => setMode("three")}
        >
          <div style={{ fontSize: 13, color: "#c4b5fd", fontWeight: 700, marginBottom: 8 }}>WebGL · Three.js</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>3D orb run</div>
          <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.5 }}>
            Minimal third-person scene: shadows, fog, WASD movement, and five collectibles — the GPU does the heavy
            lifting in your browser.
          </div>
        </button>
      </div>
    </main>
  );
}
