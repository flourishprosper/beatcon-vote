import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";
import { parseCSV, normalizeYearsProducing } from "@/lib/csv";
import { slugFromStageName, ensureUniqueProducerSlug } from "@/lib/slug";

const bodySchema = z.object({
  csv: z.string().min(1),
  eventId: z.string().optional(),
});

function randomPassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < length; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

function getCell(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k]?.trim();
    if (v) return v;
  }
  return "";
}

export async function POST(req: Request) {
  const err = await requireAdmin();
  if (err) return err;

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten(), { status: 400 });
  }

  const rows = parseCSV(parsed.data.csv);
  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No data rows in CSV. Ensure the file has a header row and at least one data row." },
      { status: 400 }
    );
  }

  let event: { id: string; acceptsProducerRegistration: boolean } | null = null;
  if (parsed.data.eventId) {
    event = await prisma.event.findUnique({
      where: { id: parsed.data.eventId },
      select: { id: true, acceptsProducerRegistration: true },
    });
  }

  const results: { email: string; stageName: string; password?: string; error?: string }[] = [];
  let created = 0;

  for (const row of rows) {
    const email = getCell(row, "Email Address", "Email").trim().toLowerCase();
    const fullName = getCell(row, "Full Name");
    const stageName = getCell(row, "Producer Name / Stage Name");
    const phone = getCell(row, "Phone Number");
    const genre = getCell(row, "What genre best describes your sound?");
    const productionStyle = getCell(row, "Describe your production style in one sentence.");

    if (!email || !stageName || !fullName || !phone || !genre || !productionStyle) {
      results.push({
        email: email || "(missing email)",
        stageName: stageName || "(missing)",
        error: "Missing required field (email, stage name, full name, phone, genre, or production style).",
      });
      continue;
    }

    const existing = await prisma.producer.findUnique({ where: { email } });
    if (existing) {
      results.push({ email, stageName, error: "An account with this email already exists." });
      continue;
    }

    const yearsProducing = normalizeYearsProducing(
      getCell(row, "How many years have you been producing?")
    );
    const instagramHandle = getCell(row, "Instagram Handle") || null;
    const cityState = getCell(row, "City / State") || null;

    const password = randomPassword();
    const passwordHash = await hash(password, 10);
    const baseSlug = slugFromStageName(stageName);
    const slug = await ensureUniqueProducerSlug(baseSlug);

    try {
      const producer = await prisma.producer.create({
        data: {
          email,
          passwordHash,
          stageName,
          slug,
          fullName,
          phone,
          instagramHandle: instagramHandle || undefined,
          cityState: cityState || undefined,
          yearsProducing,
          genre,
          productionStyle,
        },
      });

      if (event?.acceptsProducerRegistration) {
        await prisma.producerEventSignup.upsert({
          where: {
            producerId_eventId: { producerId: producer.id, eventId: event.id },
          },
          create: {
            producerId: producer.id,
            eventId: event.id,
            agreeRules: true,
            agreeOriginal: true,
            agreeTimeLimits: true,
          },
          update: {},
        });
      }

      results.push({ email, stageName, password });
      created++;
    } catch (e) {
      results.push({
        email,
        stageName,
        error: e instanceof Error ? e.message : "Failed to create producer.",
      });
    }
  }

  return NextResponse.json({
    created,
    skipped: results.length - created,
    results,
  });
}
