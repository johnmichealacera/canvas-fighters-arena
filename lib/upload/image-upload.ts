/**
 * Optional helper: when no Cloudinary (or similar) env is set, POST files to /api/upload.
 * This file does not replace any existing utility — wire it in where you need uploads.
 */
export function hasCloudImageConfig(): boolean {
  return Boolean(
    process.env.CLOUDINARY_URL ||
      process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  );
}

export async function uploadImageWithLocalFallback(file: File, baseUrl?: string): Promise<string> {
  if (hasCloudImageConfig()) {
    throw new Error(
      "Cloudinary (or other cloud) is configured but not implemented in this helper — use your provider SDK here.",
    );
  }

  const form = new FormData();
  form.append("file", file);

  const endpoint =
    typeof window !== "undefined"
      ? "/api/upload"
      : `${baseUrl?.replace(/\/$/, "") ?? "http://127.0.0.1:3000"}/api/upload`;

  const res = await fetch(endpoint, { method: "POST", body: form });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Upload failed (${res.status})`);
  }
  const data = (await res.json()) as { url?: string };
  if (!data.url) throw new Error("Upload response missing url");
  return data.url;
}
