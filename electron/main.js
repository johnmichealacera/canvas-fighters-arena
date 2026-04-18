/**
 * Electron main process: load env, start Next in-process (require server — no process.execPath spawn),
 * wait until HTTP responds, then open BrowserWindow.
 */
const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");

/** Second+ launches exit immediately — avoids port 3000 conflicts and “invisible” duplicate processes. */
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

const { startServer, stopServer } = require("./server");

app.on("second-instance", () => {
  const existing = BrowserWindow.getAllWindows()[0];
  if (existing && !existing.isDestroyed()) {
    if (existing.isMinimized()) existing.restore();
    existing.show();
    existing.focus();
  }
});

function loadEnvFiles() {
  const candidates = [
    path.join(__dirname, "..", ".env.local"),
    path.join(__dirname, "..", ".env"),
    path.join(__dirname, ".env"),
  ];
  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    const text = fs.readFileSync(envPath, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

function getAppRoot() {
  if (app.isPackaged) {
    return app.getAppPath();
  }
  return path.join(__dirname, "..");
}

function logPackaged(...args) {
  if (!app.isPackaged) {
    console.log(...args);
    return;
  }
  try {
    const logPath = path.join(app.getPath("userData"), "electron-launch.log");
    const line = `${new Date().toISOString()} ${args.map(String).join(" ")}\n`;
    fs.appendFileSync(logPath, line, "utf8");
  } catch {
    /* ignore */
  }
  console.log(...args);
}

function waitForHttpOk(host, port, timeoutMs = 120000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const req = http.request(
        { host, port, path: "/", method: "GET", timeout: 8000 },
        (res) => {
          res.resume();
          res.on("end", () => resolve());
        },
      );
      req.on("timeout", () => {
        req.destroy();
      });
      req.on("error", () => {
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Timed out waiting for Next.js on http://${host}:${port}`));
          return;
        }
        setTimeout(tryOnce, 250);
      });
      req.end();
    };
    tryOnce();
  });
}

async function createWindow(host, port) {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: true,
    backgroundColor: "#020617",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const url = `http://${host}:${port}/`;

  win.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    logPackaged("did-fail-load", errorCode, errorDescription, validatedURL);
    void dialog.showErrorBox(
      "Canvas Fighters — load failed",
      `${errorDescription} (${errorCode})\n${validatedURL}\n\nSee log: ${path.join(app.getPath("userData"), "electron-launch.log")}`,
    );
  });

  if (process.env.ELECTRON_OPEN_DEVTOOLS === "1") {
    win.webContents.openDevTools({ mode: "detach" });
  }

  try {
    await win.loadURL(url);
  } catch (err) {
    logPackaged("loadURL error", err);
    throw err;
  }

  win.focus();

  // Safety net if the window manager kept the frame off-screen or minimized.
  setTimeout(() => {
    if (!win.isDestroyed()) {
      if (!win.isVisible()) win.show();
      win.focus();
    }
  }, 800);
}

function showFatal(title, message) {
  logPackaged(title, message);
  try {
    void dialog.showErrorBox(title, message);
  } catch {
    // eslint-disable-next-line no-console
    console.error(title, message);
  }
}

app.whenReady().then(async () => {
  loadEnvFiles();
  process.env.NODE_ENV = "production";

  const root = getAppRoot();
  logPackaged("cwd ->", root, "isPackaged=", app.isPackaged, "appPath=", app.getAppPath());
  process.chdir(root);

  if (!fs.existsSync(path.join(process.cwd(), ".next"))) {
    showFatal(
      "Canvas Fighters — missing build",
      `No ".next" folder under:\n${process.cwd()}\n\nRe-run npm run electron:build or copy a production Next build into the app folder.`,
    );
    app.quit();
    return;
  }

  let host;
  let port;
  try {
    ({ host, port } = await startServer());
    logPackaged("Next server listening", `${host}:${port}`);
    await waitForHttpOk(host, port);
  } catch (err) {
    const msg = err instanceof Error ? err.stack || err.message : String(err);
    showFatal(
      "Canvas Fighters — server failed",
      `${msg}\n\nIf another copy is running, close it (only one can use port 3000).\nLog: ${path.join(app.getPath("userData"), "electron-launch.log")}`,
    );
    app.quit();
    return;
  }

  try {
    await createWindow(host, port);
  } catch (err) {
    const msg = err instanceof Error ? err.stack || err.message : String(err);
    showFatal("Canvas Fighters — window failed", msg);
    app.quit();
    return;
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow(host, port).catch((e) => showFatal("Window error", String(e)));
    }
  });
});

app.on("window-all-closed", () => {
  void stopServer()
    .then(() => app.quit())
    .catch(() => app.quit());
});
