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

export function getSpacesCdnUrl(objectKey: string): string {
  const base = process.env.DO_SPACES_CDN_ENDPOINT;
  if (!base) throw new Error("DO_SPACES_CDN_ENDPOINT must be set");
  const trimmed = base.replace(/\/$/, "");
  const key = objectKey.startsWith("/") ? objectKey.slice(1) : objectKey;
  return `${trimmed}/${key}`;
}
