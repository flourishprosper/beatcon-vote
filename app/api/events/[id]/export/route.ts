import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  const { id: eventId } = await params;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const matchups = await prisma.matchup.findMany({
    where: { eventId },
    orderBy: [{ round: { roundIndex: "asc" } }, { orderInRound: "asc" }],
    include: {
      round: true,
      participants: { orderBy: { slotIndex: "asc" }, include: { participant: true } },
      votes: { include: { voterIdentity: true, participant: true } },
    },
  });

  const maxSlots = Math.max(1, ...matchups.map((m) => m.participants.length));
  const participantHeaders = Array.from({ length: maxSlots }, (_, i) => [`Participant ${i + 1}`, `Votes ${i + 1}`]).flat();
  const rows: string[][] = [
    ["Event", event.name],
    ["Exported", new Date().toISOString()],
    [],
    ["Round", "Matchup", ...participantHeaders, "Voter Name", "Voter Email", "Voter Phone", "Voted For", "At"],
  ];

  for (const m of matchups) {
    const parts = m.participants.map((mp) => mp.participant);
    const voteCounts = await Promise.all(
      m.participants.map((mp) =>
        prisma.vote.count({ where: { matchupId: m.id, participantId: mp.participantId } })
      )
    );
    const names = parts.map((p) => p.name);
    const votesRow = voteCounts.map(String);
    while (names.length < maxSlots) {
      names.push("TBD");
      votesRow.push("0");
    }
    const matchupLabel = names.join(" vs ");
    if (m.votes.length === 0) {
      rows.push([m.round.label, matchupLabel, ...names, ...votesRow, "", "", "", "", ""]);
    } else {
      m.votes.forEach((v, i) => {
        const emptySlots = Array(2 * maxSlots).fill("");
        rows.push([
          i === 0 ? m.round.label : "",
          i === 0 ? matchupLabel : "",
          ...(i === 0 ? [...names, ...votesRow] : emptySlots),
          v.voterIdentity.name,
          v.voterIdentity.email,
          v.voterIdentity.phone,
          v.participant.name,
          v.createdAt.toISOString(),
        ]);
      });
    }
  }

  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="beatcon-votes-${event.slug}-${Date.now()}.csv"`,
    },
  });
}
