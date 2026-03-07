"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

type Participant = { id: string; name: string };
type Matchup = {
  id: string;
  orderInRound: number;
  participants: { participant: Participant }[];
  status: string;
  voteEndsAt: string | null;
};
type Round = {
  id: string;
  roundIndex: number;
  label: string;
  status: string;
  matchups: Matchup[];
};

export default function EventRoundsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<{ id: string; participants: Participant[]; participantsPerMatchup: number } | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRoundLabel, setNewRoundLabel] = useState("");
  const [newRoundIndex, setNewRoundIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [finalizingRoundId, setFinalizingRoundId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/events/${id}`).then((r) => r.json()),
      fetch(`/api/events/${id}/rounds`).then((r) => r.json()),
    ]).then(([eventData, roundsData]) => {
      setEvent(eventData);
      setRounds(roundsData);
      setNewRoundIndex(roundsData.length);
    }).finally(() => setLoading(false));
  }, [id]);

  const n = event?.participantsPerMatchup ?? 2;

  function getParticipantIds(m: Matchup): (string | null)[] {
    const ids: (string | null)[] = (m.participants ?? []).map((mp) => mp.participant.id);
    while (ids.length < n) ids.push(null);
    return ids.slice(0, n);
  }

  async function addRound(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch(`/api/events/${id}/rounds`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roundIndex: newRoundIndex, label: newRoundLabel }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setRounds((prev) => [...prev, data]);
      setNewRoundLabel("");
      setNewRoundIndex((prev) => prev + 1);
    }
  }

  async function generateFirstRound(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGenerating(true);
    const res = await fetch(`/api/events/${id}/rounds/generate-initial`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: "Round 1" }),
    });
    const data = await res.json();
    setGenerating(false);
    if (res.ok) {
      setRounds([data]);
      setNewRoundIndex(1);
    } else {
      setError(data?.error ?? "Failed to generate first round");
    }
  }

  async function finalizeRound(roundId: string) {
    if (!confirm("Create the next round from the top vote-getters in each matchup? This will mark the current round as completed.")) return;
    setError(null);
    setFinalizingRoundId(roundId);
    const res = await fetch(`/api/events/${id}/rounds/${roundId}/finalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setFinalizingRoundId(null);
    if (res.ok) {
      const updated = rounds.map((r) => (r.id === roundId ? { ...r, status: "completed" as const } : r));
      setRounds([...updated, data.nextRound].sort((a, b) => a.roundIndex - b.roundIndex));
    } else {
      setError(data?.error ?? "Failed to finalize round");
    }
  }

  async function addMatchup(roundId: string, orderInRound: number) {
    setError(null);
    const res = await fetch(`/api/rounds/${roundId}/matchups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderInRound, participantIds: Array(n).fill(null) }),
    });
    const data = await res.json();
    if (res.ok) {
      setRounds((prev) =>
        prev.map((r) =>
          r.id === roundId ? { ...r, matchups: [...(r.matchups ?? []), data].sort((a, b) => a.orderInRound - b.orderInRound) } : r
        )
      );
    } else {
      setError(data?.message ?? data?.error ?? "Failed to add matchup");
    }
  }

  async function updateMatchup(matchupId: string, updates: { participantIds?: (string | null)[]; status?: string; voteEndsAt?: string | null }) {
    const res = await fetch(`/api/matchups/${matchupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (res.ok) {
      setRounds((prev) =>
        prev.map((r) => ({
          ...r,
          matchups: (r.matchups ?? []).map((m) => (m.id === matchupId ? { ...m, ...data } : m)),
        }))
      );
    }
  }

  async function deleteRound(roundId: string) {
    if (!confirm("Delete this round and all its matchups?")) return;
    await fetch(`/api/rounds/${roundId}`, { method: "DELETE" });
    setRounds((prev) => prev.filter((r) => r.id !== roundId));
  }

  async function deleteMatchup(roundId: string, matchupId: string) {
    if (!confirm("Delete this matchup?")) return;
    await fetch(`/api/matchups/${matchupId}`, { method: "DELETE" });
    setRounds((prev) =>
      prev.map((r) => (r.id === roundId ? { ...r, matchups: (r.matchups ?? []).filter((m) => m.id !== matchupId) } : r))
    );
  }

  if (loading || !event) return <div className="text-zinc-500">Loading…</div>;

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}
      <Link href={`/admin/events/${id}`} className="mb-4 inline-block text-sm text-zinc-600 hover:text-zinc-900">
        ← Event
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">Rounds & matchups</h1>

      {rounds.length === 0 && (
        <div className="mb-8 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="mb-3 text-sm text-zinc-700">
            Generate the first round by randomly shuffling all participants into matchups of {n}.
          </p>
          <button
            type="button"
            onClick={generateFirstRound}
            disabled={generating || (event?.participants?.length ?? 0) < 2}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {generating ? "Generating…" : "Generate first round"}
          </button>
        </div>
      )}

      <form onSubmit={addRound} className="mb-8 flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">New round label</label>
          <input
            type="text"
            value={newRoundLabel}
            onChange={(e) => setNewRoundLabel(e.target.value)}
            placeholder="e.g. Quarter-finals"
            required
            className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Index</label>
          <input
            type="number"
            min={0}
            value={newRoundIndex}
            onChange={(e) => setNewRoundIndex(Number(e.target.value))}
            className="w-20 rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {submitting ? "Adding…" : "Add round"}
        </button>
      </form>

      <div className="space-y-6">
        {rounds.map((r) => (
          <div key={r.id} className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-medium text-zinc-900">{r.label}</h2>
              <div className="flex gap-2">
                <select
                  value={r.status}
                  onChange={(e) =>
                    fetch(`/api/rounds/${r.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: e.target.value }),
                    }).then(() => setRounds((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: e.target.value } : x))))
                  }
                  className="rounded border border-zinc-300 px-2 py-1 text-sm"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                </select>
                <button
                  type="button"
                  onClick={() => addMatchup(r.id, (r.matchups ?? []).length)}
                  className="text-sm text-zinc-600 hover:text-zinc-900"
                >
                  + Matchup
                </button>
                <button
                  type="button"
                  onClick={() => finalizeRound(r.id)}
                  disabled={finalizingRoundId !== null || (r.matchups ?? []).length === 0}
                  className="text-sm text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                >
                  {finalizingRoundId === r.id ? "Finalizing…" : "Finalize & create next round"}
                </button>
                <button type="button" onClick={() => deleteRound(r.id)} className="text-sm text-red-600 hover:text-red-700">
                  Delete round
                </button>
              </div>
            </div>
            <ul className="space-y-2">
              {(r.matchups ?? []).map((m) => {
                const participantIds = getParticipantIds(m);
                return (
                  <li key={m.id} className="flex flex-wrap items-center gap-2 rounded border border-zinc-100 bg-zinc-50 p-2">
                    {participantIds.map((pid, idx) => (
                      <span key={idx} className="flex items-center gap-1">
                        {idx > 0 && <span className="text-zinc-400">vs</span>}
                        <select
                          value={pid ?? ""}
                          onChange={(e) => {
                            const next = [...participantIds];
                            next[idx] = e.target.value || null;
                            updateMatchup(m.id, { participantIds: next });
                          }}
                          className="rounded border border-zinc-300 px-2 py-1 text-sm"
                        >
                          <option value="">TBD</option>
                          {event.participants.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </span>
                    ))}
                    <select
                      value={m.status}
                      onChange={(e) => updateMatchup(m.id, { status: e.target.value })}
                      className="rounded border border-zinc-300 px-2 py-1 text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="live">Live</option>
                      <option value="completed">Completed</option>
                    </select>
                    <input
                      type="datetime-local"
                      value={m.voteEndsAt ? new Date(m.voteEndsAt).toISOString().slice(0, 16) : ""}
                      onChange={(e) =>
                        updateMatchup(m.id, {
                          voteEndsAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                        })
                      }
                      className="rounded border border-zinc-300 px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => deleteMatchup(r.id, m.id)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
