"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

type Matchup = {
  id: string;
  orderInRound: number;
  status: string;
  voteEndsAt: string | null;
  participantsWithVotes: { participant: { id: string; name: string } | null; voteCount: number }[];
};
type Round = {
  id: string;
  roundIndex: number;
  label: string;
  status: string;
  matchups: Matchup[];
};
type Bracket = {
  event: { id: string; name: string };
  currentMatchupId: string | null;
  rounds: Round[];
};

function BracketContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");
  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBracket = () => {
    if (!eventId) return;
    fetch(`/api/events/${eventId}/bracket`)
      .then((r) => r.json())
      .then(setBracket)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBracket();
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    const es = new EventSource(`/api/events/${eventId}/stream`);
    es.onmessage = () => fetchBracket();
    es.onerror = () => es.close();
    return () => es.close();
  }, [eventId]);

  useEffect(() => {
    const t = setInterval(fetchBracket, 5000);
    return () => clearInterval(t);
  }, [eventId]);

  if (!eventId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
        <p className="text-2xl">Add ?eventId=... to the URL</p>
      </div>
    );
  }

  if (loading || !bracket) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
        <p className="text-2xl">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 p-6 text-white">
      <h1 className="mb-8 text-center text-3xl font-bold md:text-4xl">{bracket.event.name}</h1>

      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3">
        {bracket.rounds.map((round) => (
          <div key={round.id} className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
            <h2 className="mb-4 text-center text-xl font-semibold text-zinc-200">{round.label}</h2>
            <div className="space-y-3">
              {round.matchups.map((m) => {
                const isCurrent = m.id === bracket.currentMatchupId;
                return (
                  <div
                    key={m.id}
                    className={`rounded-lg border-2 p-3 ${
                      isCurrent ? "border-amber-500 bg-amber-500/10" : "border-zinc-600 bg-zinc-800"
                    }`}
                  >
                    {(m.participantsWithVotes ?? []).map((pv, i) => (
                    <div key={pv.participant?.id ?? i}>
                      {i > 0 && <div className="my-1 text-center text-zinc-500">vs</div>}
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">
                          {pv.participant?.name ?? "TBD"}
                        </span>
                        <span className="text-lg font-bold text-amber-400">{pv.voteCount}</span>
                      </div>
                    </div>
                  ))}
                    {isCurrent && (
                      <p className="mt-2 text-center text-xs font-medium uppercase tracking-wide text-amber-400">
                        Voting open
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-zinc-500">
        Updates automatically. For full-screen, use your browser’s fullscreen mode (F11).
      </p>
    </div>
  );
}

export default function BracketDisplayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
          <p className="text-2xl">Loading…</p>
        </div>
      }
    >
      <BracketContent />
    </Suspense>
  );
}
