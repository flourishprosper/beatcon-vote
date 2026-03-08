import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireProducer, getProducerId } from "@/lib/auth-producer";
import { getSpacesClient, getSpacesBucket, getSpacesCdnUrl } from "@/lib/spaces";

const KIND_CONFIG = {
  image: {
    maxBytes: 5 * 1024 * 1024, // 5MB
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
  audio: {
    maxBytes: 25 * 1024 * 1024, // 25MB
    mimeTypes: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm", "audio/x-wav"],
  },
  video: {
    maxBytes: 100 * 1024 * 1024, // 100MB
    mimeTypes: ["video/mp4", "video/webm"],
  },
} as const;

type Kind = keyof typeof KIND_CONFIG;

const ALL_MIME_TYPES: Set<string> = new Set(
  Object.values(KIND_CONFIG).flatMap((c) => [...c.mimeTypes])
);

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200) || "file";
}

function getExtFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/ogg": "ogg",
    "audio/webm": "weba",
    "video/mp4": "mp4",
    "video/webm": "webm",
  };
  return map[mime] ?? "bin";
}

export async function POST(req: Request) {
  const err = await requireProducer();
  if (err) return err;
  const producerId = await getProducerId();
  if (!producerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (
    !process.env.DO_SPACES_KEY ||
    !process.env.DO_SPACES_SECRET ||
    !process.env.DO_SPACES_BUCKET ||
    !process.env.DO_SPACES_CDN_ENDPOINT
  ) {
    return NextResponse.json(
      { error: "Upload is not configured. Set DO_SPACES_* environment variables." },
      { status: 503 }
    );
  }

  let body: { filename?: string; contentType?: string; kind?: string; size?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const filename = typeof body.filename === "string" ? body.filename.trim() : "";
  const contentType = typeof body.contentType === "string" ? body.contentType.trim().toLowerCase() : "";
  const kind = (typeof body.kind === "string" ? body.kind : "image") as Kind;
  const size = typeof body.size === "number" ? body.size : 0;

  if (!filename || !contentType) {
    return NextResponse.json(
      { error: "Missing filename or contentType" },
      { status: 400 }
    );
  }

  const config = KIND_CONFIG[kind];
  if (!config) {
    return NextResponse.json(
      { error: "Invalid kind. Use image, audio, or video." },
      { status: 400 }
    );
  }
  if (!(config.mimeTypes as readonly string[]).includes(contentType) && !ALL_MIME_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: `Invalid contentType for ${kind}. Allowed: ${config.mimeTypes.join(", ")}` },
      { status: 400 }
    );
  }
  if (size > config.maxBytes) {
    return NextResponse.json(
      { error: `File too large for ${kind}. Maximum size is ${config.maxBytes / 1024 / 1024}MB.` },
      { status: 400 }
    );
  }

  const ext = getExtFromMime(contentType);
  const safeName = sanitizeFilename(filename).replace(/\.[^.]+$/, "") || "file";
  const objectKey = `producer-media/${producerId}/${Date.now()}-${safeName}.${ext}`;

  try {
    const client = getSpacesClient();
    const bucket = getSpacesBucket();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: contentType,
      ACL: "public-read",
    });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 });
    const publicUrl = getSpacesCdnUrl(objectKey);
    return NextResponse.json({ uploadUrl, objectKey, publicUrl });
  } catch (e) {
    console.error("Presigned URL error:", e);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
