import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireAdmin } from "@/lib/auth-api";
import { getSpacesClient, getSpacesBucket, getSpacesCdnUrl } from "@/lib/spaces";

const IMAGE_CONFIG = {
  maxBytes: 5 * 1024 * 1024, // 5MB
  mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
} as const;

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200) || "file";
}

function getExtFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[mime] ?? "bin";
}

export async function POST(req: Request) {
  try {
    const err = await requireAdmin();
    if (err) return err;

    const key = process.env.DO_SPACES_KEY?.trim();
    const secret = process.env.DO_SPACES_SECRET?.trim();
    const bucket = process.env.DO_SPACES_BUCKET?.trim();
    const cdnEndpoint = process.env.DO_SPACES_CDN_ENDPOINT?.trim();

    if (!key || !secret || !bucket || !cdnEndpoint) {
      return NextResponse.json(
        {
          error:
            "Upload is not configured. Set DO_SPACES_KEY, DO_SPACES_SECRET, DO_SPACES_BUCKET, and DO_SPACES_CDN_ENDPOINT in your deployment environment (e.g. Netlify).",
        },
        {
          status: 503,
          headers: { "X-Upload-Error": "not-configured" },
        }
      );
    }

    let body: { filename?: string; contentType?: string; size?: number };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const filename = typeof body.filename === "string" ? body.filename.trim() : "";
    const contentType = typeof body.contentType === "string" ? body.contentType.trim().toLowerCase() : "";
    const size = typeof body.size === "number" ? body.size : 0;

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "Missing filename or contentType" },
        { status: 400 }
      );
    }

    if (!(IMAGE_CONFIG.mimeTypes as readonly string[]).includes(contentType)) {
      return NextResponse.json(
        { error: `Invalid contentType. Allowed: ${IMAGE_CONFIG.mimeTypes.join(", ")}` },
        { status: 400 }
      );
    }
    if (size > IMAGE_CONFIG.maxBytes) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${IMAGE_CONFIG.maxBytes / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    const ext = getExtFromMime(contentType);
    const safeName = sanitizeFilename(filename).replace(/\.[^.]+$/, "") || "file";
    const objectKey = `event-images/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeName}.${ext}`;

    const client = getSpacesClient();
    const bucketName = getSpacesBucket();
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: contentType,
      ACL: "public-read",
    });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 });
    const publicUrl = getSpacesCdnUrl(objectKey);
    return NextResponse.json({ uploadUrl, objectKey, publicUrl });
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e && typeof (e as { digest?: string }).digest === "string") {
      const err = e as { digest?: string };
      if (err.digest?.startsWith("NEXT_REDIRECT")) throw e;
    }
    console.error("Admin upload URL error:", e);
    const isConfigError =
      e instanceof Error && /must be set|not configured/i.test(e.message);
    if (isConfigError) {
      return NextResponse.json(
        {
          error:
            "Upload is not configured. Set DO_SPACES_KEY, DO_SPACES_SECRET, DO_SPACES_BUCKET, and DO_SPACES_CDN_ENDPOINT in your deployment environment (e.g. Netlify).",
        },
        { status: 503, headers: { "X-Upload-Error": "not-configured" } }
      );
    }
    return NextResponse.json(
      { error: "Failed to generate upload URL. Check server logs." },
      { status: 500 }
    );
  }
}
