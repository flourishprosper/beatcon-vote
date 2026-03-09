import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.DO_SPACES_REGION ?? "sfo3";
const endpoint = `https://${region}.digitaloceanspaces.com`;

export function getSpacesClient(): S3Client {
  const key = process.env.DO_SPACES_KEY;
  const secret = process.env.DO_SPACES_SECRET;
  if (!key || !secret) {
    throw new Error("DO_SPACES_KEY and DO_SPACES_SECRET must be set");
  }
  return new S3Client({
    endpoint,
    region: "us-east-1",
    credentials: { accessKeyId: key, secretAccessKey: secret },
    forcePathStyle: false,
  });
}

export function getSpacesBucket(): string {
  const bucket = process.env.DO_SPACES_BUCKET;
  if (!bucket) throw new Error("DO_SPACES_BUCKET must be set");
  return bucket;
}

export function getSpacesCdnBase(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_DO_SPACES_CDN_ENDPOINT ??
    process.env.DO_SPACES_CDN_ENDPOINT;
  const base = raw?.trim();
  if (!base) return null;
  const trimmed = base.replace(/\/$/, "");
  return trimmed.startsWith("http://") || trimmed.startsWith("https://")
    ? trimmed
    : `https://${trimmed}`;
}

export function getSpacesCdnUrl(objectKey: string): string {
  const absoluteBase = getSpacesCdnBase();
  if (!absoluteBase) throw new Error("DO_SPACES_CDN_ENDPOINT must be set");
  const key = objectKey.startsWith("/") ? objectKey.slice(1) : objectKey;
  return `${absoluteBase}/${key}`;
}

/**
 * Returns a proxy URL for images stored in our Spaces CDN so the browser
 * loads them via our backend (which has credentials). For non-CDN URLs
 * returns the original URL. Use when serving imageUrl to the client.
 */
export function getProxiedImageUrl(url: string | null | undefined): string | null {
  if (url == null || typeof url !== "string" || !url.trim()) return null;
  const base = getSpacesCdnBase();
  if (!base) return url;
  const normalized = url.trim();
  if (!normalized.startsWith(base)) return url;
  return `/api/proxy-image?url=${encodeURIComponent(normalized)}`;
}
