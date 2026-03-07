"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

type Participant = { id: string; name: string; imageUrl: string | null; seed: number | null };
type Matchup = {
  id: string;
  orderInRound: number;
  status: string;
  voteEndsAt: string | null;
  participants: { participant: Participant }[];
};
type Round = {
  id: string;
  roundIndex: number;
  label: string;
  status: string;
  resultsVisible: boolean;
  matchups: Matchup[];
};
type EventDetail = {
  id: string;
  name: string;
  slug: string;
  maxVotesPerUser: number;
  participantsPerMatchup: number;
  advancesPerMatchup: number;
  participants: Participant[];
  rounds: Round[];
  showState: { currentMatchupId: string | null } | null;
};

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMatchupId, setCurrentMatchupId] = useState<string | null>(null);
  const [savingShow, setSavingShow] = useState(false);
  const [participantsPerMatchup, setParticipantsPerMatchup] = useState(2);
  const [advancesPerMatchup, setAdvancesPerMatchup] = useState(1);
  const [savingBracket, setSavingBracket] = useState(false);
  const [startingNext, setStartingNext] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setEvent(data);
        setCurrentMatchupId(data.showState?.currentMatchupId ?? null);
        setParticipantsPerMatchup(data.participantsPerMatchup ?? 2);
        setAdvancesPerMatchup(data.advancesPerMatchup ?? 1);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function setCurrentMatchup(matchupId: string | null) {
    if (!id) return;
    setSavingShow(true);
    await fetch(`/api/events/${id}/show-state`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentMatchupId: matchupId }),
    });
    setCurrentMatchupId(matchupId);
    setEvent((e) => (e ? { ...e, showState: { ...e.showState, currentMatchupId: matchupId } } : null));
    setSavingShow(false);
  }

  async function startNextRound() {
    if (!id) return;
    setFlowError(null);
    setStartingNext(true);
    try {
      const res = await fetch(`/api/events/${id}/show-state/start-next-round`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCurrentMatchupId(data.currentMatchupId);
        const updated = await fetch(`/api/events/${id}`, { credentials: "include" }).then((r) => r.json());
        setEvent(updated);
        if (updated.showState?.currentMatchupId != null) {
          setCurrentMatchupId(updated.showState.currentMatchupId);
        }
      } else {
        setFlowError(data?.error ?? "Failed to start next round");
      }
    } finally {
      setStartingNext(false);
    }
  }

  async function saveBracketSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSavingBracket(true);
    const res = await fetch(`/api/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participantsPerMatchup: Number(participantsPerMatchup),
        advancesPerMatchup: Number(advancesPerMatchup),
      }),
    });
    const data = await res.json();
    if (res.ok) setEvent((prev) => (prev ? { ...prev, ...data } : null));
    setSavingBracket(false);
  }

  if (loading || !event) return <div className="text-zinc-500">Loading…</div>;

  const allMatchups = event.rounds.flatMap((r) => r.matchups);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/events" className="mb-4 inline-block text-sm text-zinc-600 hover:text-zinc-900">
          ← Events
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900">{event.name}</h1>
        <p className="text-zinc-500">Slug: {event.slug} · Max votes per user: {event.maxVotesPerUser}</p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium text-zinc-900">Bracket settings</h2>
        <form onSubmit={saveBracketSettings} className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Participants per matchup</label>
            <input
              type="number"
              min={2}
              value={participantsPerMatchup}
              onChange={(e) => setParticipantsPerMatchup(Number(e.target.value))}
              className="w-24 rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Advances per matchup</label>
            <input
              type="number"
              min={1}
              value={advancesPerMatchup}
              onChange={(e) => setAdvancesPerMatchup(Number(e.target.value))}
              className="w-24 rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <button
            type="submit"
            disabled={savingBracket}
            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            {savingBracket ? "Saving…" : "Save"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-zinc-900">Flow of show</h2>
        <p className="mb-2 text-sm text-zinc-600">
          Set the current matchup to control what appears on the QR display and voter page. &quot;Start next round&quot; makes the first <strong>upcoming</strong> round live and switches to its first matchup—create that round first on the Rounds page with &quot;Finalize & create next round&quot;.
        </p>
        {flowError && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {flowError}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={currentMatchupId ?? ""}
            onChange={(e) => {
              setFlowError(null);
              setCurrentMatchup(e.target.value || null);
            }}
            disabled={savingShow}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
          >
            <option value="">— No current matchup —</option>
            {allMatchups.map((m) => (
              <option key={m.id} value={m.id}>
                {(m.participants ?? []).map((mp) => mp.participant?.name ?? "TBD").join(" vs ") || "TBD"}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={startNextRound}
            disabled={savingShow || startingNext}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            {startingNext ? "Starting…" : "Start next round"}
          </button>
          {savingShow && <span className="text-sm text-zinc-500">Saving…</span>}
        </div>
        {!event.rounds.some((r) => r.status === "upcoming") && event.rounds.length > 0 && (
          <p className="mt-2 text-sm text-zinc-500">No upcoming round in this view. If you just created one on the Rounds page, click &quot;Start next round&quot; to try again (it will load the latest data). Otherwise use &quot;Finalize & create next round&quot; to add a new round.</p>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-zinc-900">Participants</h2>
          <Link
            href={`/admin/events/${id}/participants`}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            Manage
          </Link>
        </div>
        <ul className="list-inside list-disc text-zinc-600">
          {event.participants.length === 0
            ? "No participants yet."
            : event.participants.map((p) => (
                <li key={p.id}>
                  {p.name}
                  {p.seed != null ? ` (seed ${p.seed})` : ""}
                </li>
              ))}
        </ul>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-zinc-900">Rounds & matchups</h2>
          <Link
            href={`/admin/events/${id}/rounds`}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            Manage
          </Link>
        </div>
        <div className="space-y-4">
          {event.rounds.length === 0 ? (
            <p className="text-zinc-500">No rounds yet. Add rounds and matchups.</p>
          ) : (
            event.rounds.map((r) => (
              <div key={r.id} className="rounded-lg border border-zinc-200 bg-white p-4">
                <h3 className="font-medium text-zinc-900">
                  {r.label} <span className="text-zinc-500">({r.status})</span>
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-zinc-600">
                  {r.matchups.map((m) => (
                    <li key={m.id}>
                      {(m.participants ?? []).map((mp) => mp.participant?.name ?? "TBD").join(" vs ") || "TBD"}
                      {m.id === currentMatchupId && " ← current"}
                      {m.voteEndsAt && ` · Voting ends ${new Date(m.voteEndsAt).toLocaleString()}`}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/display/qr?eventId=${id}`}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800"
        >
          Open QR display
        </Link>
        <Link
          href={`/display/bracket?eventId=${id}`}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          Open bracket display
        </Link>
        <a
          href={`/api/events/${id}/export`}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          download
        >
          Export results (CSV)
        </a>
      </div>
    </div>
  );
}
