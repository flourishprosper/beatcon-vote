"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

type State = {
  event?: { name: string };
  currentMatchup?: {
    id: string;
    participants: { participant: { name: string } }[];
  } | null;
  currentMatchupId?: string | null;
};

function QRContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");
  const [state, setState] = useState<State>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const fetchState = () => {
      fetch(`/api/events/${eventId}/public-state`)
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled) setState(data);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    fetchState();

    const es = new EventSource(`/api/events/${eventId}/stream`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "state" && !cancelled) {
          setState({
            event: data.event,
            currentMatchup: data.currentMatchup,
            currentMatchupId: data.currentMatchupId,
          });
        } else if ((data.type === "showState" || data.type === "vote") && !cancelled) {
          fetchState();
        }
      } catch (_) {}
    };
    es.onerror = () => es.close();
    return () => {
      cancelled = true;
      es.close();
    };
  }, [eventId]);

  if (!eventId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
        <p className="text-2xl font-bold">Add ?eventId=... to the URL</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
        <p className="text-3xl font-bold">Loading…</p>
      </div>
    );
  }

  const matchup = state.currentMatchup;
  const voteUrl = typeof window !== "undefined" ? `${window.location.origin}/vote/current?eventId=${eventId}` : "";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-900 p-8 text-white">
      <h1 className="mb-2 text-center text-4xl font-bold md:text-5xl">{state.event?.name ?? "Vote"}</h1>
      {matchup ? (
        <p className="mb-6 text-center text-2xl font-bold text-white md:text-3xl">
          {(matchup.participants ?? []).map((mp) => mp.participant?.name ?? "TBD").join(" vs ") || "TBD"}
        </p>
      ) : (
        <p className="mb-6 text-xl font-bold text-zinc-400">No current matchup</p>
      )}
      <div className="mb-6 rounded-xl bg-white p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/events/${eventId}/qr`}
          alt="QR code to vote"
          width={320}
          height={320}
          className="rounded-lg"
        />
      </div>
      <p className="text-2xl font-bold text-white">Scan to vote</p>
      {voteUrl && (
        <p className="mt-2 max-w-md truncate text-center text-base font-medium text-zinc-500">{voteUrl}</p>
      )}
    </div>
  );
}

export default function QRDisplayPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
        <p className="text-3xl font-bold">Loading…</p>
      </div>
    }>
      <QRContent />
    </Suspense>
  );
}
