/**
 * In-process Next.js production server for Electron (no child process fork).
 * Serves the app on 127.0.0.1:3000 and exposes /uploads/* from ./uploads (no Prisma — this game has no DB).
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const next = require("next");

const HOST = process.env.ELECTRON_NEXT_HOST || "127.0.0.1";
const PORT = parseInt(String(process.env.PORT || "3000"), 10);

let httpServer;
let nextApp;

function ensureUploadsDir() {
  const uploadsRoot = path.join(process.cwd(), "uploads");
  fs.mkdirSync(uploadsRoot, { recursive: true });
  return uploadsRoot;
}

function safeUploadPath(uploadsRoot, urlPath) {
  const rel = decodeURIComponent(urlPath.replace(/^\/uploads\/?/, "")).replace(/\\/g, "/");
  if (!rel || rel.includes("..")) return null;
  const filePath = path.join(uploadsRoot, rel);
  const resolved = path.resolve(filePath);
  const rootResolved = path.resolve(uploadsRoot);
  if (!resolved.startsWith(rootResolved)) return null;
  return resolved;
}

function serveUploads(req, res, uploadsRoot) {
  const urlPath = (req.url || "").split("?")[0];
  if (!urlPath.startsWith("/uploads/") && urlPath !== "/uploads") return false;

  const filePath = safeUploadPath(uploadsRoot, urlPath);
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.statusCode = 404;
    res.end("Not found");
    return true;
  }

  const ext = path.extname(filePath).toLowerCase();
  const types = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".json": "application/json",
    ".txt": "text/plain",
  };
  res.setHeader("Content-Type", types[ext] || "application/octet-stream");
  fs.createReadStream(filePath).pipe(res);
  return true;
}

async function startServer() {
  const uploadsRoot = ensureUploadsDir();

  nextApp = next({
    dev: false,
    dir: process.cwd(),
  });

  await nextApp.prepare();
  const handle = nextApp.getRequestHandler();

  httpServer = http.createServer((req, res) => {
    try {
      if (serveUploads(req, res, uploadsRoot)) return;
      return handle(req, res);
    } catch (err) {
      console.error(err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  await new Promise((resolve, reject) => {
    httpServer.once("error", (err) => {
      const code = err && err.code;
      const hint =
        code === "EADDRINUSE"
          ? `Port ${PORT} is already in use. Close other Electron copies or set PORT in the environment.`
          : "";
      reject(new Error(hint ? `${hint}\n${String(err)}` : String(err)));
    });
    httpServer.listen(PORT, HOST, () => resolve());
  });

  return { host: HOST, port: PORT };
}

async function stopServer() {
  if (httpServer) {
    await new Promise((resolve) => {
      httpServer.close(() => resolve());
    });
    httpServer = null;
  }
  if (nextApp && typeof nextApp.close === "function") {
    try {
      await nextApp.close();
    } catch (err) {
      console.warn("next.close() warning:", err);
    }
    nextApp = null;
  }
}

module.exports = { startServer, stopServer };
