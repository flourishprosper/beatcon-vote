import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const VOTER_COOKIE = "beatcon_voter_id";
const VOTER_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const identifySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  contactConsent: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = identifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Name, email, and phone are required", fields: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { name, email, phone, contactConsent } = parsed.data;

  const cookieStore = await cookies();
  let voterId = cookieStore.get(VOTER_COOKIE)?.value;

  if (!voterId) {
    const existing = await prisma.voterIdentity.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existing) {
      voterId = existing.id;
    } else {
      const voter = await prisma.voterIdentity.create({
        data: { name, email, phone, contactConsent: contactConsent ?? false },
      });
      voterId = voter.id;
    }
    cookieStore.set(VOTER_COOKIE, voterId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: VOTER_COOKIE_MAX_AGE,
      path: "/",
    });
  }

  return NextResponse.json({ success: true });
}
