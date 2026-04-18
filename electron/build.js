/**
 * Desktop build orchestrator (no Prisma in this game — steps 1–2 and 7 are logged as skipped).
 * (3) next build → (4) electron-builder → (5) copy .prisma/client if present → (6) tar.gz → done.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function run(cmd, env = {}) {
  execSync(cmd, {
    stdio: "inherit",
    cwd: root,
    env: { ...process.env, ...env },
  });
}

function findWinUnpacked() {
  const dist = path.join(root, "dist");
  if (!fs.existsSync(dist)) return null;
  const direct = path.join(dist, "win-unpacked");
  if (fs.existsSync(direct)) return direct;
  const entries = fs.readdirSync(dist, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory() && e.name.toLowerCase().includes("unpacked")) {
      return path.join(dist, e.name);
    }
  }
  return null;
}

function resolvePackagedAppRoot(winUnpacked) {
  const resourcesApp = path.join(winUnpacked, "resources", "app");
  if (fs.existsSync(path.join(resourcesApp, "package.json"))) return resourcesApp;
  if (fs.existsSync(path.join(winUnpacked, "package.json"))) return winUnpacked;
  return resourcesApp;
}

function copyPrismaClientIfNeeded(winUnpacked) {
  const src = path.join(root, "node_modules", ".prisma", "client");
  if (!fs.existsSync(src)) {
    console.log("[electron:build] (5) No source node_modules/.prisma/client — skip copy.");
    return;
  }
  const appRoot = resolvePackagedAppRoot(winUnpacked);
  const dest = path.join(appRoot, "node_modules", ".prisma", "client");
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true, force: true });
  console.log("[electron:build] (5) Copied .prisma/client →", dest);
}

async function createTarball(winUnpacked) {
  const tar = require("tar");
  const distDir = path.join(root, "dist");
  const baseName = path.basename(winUnpacked);
  const outFile = path.join(distDir, `${baseName}.tar.gz`);
  await tar.c(
    {
      gzip: true,
      file: outFile,
      cwd: distDir,
      portable: true,
    },
    [baseName],
  );
  console.log("[electron:build] (6) Archive:", outFile);
}

async function main() {
  console.log(
    "[electron:build] (1) Generate Prisma client from desktop schema: skipped (no database in this project).",
  );
  console.log("[electron:build] (2) SQLite db push / seed: skipped (no database in this project).");

  console.log("[electron:build] (3) next build");
  run("npx --yes next build", { NODE_ENV: "production" });

  console.log("[electron:build] (4) electron-builder (Windows x64, dir target)");
  run("npx --yes electron-builder --config electron-builder.config.js --win --x64");

  const winUnpacked = findWinUnpacked();
  if (!winUnpacked) {
    console.warn("[electron:build] Could not find win-unpacked output under dist/; skipping (5)(6).");
    console.log(
      "[electron:build] (7) Restore PostgreSQL Prisma client: skipped (no Prisma workflow in this repo).",
    );
    return;
  }

  copyPrismaClientIfNeeded(winUnpacked);
  await createTarball(winUnpacked);

  console.log(
    "[electron:build] (7) Restore PostgreSQL Prisma client: skipped (no Prisma workflow in this repo).",
  );
  console.log("[electron:build] Done. Unpacked app:", winUnpacked);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
