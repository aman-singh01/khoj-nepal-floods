/** Small typed accessors for environment configuration. */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

export const IP_HASH_SALT = process.env.IP_HASH_SALT || "dev-only-change-me";

export const MODERATION_TOKEN =
  process.env.MODERATION_TOKEN || "dev-moderator-token";

export const RECORD_TTL_DAYS = Number(process.env.RECORD_TTL_DAYS || "180");

export const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || "";
