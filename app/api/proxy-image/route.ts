import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSpacesClient, getSpacesBucket, getSpacesCdnBase } from "@/lib/spaces";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  const base = getSpacesCdnBase();
  if (!base) {
    return NextResponse.json(
      { error: "Image proxy is not configured" },
      { status: 503 }
    );
  }

  const trimmed = url.trim();
  if (!trimmed.startsWith(base)) {
    return NextResponse.json(
      { error: "URL is not allowed" },
      { status: 403 }
    );
  }

  const objectKey = trimmed.slice(base.length).replace(/^\//, "");
  if (!objectKey) {
    return NextResponse.json({ error: "Invalid URL path" }, { status: 400 });
  }

  try {
    const client = getSpacesClient();
    const bucket = getSpacesBucket();
    const result = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: objectKey })
    );

    if (!result.Body) {
      return NextResponse.json({ error: "Empty object" }, { status: 404 });
    }

    const contentType =
      result.ContentType ?? "application/octet-stream";
    const headers: HeadersInit = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    };
    if (result.ContentLength != null) {
      headers["Content-Length"] = String(result.ContentLength);
    }

    const stream = result.Body as ReadableStream;
    return new NextResponse(stream, { headers });
  } catch (e) {
    console.error("Proxy image error:", e);
    const isNotFound =
      e && typeof e === "object" && "name" in e && (e as { name?: string }).name === "NoSuchKey";
    if (isNotFound) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to load image" },
      { status: 502 }
    );
  }
}
