import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireProducer, getProducerId } from "@/lib/auth-producer";
import { slugFromStageName, ensureUniqueProducerSlug } from "@/lib/slug";

const YEARS_OPTIONS = ["3-5", "6-10", "10+"] as const;

const optionalUrl = z.union([z.string().url(), z.literal("")]).optional().transform((v) => v || null);
const updateSchema = z.object({
  fullName: z.string().min(1).optional(),
  stageName: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  instagramHandle: z.string().optional().nullable(),
  cityState: z.string().optional().nullable(),
  yearsProducing: z.enum(YEARS_OPTIONS).optional(),
  genre: z.string().min(1).optional(),
  productionStyle: z.string().min(1).optional(),
  imageUrl: z.string().url().optional().nullable(),
  spotifyUrl: optionalUrl,
  appleMusicUrl: optionalUrl,
  websiteUrl: optionalUrl,
  bio: z.string().optional().nullable(),
  soundCloudUrl: optionalUrl,
  twitterHandle: z.string().optional().nullable(),
});

export async function GET() {
  const err = await requireProducer();
  if (err) return err;
  const producerId = await getProducerId();
  if (!producerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const producer = await prisma.producer.findUnique({
    where: { id: producerId },
    select: {
      id: true,
      email: true,
      fullName: true,
      stageName: true,
      slug: true,
      phone: true,
      instagramHandle: true,
      cityState: true,
      yearsProducing: true,
      genre: true,
      productionStyle: true,
      imageUrl: true,
      spotifyUrl: true,
      appleMusicUrl: true,
      websiteUrl: true,
      bio: true,
      soundCloudUrl: true,
      twitterHandle: true,
    },
  });
  if (!producer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(producer);
}

export async function PATCH(req: Request) {
  const err = await requireProducer();
  if (err) return err;
  const producerId = await getProducerId();
  if (!producerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten(), { status: 400 });
  }

  const update: {
    fullName?: string;
    stageName?: string;
    slug?: string;
    phone?: string;
    instagramHandle?: string | null;
    cityState?: string | null;
    yearsProducing?: string;
    genre?: string;
    productionStyle?: string;
    imageUrl?: string | null;
    spotifyUrl?: string | null;
    appleMusicUrl?: string | null;
    websiteUrl?: string | null;
    bio?: string | null;
    soundCloudUrl?: string | null;
    twitterHandle?: string | null;
  } = { ...parsed.data };
  if (parsed.data.stageName !== undefined) {
    const baseSlug = slugFromStageName(parsed.data.stageName);
    update.slug = await ensureUniqueProducerSlug(baseSlug, producerId);
  }

  const producer = await prisma.producer.update({
    where: { id: producerId },
    data: update,
    select: {
      id: true,
      email: true,
      fullName: true,
      stageName: true,
      slug: true,
      phone: true,
      instagramHandle: true,
      cityState: true,
      yearsProducing: true,
      genre: true,
      productionStyle: true,
      imageUrl: true,
      spotifyUrl: true,
      appleMusicUrl: true,
      websiteUrl: true,
      bio: true,
      soundCloudUrl: true,
      twitterHandle: true,
    },
  });
  return NextResponse.json(producer);
}
