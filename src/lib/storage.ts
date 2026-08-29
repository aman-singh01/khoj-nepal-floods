import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { BLOB_TOKEN } from "./env";

const MAX_BYTES = 6 * 1024 * 1024; // 6 MB
const ALLOWED = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export interface StoredPhoto {
  url: string;
}

export class PhotoError extends Error {}

/**
 * Store an uploaded photo and return a public URL.
 *  - With a Vercel Blob token: uploaded to Blob storage (use this in production).
 *  - Without one: written to ./public/uploads (local dev only - serverless
 *    filesystems are ephemeral).
 */
export async function storePhoto(file: File): Promise<StoredPhoto> {
  if (file.size === 0) throw new PhotoError("The photo file is empty.");
  if (file.size > MAX_BYTES) throw new PhotoError("Photo must be 6 MB or smaller.");

  const ext = ALLOWED.get(file.type);
  if (!ext) throw new PhotoError("Photo must be a JPEG, PNG or WebP image.");

  const key = `photos/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (BLOB_TOKEN) {
    const { put } = await import("@vercel/blob");
    const { url } = await put(key, bytes, {
      access: "public",
      token: BLOB_TOKEN,
      contentType: file.type,
    });
    return { url };
  }

  const dir = path.join(process.cwd(), "public", "uploads", path.dirname(key));
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(process.cwd(), "public", "uploads", key), bytes);
  return { url: `/uploads/${key}` };
}
