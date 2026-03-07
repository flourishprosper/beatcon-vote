"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

type Participant = { id: string; name: string; imageUrl: string | null; seed: number | null };

export default function EventParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [seed, setSeed] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/events/${id}/participants`)
      .then((r) => r.json())
      .then(setParticipants)
      .finally(() => setLoading(false));
  }, [id]);

  async function addParticipant(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch(`/api/events/${id}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, seed: seed ? Number(seed) : null }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setParticipants((prev) => [...prev, data]);
      setName("");
      setSeed("");
    }
  }

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
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">Participants</h1>

      <form onSubmit={addParticipant} className="mb-8 flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Seed (optional)</label>
          <input
            type="number"
            min={1}
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            className="w-20 rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {submitting ? "Adding…" : "Add"}
        </button>
      </form>

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
