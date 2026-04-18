import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;

function safeBasename(original: string): string {
  const base = path.basename(original).replace(/[^\w.\-()+]/g, "_");
  const trimmed = base.slice(0, 120);
  return trimmed || `upload-${Date.now()}.bin`;
}

/**
 * POST multipart form field `file` → saves under ./uploads and returns a public /uploads URL.
 * Used by the Electron shell (and local dev) when no cloud image provider is configured.
 */
export async function POST(request: Request): Promise<Response> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const form = await request.formData();
  const entry = form.get("file");
  if (!entry || typeof entry === "string") {
    return NextResponse.json({ error: "Expected multipart field \"file\"" }, { status: 400 });
  }

  const buffer = Buffer.from(await entry.arrayBuffer());
  if (buffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  const uploadsDir = path.join(process.cwd(), "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const name = safeBasename(entry.name || "upload");
  const diskPath = path.join(uploadsDir, name);
  await writeFile(diskPath, buffer);

  const url = `/uploads/${encodeURIComponent(name)}`;
  return NextResponse.json({ ok: true, url, path: diskPath });
}
