# Electron desktop (Windows, offline)

## What this is

- **main.js** — Electron shell: loads env files, `chdir`s to the packaged app root, starts **Next in-process** via `require("./server")` (no `child_process.spawn(process.execPath)` fork bomb), waits for `http://127.0.0.1:3000`, opens a `BrowserWindow`.
- **server.js** — `next({ dev: false })` + Node `http` server; handles **`/uploads/*`** from the `uploads/` folder before the Next handler. **No Prisma/SQLite** in this game repo — those steps in `build.js` are intentionally skipped.
- **preload.js** — Minimal `contextBridge` surface.
- **build.js** — `next build` → `electron-builder` → optional `.prisma/client` copy if present → `dist/win-unpacked.tar.gz`.

## Troubleshooting (blank window / nothing happens)

1. **Only run one copy** — the app binds **port 3000**. Extra launches used to fail silently; the main process now uses a **single-instance lock** so double‑clicks do not spawn stuck background processes.
2. **Hidden window bug (fixed)** — the window used `show: false` and listened for `ready-to-show` **after** `loadURL` finished. In Electron that listener can **never run**, so the UI stayed invisible. The main process now shows the window immediately and focuses it after load.
3. **Wrong app folder (fixed)** — packaged root now uses **`app.getAppPath()`** (directory that contains `package.json` and `.next`) instead of assuming `resourcesPath + "/app"`, which can differ by packager layout.
4. **Logs** — on packaged builds, startup lines are appended to `%APPDATA%\<product name>\electron-launch.log` (Electron `userData`). Set **`ELECTRON_OPEN_DEVTOOLS=1`** in the environment before starting the `.exe` to open DevTools (e.g. shortcut → Properties → add a variable or use `set` in a `.bat` wrapper).
5. **Missing `.next`** — if the packaged folder has no `.next`, you get an error dialog pointing at the problem.

## Build (from repo root)

```bash
npm run electron:build
```

Output:

- Unpacked Windows app under **`dist/win-unpacked/`** (includes the `.exe`).
- Optional archive **`dist/win-unpacked.tar.gz`** (or similarly named if the folder name differs).

## Prisma / database

This canvas game **does not use a database**. If you later add Prisma, introduce `prisma/schema.desktop.prisma`, wire `server.js` to run `prisma db push` on first launch, and extend `build.js` steps (1), (2), and (7) accordingly.

## Cloud vs local images

- **`app/api/upload/route.ts`** — saves uploads to `./uploads`.
- **`lib/upload/image-upload.ts`** — optional client/server helper: if no Cloudinary env vars are set, POSTs to `/api/upload` instead.
