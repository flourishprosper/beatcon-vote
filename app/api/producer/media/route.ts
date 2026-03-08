import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireProducer, getProducerId } from "@/lib/auth-producer";

const createSchema = z.object({
  url: z.string().url(),
  kind: z.enum(["image", "audio", "video"]),
  displayName: z.string().optional().nullable(),
  sizeBytes: z.number().int().nonnegative().optional().nullable(),
  mimeType: z.string().optional().nullable(),
});

export async function GET() {
  const err = await requireProducer();
  if (err) return err;
  const producerId = await getProducerId();
  if (!producerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const media = await prisma.producerMedia.findMany({
    where: { producerId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(media);
}

export async function POST(req: Request) {
  const err = await requireProducer();
  if (err) return err;
  const producerId = await getProducerId();
  if (!producerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten(), { status: 400 });
  }

  const item = await prisma.producerMedia.create({
    data: {
      producerId,
      url: parsed.data.url,
      kind: parsed.data.kind,
      displayName: parsed.data.displayName ?? null,
      sizeBytes: parsed.data.sizeBytes ?? null,
      mimeType: parsed.data.mimeType ?? null,
    },
  });
  return NextResponse.json(item);
}
