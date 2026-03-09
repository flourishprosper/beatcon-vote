"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

type Participant = { id: string; name: string; imageUrl: string | null; seed: number | null };

export default function EventParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/events/${id}/participants`)
      .then((r) => r.json())
      .then(setParticipants)
      .finally(() => setLoading(false));
  }, [id]);

  async function removeParticipant(participantId: string) {
    if (!confirm("Remove this participant?")) return;
    await fetch(`/api/participants/${participantId}`, { method: "DELETE" });
    setParticipants((prev) => prev.filter((p) => p.id !== participantId));
  }

  if (loading) return <div className="text-zinc-500">Loading…</div>;

  return (
    <div>
      <Link href={`/admin/events/${id}`} className="mb-4 inline-block text-sm text-zinc-600 hover:text-zinc-900">
        ← Event
      </Link>
      <h1 className="mb-2 text-2xl font-semibold text-zinc-900">Participants</h1>
      <p className="mb-2 text-sm text-zinc-600">
        These are the contestants or options that will appear in matchups. You need at least 2 to create your first
        round.
      </p>
      <p className="mb-6 text-sm text-zinc-600">
        Participants can only be added from the event page. Open the event and use the{" "}
        <Link href={`/admin/events/${id}?tab=participants`} className="font-medium text-zinc-900 underline hover:no-underline">
          Producer signups
        </Link>{" "}
        section to add people who have registered for the event.
      </p>

      {participants.length < 2 && participants.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Add at least one more participant to create matchups.
        </div>
      )}

      <ul className="space-y-2">
        {participants.map((p) => (
          <li key={p.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-2">
            <span>
              {p.name}
              {p.seed != null ? ` (seed ${p.seed})` : ""}
            </span>
            <button
              type="button"
              onClick={() => removeParticipant(p.id)}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
