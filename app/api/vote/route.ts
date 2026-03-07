import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { broadcast } from "@/lib/sse";

const VOTER_COOKIE = "beatcon_voter_id";
const VOTER_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const voteSchema = z.object({
  matchupId: z.string(),
  participantId: z.string(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  contactConsent: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten(), { status: 400 });
  }
  const { matchupId, participantId, name, email, phone, contactConsent } = parsed.data;

  const cookieStore = await cookies();
  let voterId = cookieStore.get(VOTER_COOKIE)?.value;

  if (!voterId) {
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Signup required", fields: { name: !name, email: !email, phone: !phone } },
        { status: 400 }
      );
    }
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

  const matchup = await prisma.matchup.findUnique({
    where: { id: matchupId },
    include: { event: true, participants: { include: { participant: true } } },
  });
  if (!matchup) {
    return NextResponse.json({ error: "Matchup not found" }, { status: 404 });
  }
  const validParticipantIds = matchup.participants.map((mp) => mp.participantId);
  if (!validParticipantIds.includes(participantId)) {
    return NextResponse.json({ error: "Invalid participant for this matchup" }, { status: 400 });
  }
  const now = new Date();
  if (matchup.voteEndsAt && now > matchup.voteEndsAt) {
    return NextResponse.json({ error: "Voting has ended for this matchup" }, { status: 400 });
  }
  if (matchup.status !== "live" && matchup.status !== "pending") {
    return NextResponse.json({ error: "Voting is not open for this matchup" }, { status: 400 });
  }

  const existingVote = await prisma.vote.findUnique({
    where: {
      matchupId_voterIdentityId: { matchupId, voterIdentityId: voterId },
    },
  });
  if (existingVote) {
    if (existingVote.participantId === participantId) {
      return NextResponse.json({ success: true, message: "Already voted for this competitor" });
    }
    const maxVotes = matchup.event.maxVotesPerUser;
    const userVotesInMatchup = await prisma.vote.count({
      where: { matchupId, voterIdentityId: voterId },
    });
    if (userVotesInMatchup >= maxVotes) {
      return NextResponse.json(
        { error: `Maximum ${maxVotes} vote(s) per user for this matchup` },
        { status: 400 }
      );
    }
  }

  await prisma.vote.upsert({
    where: {
      matchupId_voterIdentityId: { matchupId, voterIdentityId: voterId },
    },
    update: { participantId },
    create: {
      matchupId,
      voterIdentityId: voterId,
      participantId,
    },
  });

  broadcast(matchup.eventId, { type: "vote", matchupId });
  return NextResponse.json({ success: true });
}
