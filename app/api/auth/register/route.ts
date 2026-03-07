import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { slugFromStageName, ensureUniqueProducerSlug } from "@/lib/slug";

const YEARS_OPTIONS = ["3-5", "6-10", "10+"] as const;

const registerSchema = z.object({
  fullName: z.string().min(1),
  stageName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(1),
  instagramHandle: z.string().optional().nullable(),
  cityState: z.string().optional().nullable(),
  yearsProducing: z.enum(YEARS_OPTIONS),
  genre: z.string().min(1),
  productionStyle: z.string().min(1),
  agreeRules: z.literal(true),
  agreeOriginal: z.literal(true),
  agreeTimeLimits: z.literal(true),
  eventId: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten(), { status: 400 });
  }

  const existing = await prisma.producer.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists. Log in or reset password." },
      { status: 409 }
    );
  }

  const baseSlug = slugFromStageName(parsed.data.stageName);
  const slug = await ensureUniqueProducerSlug(baseSlug);
  const passwordHash = await hash(parsed.data.password, 10);

  const producer = await prisma.producer.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      stageName: parsed.data.stageName,
      slug,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      instagramHandle: parsed.data.instagramHandle ?? null,
      cityState: parsed.data.cityState ?? null,
      yearsProducing: parsed.data.yearsProducing,
      genre: parsed.data.genre,
      productionStyle: parsed.data.productionStyle,
    },
  });

  if (parsed.data.eventId) {
    const event = await prisma.event.findUnique({
      where: { id: parsed.data.eventId },
    });
    if (event?.acceptsProducerRegistration) {
      await prisma.producerEventSignup.create({
        data: {
          producerId: producer.id,
          eventId: parsed.data.eventId,
          agreeRules: parsed.data.agreeRules,
          agreeOriginal: parsed.data.agreeOriginal,
          agreeTimeLimits: parsed.data.agreeTimeLimits,
        },
      });
    }
  }

  return NextResponse.json(
    { success: true, id: producer.id, email: producer.email },
    { status: 201 }
  );
}
