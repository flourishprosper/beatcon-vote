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

const BRACKET_PRESETS = [
  { label: "2 contestants, 1 winner", n: 2, advances: 1 },
  { label: "3 contestants, 1 winner", n: 3, advances: 1 },
  { label: "4 contestants, 1 winner", n: 4, advances: 1 },
] as const;

function refetchEvent(id: string): Promise<EventDetail> {
  return fetch(`/api/events/${id}`).then((r) => r.json());
}

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
  const [generatingFirst, setGeneratingFirst] = useState(false);
  const [firstRoundError, setFirstRoundError] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState("");
  const [participantSeed, setParticipantSeed] = useState("");
  const [addingParticipant, setAddingParticipant] = useState(false);

  useEffect(() => {
    refetchEvent(id)
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
        const updated = await refetchEvent(id);
        setEvent(updated);
        if (updated.showState?.currentMatchupId != null) {
          setCurrentMatchupId(updated.showState.currentMatchupId);
        }
      } else {
        const friendlyNoRound =
          "No upcoming round. On the Rounds page, use \"Create next round from winners\" on the current round to add the next round.";
        setFlowError(
          data?.error && String(data.error).toLowerCase().includes("no upcoming round")
            ? friendlyNoRound
            : data?.error ?? "Failed to start next round"
        );
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

  async function createFirstRound() {
    if (!id) return;
    setFirstRoundError(null);
    setGeneratingFirst(true);
    try {
      const res = await fetch(`/api/events/${id}/rounds/generate-initial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: "Round 1" }),
      });
      const data = await res.json();
      if (res.ok) {
        const updated = await refetchEvent(id);
        setEvent(updated);
      } else {
        setFirstRoundError(data?.error ?? "Failed to create first round");
      }
    } finally {
      setGeneratingFirst(false);
    }
  }

  async function addParticipantInline(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setAddingParticipant(true);
    const res = await fetch(`/api/events/${id}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: participantName.trim(),
        seed: participantSeed ? Number(participantSeed) : null,
      }),
    });
    const data = await res.json();
    setAddingParticipant(false);
    if (res.ok) {
      setEvent((prev) => (prev ? { ...prev, participants: [...prev.participants, data] } : null));
      setParticipantName("");
      setParticipantSeed("");
    }
  }

  if (loading || !event) return <div className="text-zinc-500">Loading…</div>;

  const participantCount = event.participants.length;
  const hasEnoughParticipants = participantCount >= 2;
  const hasRounds = event.rounds.length > 0;
  const hasUpcomingRound = event.rounds.some((r) => r.status === "upcoming");
  const step1Done = true;
  const step2Done = hasEnoughParticipants;
  const step3Done = hasRounds;
  const step4Done = !!event.showState?.currentMatchupId || event.rounds.some((r) => r.status === "live");

  const matchupsByRound = event.rounds.map((r) => ({
    round: r,
    matchups: r.matchups,
  }));

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/events" className="mb-4 inline-block text-sm text-zinc-600 hover:text-zinc-900">
          ← Events
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900">{event.name}</h1>
        <p className="text-zinc-500">Slug: {event.slug} · Max votes per user: {event.maxVotesPerUser}</p>
      </div>

      {/* Setup checklist */}
      <section className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">Setup</h2>
        <ol className="space-y-2 text-sm">
          <li className="flex items-center gap-3">
            <span className={step1Done ? "text-emerald-600" : "text-zinc-400"}>
              {step1Done ? "1. Bracket settings" : "1. Bracket settings"}
            </span>
            {step1Done && <span className="text-emerald-600">Done</span>}
            {!step1Done && <span className="text-zinc-500">Next: set contestants per matchup and how many advance</span>}
          </li>
          <li className="flex items-center gap-3">
            <span className={step2Done ? "text-emerald-600" : "text-zinc-700"}>2. Participants</span>
            {step2Done && <span className="text-emerald-600">Done</span>}
            {!step2Done && (
              <span className="text-zinc-500">
                Next: add at least 2 participants
                {participantCount === 1 && " (one more)"}
              </span>
            )}
          </li>
          <li className="flex items-center gap-3">
            <span className={step3Done ? "text-emerald-600" : hasEnoughParticipants ? "text-zinc-700" : "text-zinc-400"}>
              3. First round
            </span>
            {step3Done && <span className="text-emerald-600">Done</span>}
            {!step3Done && !hasEnoughParticipants && (
              <span className="text-zinc-500">Blocked: add at least 2 participants first</span>
            )}
            {!step3Done && hasEnoughParticipants && (
              <span className="text-zinc-500">Next: create first round (below)</span>
            )}
          </li>
          <li className="flex items-center gap-3">
            <span className={step4Done ? "text-emerald-600" : hasRounds ? "text-zinc-700" : "text-zinc-400"}>
              4. Run the show
            </span>
            {step4Done && <span className="text-emerald-600">Done</span>}
            {!step4Done && !hasRounds && (
              <span className="text-zinc-500">Create your first round above, then choose which matchup is live</span>
            )}
            {!step4Done && hasRounds && (
              <span className="text-zinc-500">Next: choose current matchup or start next round</span>
            )}
          </li>
        </ol>
      </section>

      {/* 1. Bracket settings */}
      <section>
        <h2 className="mb-3 text-lg font-medium text-zinc-900">Bracket settings</h2>
        <p className="mb-3 text-sm text-zinc-600">
          Each matchup has this many contestants (e.g. 2 for head-to-head). This many advance to the next round (e.g.
          1 winner).
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          {BRACKET_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setParticipantsPerMatchup(preset.n);
                setAdvancesPerMatchup(preset.advances);
              }}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                participantsPerMatchup === preset.n && advancesPerMatchup === preset.advances
                  ? "border-zinc-800 bg-zinc-800 text-white"
                  : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
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

      {/* 2. Participants */}
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
        {event.participants.length === 0 && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/80 p-4">
            <p className="mb-3 text-sm font-medium text-amber-900">Add your first participants</p>
            <p className="mb-3 text-sm text-amber-800">
              These are the contestants that will appear in matchups. Add at least 2 to create your first round.
            </p>
            <form onSubmit={addParticipantInline} className="mb-3 flex flex-wrap items-end gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Name</label>
                <input
                  type="text"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  required
                  placeholder="Contestant name"
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Seed (optional)</label>
                <input
                  type="number"
                  min={1}
                  value={participantSeed}
                  onChange={(e) => setParticipantSeed(e.target.value)}
                  placeholder="—"
                  className="w-20 rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                />
              </div>
              <button
                type="submit"
                disabled={addingParticipant}
                className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50"
              >
                {addingParticipant ? "Adding…" : "Add"}
              </button>
            </form>
            <Link
              href={`/admin/events/${id}/participants`}
              className="text-sm font-medium text-amber-800 underline hover:no-underline"
            >
              Or manage all participants →
            </Link>
          </div>
        )}
        {event.participants.length === 1 && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/80 p-3">
            <p className="text-sm text-amber-800">Add at least one more participant to create matchups.</p>
            <form onSubmit={addParticipantInline} className="mt-2 flex flex-wrap items-end gap-2">
              <input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                required
                placeholder="Name"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
              />
              <input
                type="number"
                min={1}
                value={participantSeed}
                onChange={(e) => setParticipantSeed(e.target.value)}
                placeholder="Seed (optional)"
                className="w-24 rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
              />
              <button
                type="submit"
                disabled={addingParticipant}
                className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50"
              >
                {addingParticipant ? "Adding…" : "Add"}
              </button>
            </form>
          </div>
        )}
        {event.participants.length > 0 && (
          <ul className="list-inside list-disc text-zinc-600">
            {event.participants.map((p) => (
              <li key={p.id}>
                {p.name}
                {p.seed != null ? ` (seed ${p.seed})` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 3. Rounds & matchups + Create first round */}
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
        {event.rounds.length === 0 && (
          <>
            {hasEnoughParticipants && (
              <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-4">
                <p className="mb-2 text-sm text-zinc-700">
                  Create your first round by randomly shuffling all {event.participants.length} participants into
                  matchups of {event.participantsPerMatchup}.
                </p>
                {firstRoundError && (
                  <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    {firstRoundError}
                  </div>
                )}
                <button
                  type="button"
                  onClick={createFirstRound}
                  disabled={generatingFirst}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {generatingFirst ? "Creating…" : "Create first round"}
                </button>
              </div>
            )}
            {!hasEnoughParticipants && (
              <p className="text-zinc-500">Add at least 2 participants first, then create your first round here.</p>
            )}
          </>
        )}
        {event.rounds.length > 0 && (
          <div className="space-y-4">
            {event.rounds.map((r) => (
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
            ))}
          </div>
        )}
      </section>

      {/* 4. Flow of show */}
      <section>
        <h2 className="mb-3 text-lg font-medium text-zinc-900">Flow of show</h2>
        {event.rounds.length === 0 ? (
          <p className="text-sm text-zinc-600">
            Create your first round above, then you can choose which matchup is shown on the voting screen.
          </p>
        ) : (
          <>
            <p className="mb-2 text-sm text-zinc-600">
              Choose which matchup appears on the QR and voter page. Use &quot;Start next round&quot; to move to the
              first matchup of the next upcoming round.
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
                className="min-w-[200px] rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
              >
                <option value="">— No current matchup —</option>
                {matchupsByRound.map(({ round, matchups }) => (
                  <optgroup key={round.id} label={round.label}>
                    {matchups.map((m) => (
                      <option key={m.id} value={m.id}>
                        {(m.participants ?? []).map((mp) => mp.participant?.name ?? "TBD").join(" vs ") || "TBD"}
                      </option>
                    ))}
                  </optgroup>
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
            {!hasUpcomingRound && event.rounds.length > 0 && (
              <p className="mt-2 text-sm text-zinc-500">
                No upcoming round. On the{" "}
                <Link href={`/admin/events/${id}/rounds`} className="font-medium text-zinc-700 underline">
                  Rounds page
                </Link>
                , use &quot;Create next round from winners&quot; on the current round to add the next round.
              </p>
            )}
          </>
        )}
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
