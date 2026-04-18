import { readFile, stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".json": "application/json",
    ".txt": "text/plain",
  };
  return map[ext] ?? "application/octet-stream";
}

/**
 * Serves files from ./uploads (used via rewrite from /uploads/* for `next start` / Vercel-style hosting).
 * Electron also serves /uploads in electron/server.js when using the bundled server.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ path?: string[] }> },
): Promise<Response> {
  const { path: segments } = await context.params;
  const rel = (segments ?? []).join("/").replace(/\\/g, "/");
  if (!rel || rel.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const uploadsRoot = path.join(process.cwd(), "uploads");
  const filePath = path.join(uploadsRoot, rel);
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(uploadsRoot))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const st = await stat(resolved);
    if (!st.isFile()) return new NextResponse("Not found", { status: 404 });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const buf = await readFile(resolved);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": contentTypeFor(resolved),
      "Cache-Control": "public, max-age=3600",
    },
  });
}
