"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

type VoteState = {
  matchup: {
    id: string;
    status: string;
    voteEndsAt: string | null;
    participants: { id: string; name: string }[];
    round: unknown;
  };
  event: { id: string; name: string; maxVotesPerUser: number };
  votingOpen: boolean;
  participantsWithVotes: { participant: { id: string; name: string }; voteCount: number }[];
  signedIn: boolean;
  existingVote: string | null;
  votesUsed: number;
};

function VoteCurrentContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");
  const [currentMatchupId, setCurrentMatchupId] = useState<string | null>(null);
  const [voteState, setVoteState] = useState<VoteState | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [signupRequired, setSignupRequired] = useState(false);
  const [signup, setSignup] = useState({ name: "", email: "", phone: "", contactConsent: false });

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch(`/api/events/${eventId}/public-state`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setCurrentMatchupId(data.currentMatchupId);
      });
    return () => { cancelled = true; };
  }, [eventId]);

  useEffect(() => {
    if (!eventId || !currentMatchupId) {
      setVoteState(null);
      setLoading(!eventId);
      return;
    }
    setLoading(true);
    fetch(`/api/matchups/${currentMatchupId}/vote-state`)
      .then((r) => r.json())
      .then((data) => {
        setVoteState(data);
        setSignupRequired(false);
        setMessage(null);
      })
      .catch(() => setVoteState(null))
      .finally(() => setLoading(false));
  }, [eventId, currentMatchupId]);

  useEffect(() => {
    if (!eventId) return;
    const es = new EventSource(`/api/events/${eventId}/stream`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.currentMatchupId !== undefined) {
          setCurrentMatchupId(data.currentMatchupId);
        }
      } catch (_) {}
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, [eventId]);

  async function submitVote(
    participantId: string,
    opts?: { name?: string; email?: string; phone?: string; contactConsent?: boolean }
  ) {
    if (!voteState || !currentMatchupId) return;
    setVoting(true);
    setMessage(null);
    const res = await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchupId: currentMatchupId,
        participantId,
        contactConsent: signup.contactConsent,
        ...opts,
      }),
    });
    const data = await res.json();
    setVoting(false);
    if (res.ok) {
      setMessage({ type: "success", text: "Vote recorded. Thanks!" });
      setSignupRequired(false);
      fetch(`/api/matchups/${currentMatchupId}/vote-state`)
        .then((r) => r.json())
        .then(setVoteState);
    } else {
      if (data.error === "Signup required") {
        setSignupRequired(true);
      }
      setMessage({ type: "error", text: data.error ?? "Something went wrong" });
    }
  }

  function handleVote(participantId: string) {
    if (signupRequired && signup.name && signup.email && signup.phone) {
      submitVote(participantId, {
        name: signup.name,
        email: signup.email,
        phone: signup.phone,
        contactConsent: signup.contactConsent,
      });
    } else if (!signupRequired) {
      submitVote(participantId);
    } else {
      setSignupRequired(true);
      setMessage({ type: "error", text: "Please enter your name, email, and phone to vote." });
    }
  }

  if (!eventId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
        <p className="text-zinc-600">Missing event. Use the QR code from the display.</p>
      </div>
    );
  }

  if (loading && !voteState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
        <p className="text-zinc-600">Loading…</p>
      </div>
    );
  }

  if (!currentMatchupId || !voteState) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 text-center">
        <p className="text-zinc-600">No matchup is open for voting right now.</p>
        <p className="mt-2 text-sm text-zinc-500">Check back when the host starts the next round.</p>
      </div>
    );
  }

  const participants = voteState.matchup.participants ?? [];
  const canVote = voteState.votingOpen && !voting;
  const participantsWithVotes = voteState.participantsWithVotes ?? [];

  return (
    <div className="min-h-screen bg-zinc-50 p-4">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-1 text-xl font-semibold text-zinc-900">{voteState.event.name}</h1>
        <p className="mb-6 text-zinc-500">
          {participants.map((p) => p?.name ?? "TBD").join(" vs ") || "TBD"}
        </p>

        {message && (
          <div
            className={`mb-4 rounded-lg px-4 py-2 ${
              message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {signupRequired && (
          <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4">
            <p className="mb-3 font-medium text-zinc-900">Enter your details to vote</p>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Name"
                value={signup.name}
                onChange={(e) => setSignup((s) => ({ ...s, name: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2"
              />
              <input
                type="email"
                placeholder="Email"
                value={signup.email}
                onChange={(e) => setSignup((s) => ({ ...s, email: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={signup.phone}
                onChange={(e) => setSignup((s) => ({ ...s, phone: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2"
              />
              <label className="flex items-center gap-2 text-sm text-zinc-600">
                <input
                  type="checkbox"
                  checked={signup.contactConsent}
                  onChange={(e) => setSignup((s) => ({ ...s, contactConsent: e.target.checked }))}
                  className="rounded border-zinc-300"
                />
                Contact me about future events
              </label>
            </div>
          </div>
        )}

        {!voteState.votingOpen && (
          <p className="mb-4 text-amber-700">Voting is closed for this matchup.</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {participantsWithVotes.map(({ participant, voteCount }) => (
            <button
              key={participant.id}
              type="button"
              onClick={() => handleVote(participant.id)}
              disabled={!canVote}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-400 hover:shadow disabled:opacity-50"
            >
              <span className="text-lg font-medium text-zinc-900">{participant.name}</span>
              {voteState.votingOpen && (
                <span className="mt-1 text-sm text-zinc-500">{voteCount} votes</span>
              )}
            </button>
          ))}
        </div>

        {voteState.matchup.voteEndsAt && voteState.votingOpen && (
          <p className="mt-4 text-center text-sm text-zinc-500">
            Voting ends {new Date(voteState.matchup.voteEndsAt).toLocaleString()}
          </p>
        )}

        <p className="mt-8 text-center text-sm text-zinc-500">
          <Link href="/" className="underline">Back to home</Link>
        </p>
      </div>
    </div>
  );
}

export default function VoteCurrentPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
        <p className="text-zinc-600">Loading…</p>
      </div>
    }>
      <VoteCurrentContent />
    </Suspense>
  );
}
