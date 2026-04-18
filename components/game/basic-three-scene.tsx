"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const COLLECTIBLE_COUNT = 5;

/**
 * Minimal WebGL (Three.js) playground: move with WASD, collect glowing orbs, optional mouse orbit.
 * Demonstrates the same stack you read about: JS + WebGL on the client; no Node required for this demo.
 */
export function BasicThreeScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hudRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f18);
    scene.fog = new THREE.Fog(0x0a0f18, 18, 55);

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 120);
    camera.position.set(0, 9, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    root.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0x7aa8ff, 0x1a1020, 0.55);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff4e6, 1.05);
    sun.position.set(8, 18, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 50;
    sun.shadow.camera.left = -20;
    sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 20;
    sun.shadow.camera.bottom = -20;
    scene.add(sun);

    const groundGeo = new THREE.PlaneGeometry(80, 80);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.15,
      roughness: 0.85,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(80, 40, 0x334155, 0x1e293b);
    grid.position.y = 0.02;
    scene.add(grid);

    const decoGroup = new THREE.Group();
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.2, roughness: 0.7 });
    for (let i = 0; i < 12; i += 1) {
      const s = 0.8 + Math.random() * 1.6;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(s, s * (0.6 + Math.random()), s), boxMat.clone());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const ang = (i / 12) * Math.PI * 2;
      const r = 10 + Math.random() * 16;
      mesh.position.set(Math.cos(ang) * r, s * 0.35, Math.sin(ang) * r);
      decoGroup.add(mesh);
    }
    scene.add(decoGroup);

    const playerGeo = new THREE.CapsuleGeometry(0.55, 0.9, 6, 12);
    const playerMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      metalness: 0.25,
      roughness: 0.45,
    });
    const player = new THREE.Mesh(playerGeo, playerMat);
    player.castShadow = true;
    player.position.set(0, 0.9, 0);
    scene.add(player);

    const collectibles: THREE.Mesh[] = [];
    const orbGeo = new THREE.SphereGeometry(0.45, 24, 24);
    for (let i = 0; i < COLLECTIBLE_COUNT; i += 1) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.65,
        metalness: 0.4,
        roughness: 0.25,
      });
      const orb = new THREE.Mesh(orbGeo, mat);
      orb.castShadow = true;
      const ang = (i / COLLECTIBLE_COUNT) * Math.PI * 2 + 0.4;
      const rad = 5 + i * 2.2;
      orb.position.set(Math.cos(ang) * rad, 0.55, Math.sin(ang) * rad);
      orb.userData.collected = false;
      collectibles.push(orb);
      scene.add(orb);
    }

    const keys = new Set<string>();
    function onKeyDown(e: KeyboardEvent): void {
      keys.add(e.code);
    }
    function onKeyUp(e: KeyboardEvent): void {
      keys.delete(e.code);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const clock = new THREE.Clock();
    let collected = 0;
    let raf = 0;

    function resize(): void {
      const el = containerRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(root);

    function tick(): void {
      const dt = Math.min(clock.getDelta(), 0.05);
      const speed = 11;

      let mx = 0;
      let mz = 0;
      if (keys.has("KeyW") || keys.has("ArrowUp")) mz -= 1;
      if (keys.has("KeyS") || keys.has("ArrowDown")) mz += 1;
      if (keys.has("KeyA") || keys.has("ArrowLeft")) mx -= 1;
      if (keys.has("KeyD") || keys.has("ArrowRight")) mx += 1;

      if (mx !== 0 || mz !== 0) {
        const len = Math.hypot(mx, mz);
        mx /= len;
        mz /= len;
        player.position.x += mx * speed * dt;
        player.position.z += mz * speed * dt;
        player.rotation.y = Math.atan2(mx, mz);
      }

      const limit = 36;
      player.position.x = THREE.MathUtils.clamp(player.position.x, -limit, limit);
      player.position.z = THREE.MathUtils.clamp(player.position.z, -limit, limit);

      const t = clock.elapsedTime;
      for (const orb of collectibles) {
        if (orb.userData.collected as boolean) continue;
        orb.position.y = 0.55 + Math.sin(t * 2.2 + orb.position.x) * 0.12;
        orb.rotation.y += dt * 1.4;
        const dx = orb.position.x - player.position.x;
        const dz = orb.position.z - player.position.z;
        if (dx * dx + dz * dz < 1.35 * 1.35) {
          orb.userData.collected = true;
          orb.visible = false;
          collected += 1;
          if (hudRef.current) {
            hudRef.current.textContent =
              collected >= COLLECTIBLE_COUNT
                ? "All orbs collected — nice work! Walk the grid or head back to the menu."
                : `Orbs: ${collected} / ${COLLECTIBLE_COUNT}   ·   WASD to move`;
          }
        }
      }

      for (const m of decoGroup.children) {
        if (m instanceof THREE.Mesh) {
          m.rotation.y += dt * 0.08;
        }
      }

      const camDist = 11;
      const camHeight = 7;
      const px = player.position.x;
      const pz = player.position.z;
      const fx = Math.sin(player.rotation.y);
      const fz = Math.cos(player.rotation.y);
      const targetCamX = px - fx * camDist;
      const targetCamZ = pz - fz * camDist;
      camera.position.x += (targetCamX - camera.position.x) * 0.08;
      camera.position.z += (targetCamZ - camera.position.z) * 0.08;
      camera.position.y += (camHeight - camera.position.y) * 0.06;
      camera.lookAt(px, 1.1, pz);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    if (hudRef.current) {
      hudRef.current.textContent = `Orbs: 0 / ${COLLECTIBLE_COUNT}   ·   WASD to move`;
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      ro.disconnect();
      renderer.dispose();
      renderer.forceContextLoss?.();
      root.removeChild(renderer.domElement);

      groundGeo.dispose();
      groundMat.dispose();
      playerGeo.dispose();
      playerMat.dispose();
      orbGeo.dispose();
      for (const orb of collectibles) {
        if (orb.material instanceof THREE.Material) orb.material.dispose();
      }
      for (const m of decoGroup.children) {
        if (m instanceof THREE.Mesh) {
          m.geometry.dispose();
          if (m.material instanceof THREE.Material) m.material.dispose();
        }
      }
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100vh", position: "relative", overflow: "hidden" }}>
      <div
        ref={hudRef}
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 20,
          padding: "12px 16px",
          borderRadius: 12,
          background: "rgba(15,23,42,0.82)",
          border: "1px solid rgba(148,163,184,0.35)",
          color: "#e2e8f0",
          fontSize: 14,
          fontWeight: 600,
          pointerEvents: "none",
          textAlign: "center",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 64,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "8px 14px",
          borderRadius: 10,
          background: "rgba(15,23,42,0.75)",
          color: "#94a3b8",
          fontSize: 12,
          pointerEvents: "none",
        }}
      >
        Three.js · WebGL · local demo (no server required)
      </div>
    </div>
  );
}
