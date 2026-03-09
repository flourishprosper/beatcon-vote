"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

type Participant = { id: string; name: string; imageUrl: string | null; seed: number | null };
type ProducerRow = { id: string; stageName: string; slug: string; email: string; fullName: string };
type SignupRow = {
  id: string;
  participantId: string | null;
  producer: { id: string; stageName: string; slug: string; email: string };
};

export default function EventParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [signups, setSignups] = useState<SignupRow[]>([]);
  const [allProducers, setAllProducers] = useState<ProducerRow[]>([]);
  const [producerSearch, setProducerSearch] = useState("");
  const [selectedProducerId, setSelectedProducerId] = useState<string | null>(null);
  const [addingProducerId, setAddingProducerId] = useState<string | null>(null);
  const [producersLoading, setProducersLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/events/${id}/participants`)
      .then((r) => r.json())
      .then(setParticipants)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/events/${id}/producer-signups`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setSignups);
  }, [id, participants.length]);

  useEffect(() => {
    setProducersLoading(true);
    const q = producerSearch.trim() || undefined;
    fetch(`/api/admin/producers${q ? `?q=${encodeURIComponent(q)}` : ""}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setAllProducers)
      .finally(() => setProducersLoading(false));
  }, [producerSearch]);

  async function removeParticipant(participantId: string) {
    if (!confirm("Remove this participant?")) return;
    await fetch(`/api/participants/${participantId}`, { method: "DELETE" });
    setParticipants((prev) => prev.filter((p) => p.id !== participantId));
  }

  async function addProducerToEvent(producerId: string) {
    if (!id) return;
    setAddingProducerId(producerId);
    const res = await fetch(`/api/events/${id}/producer-signups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ producerId }),
    });
    const data = await res.json();
    setAddingProducerId(null);
    if (res.ok) {
      setParticipants((prev) => [...prev, data]);
      const signupsRes = await fetch(`/api/events/${id}/producer-signups`);
      if (signupsRes.ok) signupsRes.json().then(setSignups);
      setSelectedProducerId(null);
    }
  }

  if (loading) return <div className="text-zinc-500">Loading…</div>;

  const alreadyAddedIds = new Set(signups.filter((s) => s.participantId).map((s) => s.producer.id));
  const availableProducers = allProducers.filter((p) => !alreadyAddedIds.has(p.id));

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
      <p className="mb-4 text-sm text-zinc-600">
        Add a participant by selecting a producer below, or{" "}
        <Link href={`/admin/events/${id}?tab=participants`} className="font-medium text-zinc-900 underline hover:no-underline">
          manage signups on the event page
        </Link>.
      </p>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-medium text-zinc-900">Add producer to event</h2>
        <div className="space-y-2">
          <input
            type="text"
            value={producerSearch}
            onChange={(e) => setProducerSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full max-w-sm rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
          />
          {producersLoading ? (
            <p className="text-sm text-zinc-500">Loading producers…</p>
          ) : availableProducers.length === 0 ? (
            <p className="text-sm text-zinc-500">
              {allProducers.length === 0 ? "No producers found." : "All listed producers are already in the event."}
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedProducerId ?? ""}
                onChange={(e) => setSelectedProducerId(e.target.value || null)}
                className="min-w-[200px] rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
              >
                <option value="">— Select a producer —</option>
                {availableProducers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.stageName} ({p.email})
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!selectedProducerId || !!addingProducerId}
                onClick={() => selectedProducerId && addProducerToEvent(selectedProducerId)}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {addingProducerId ? "Adding…" : "Add to event"}
              </button>
            </div>
          )}
        </div>
      </section>

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
