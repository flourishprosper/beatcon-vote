"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

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
type ProducerSignupRow = {
  id: string;
  participantId: string | null;
  createdAt: string;
  producer: { id: string; stageName: string; slug: string; email: string };
};
type EventDetail = {
  id: string;
  name: string;
  slug: string;
  maxVotesPerUser: number;
  participantsPerMatchup: number;
  advancesPerMatchup: number;
  acceptsProducerRegistration?: boolean;
  description?: string | null;
  venueName?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  eventStartsAt?: string | null;
  eventEndsAt?: string | null;
  participants: Participant[];
  rounds: Round[];
  showState: { currentMatchupId: string | null } | null;
};

const BRACKET_PRESETS = [
  { label: "2 contestants, 1 winner", n: 2, advances: 1 },
  { label: "3 contestants, 1 winner", n: 3, advances: 1 },
  { label: "4 contestants, 1 winner", n: 4, advances: 1 },
] as const;

const TAB_IDS = ["overview", "details", "participants", "rounds", "live"] as const;
type TabId = (typeof TAB_IDS)[number];

function isValidTab(t: string | null): t is TabId {
  return t !== null && TAB_IDS.includes(t as TabId);
}

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
  const [producerSignups, setProducerSignups] = useState<ProducerSignupRow[]>([]);
  const [addingSignupId, setAddingSignupId] = useState<string | null>(null);
  const [acceptsProducerRegistration, setAcceptsProducerRegistration] = useState(false);
  const [savingAcceptsRegistration, setSavingAcceptsRegistration] = useState(false);
  const [eventDetails, setEventDetails] = useState({
    description: "",
    venueName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    eventStartsAt: "",
    eventEndsAt: "",
  });
  const [savingDetails, setSavingDetails] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeTab: TabId = isValidTab(rawTab) ? rawTab : "overview";
  const tabListRef = useRef<HTMLDivElement>(null);

  function setActiveTab(tab: TabId) {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    router.replace(url.pathname + url.search);
  }

  useEffect(() => {
    refetchEvent(id)
      .then((data) => {
        setEvent(data);
        setCurrentMatchupId(data.showState?.currentMatchupId ?? null);
        setParticipantsPerMatchup(data.participantsPerMatchup ?? 2);
        setAdvancesPerMatchup(data.advancesPerMatchup ?? 1);
        setAcceptsProducerRegistration(data.acceptsProducerRegistration ?? false);
        setEventDetails({
          description: data.description ?? "",
          venueName: data.venueName ?? "",
          address: data.address ?? "",
          city: data.city ?? "",
          state: data.state ?? "",
          zip: data.zip ?? "",
          eventStartsAt: data.eventStartsAt ? new Date(data.eventStartsAt).toISOString().slice(0, 16) : "",
          eventEndsAt: data.eventEndsAt ? new Date(data.eventEndsAt).toISOString().slice(0, 16) : "",
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/events/${id}/producer-signups`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setProducerSignups);
  }, [id, event?.participants.length]);

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

  async function toggleAcceptsProducerRegistration() {
    if (!id) return;
    setSavingAcceptsRegistration(true);
    const next = !acceptsProducerRegistration;
    const res = await fetch(`/api/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acceptsProducerRegistration: next }),
    });
    const data = await res.json();
    setSavingAcceptsRegistration(false);
    if (res.ok) {
      setAcceptsProducerRegistration(next);
      setEvent((prev) => (prev ? { ...prev, acceptsProducerRegistration: next } : null));
    }
  }

  async function saveEventDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSavingDetails(true);
    const res = await fetch(`/api/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: eventDetails.description || null,
        venueName: eventDetails.venueName || null,
        address: eventDetails.address || null,
        city: eventDetails.city || null,
        state: eventDetails.state || null,
        zip: eventDetails.zip || null,
        eventStartsAt: eventDetails.eventStartsAt ? new Date(eventDetails.eventStartsAt).toISOString() : null,
        eventEndsAt: eventDetails.eventEndsAt ? new Date(eventDetails.eventEndsAt).toISOString() : null,
      }),
    });
    const data = await res.json();
    setSavingDetails(false);
    if (res.ok) setEvent((prev) => (prev ? { ...prev, ...data } : null));
  }

  async function addSignupToEvent(signupId: string) {
    if (!id) return;
    setAddingSignupId(signupId);
    const res = await fetch(`/api/events/${id}/producer-signups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signupId }),
    });
    const data = await res.json();
    setAddingSignupId(null);
    if (res.ok) {
      setEvent((prev) => (prev ? { ...prev, participants: [...prev.participants, data] } : null));
      setProducerSignups((prev) =>
        prev.map((s) => (s.id === signupId ? { ...s, participantId: data.id } : s))
      );
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

  const tabLabels: Record<TabId, string> = {
    overview: "Overview",
    details: "Event details",
    participants: "Participants",
    rounds: "Rounds",
    live: "Live show",
  };

  function handleTabKeyDown(e: React.KeyboardEvent) {
    const i = TAB_IDS.indexOf(activeTab);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = TAB_IDS[(i + 1) % TAB_IDS.length];
      setActiveTab(next);
      setTimeout(() => document.getElementById(`tab-${next}`)?.focus(), 0);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev = TAB_IDS[(i - 1 + TAB_IDS.length) % TAB_IDS.length];
      setActiveTab(prev);
      setTimeout(() => document.getElementById(`tab-${prev}`)?.focus(), 0);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveTab("overview");
      setTimeout(() => document.getElementById("tab-overview")?.focus(), 0);
    } else if (e.key === "End") {
      e.preventDefault();
      const lastTab = TAB_IDS[TAB_IDS.length - 1];
      setActiveTab(lastTab);
      setTimeout(() => document.getElementById(`tab-${lastTab}`)?.focus(), 0);
    }
  }

  return (
    <div className="space-y-6">
      {/* Persistent header */}
      <div>
        <Link href="/admin/events" className="mb-4 inline-block text-sm text-zinc-600 hover:text-zinc-900">
          ← Events
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900">{event.name}</h1>
        <p className="text-zinc-500">Slug: {event.slug} · Max votes per user: {event.maxVotesPerUser}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/events/${event.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            View public page
          </Link>
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

      {/* Tab bar */}
      <nav
        ref={tabListRef}
        role="tablist"
        aria-label="Event sections"
        className="border-b border-zinc-200"
        onKeyDown={handleTabKeyDown}
      >
        <div className="flex gap-1">
          {TAB_IDS.map((tabId) => (
            <button
              key={tabId}
              type="button"
              role="tab"
              id={`tab-${tabId}`}
              aria-selected={activeTab === tabId}
              aria-controls={`panel-${tabId}`}
              tabIndex={activeTab === tabId ? 0 : -1}
              onClick={() => setActiveTab(tabId)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tabId
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
              }`}
            >
              {tabLabels[tabId]}
            </button>
          ))}
        </div>
      </nav>

      {/* Overview panel */}
      <div
        role="tabpanel"
        id="panel-overview"
        aria-labelledby="tab-overview"
        hidden={activeTab !== "overview"}
        className="space-y-8 pt-4"
      >
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
                <span className="text-zinc-500">Next: create first round (Rounds tab)</span>
              )}
            </li>
            <li className="flex items-center gap-3">
              <span className={step4Done ? "text-emerald-600" : hasRounds ? "text-zinc-700" : "text-zinc-400"}>
                4. Run the show
              </span>
              {step4Done && <span className="text-emerald-600">Done</span>}
              {!step4Done && !hasRounds && (
                <span className="text-zinc-500">Create your first round on the Rounds tab, then choose which matchup is live on Live show.</span>
              )}
              {!step4Done && hasRounds && (
                <span className="text-zinc-500">Next: choose current matchup or start next round (Live show tab)</span>
              )}
            </li>
          </ol>
        </section>

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
      </div>

      {/* Event details panel */}
      <div
        role="tabpanel"
        id="panel-details"
        aria-labelledby="tab-details"
        hidden={activeTab !== "details"}
        className="space-y-8 pt-4"
      >
        <section>
          <h2 className="mb-3 text-lg font-medium text-zinc-900">Location, time & description</h2>
          <p className="mb-4 text-sm text-zinc-600">
            This information appears on the public event page so attendees know when and where the event is.
          </p>
          <form onSubmit={saveEventDetails} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Description</label>
              <textarea
                rows={3}
                value={eventDetails.description}
                onChange={(e) => setEventDetails((d) => ({ ...d, description: e.target.value }))}
                placeholder="What the event is about"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Venue name</label>
              <input
                type="text"
                value={eventDetails.venueName}
                onChange={(e) => setEventDetails((d) => ({ ...d, venueName: e.target.value }))}
                placeholder="Venue or venue name"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Address</label>
              <input
                type="text"
                value={eventDetails.address}
                onChange={(e) => setEventDetails((d) => ({ ...d, address: e.target.value }))}
                placeholder="Street address"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">City</label>
                <input
                  type="text"
                  value={eventDetails.city}
                  onChange={(e) => setEventDetails((d) => ({ ...d, city: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">State</label>
                <input
                  type="text"
                  value={eventDetails.state}
                  onChange={(e) => setEventDetails((d) => ({ ...d, state: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">ZIP</label>
                <input
                  type="text"
                  value={eventDetails.zip}
                  onChange={(e) => setEventDetails((d) => ({ ...d, zip: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Event start</label>
                <input
                  type="datetime-local"
                  value={eventDetails.eventStartsAt}
                  onChange={(e) => setEventDetails((d) => ({ ...d, eventStartsAt: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Event end</label>
                <input
                  type="datetime-local"
                  value={eventDetails.eventEndsAt}
                  onChange={(e) => setEventDetails((d) => ({ ...d, eventEndsAt: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={savingDetails}
              className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50"
            >
              {savingDetails ? "Saving…" : "Save event details"}
            </button>
          </form>
        </section>
      </div>

      {/* Participants panel */}
      <div
        role="tabpanel"
        id="panel-participants"
        aria-labelledby="tab-participants"
        hidden={activeTab !== "participants"}
        className="space-y-8 pt-4"
      >
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
              <p className="mb-2 text-sm font-medium text-amber-900">Add your first participants</p>
              <p className="text-sm text-amber-800">
                Participants are added only from the <strong>Producer signups</strong> section below. Turn on &quot;Accept producer registration&quot; so producers can sign up; then add them to the bracket from that list. You need at least 2 participants to create your first round.
              </p>
              <Link
                href={`/admin/events/${id}/participants`}
                className="mt-3 inline-block text-sm font-medium text-amber-800 underline hover:no-underline"
              >
                Manage participants →
              </Link>
            </div>
          )}
          {event.participants.length === 1 && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/80 p-3">
              <p className="text-sm text-amber-800">
                Add at least one more participant to create matchups. Add them from the <strong>Producer signups</strong> section below.
              </p>
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

        <section>
          <h2 className="mb-3 text-lg font-medium text-zinc-900">Producer signups</h2>
          <p className="mb-3 text-sm text-zinc-600">
            Producers can register for this event when &quot;Accept producer registration&quot; is on. Only people who have signed up can be added as participants; add them to the bracket below.
          </p>
          <label className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={acceptsProducerRegistration}
              onChange={toggleAcceptsProducerRegistration}
              disabled={savingAcceptsRegistration}
              className="rounded border-zinc-300"
            />
            <span className="text-sm font-medium text-zinc-700">Accept producer registration</span>
          </label>
          {producerSignups.length === 0 ? (
            <p className="text-sm text-zinc-500">No producer signups yet.</p>
          ) : (
            <ul className="space-y-2">
              {producerSignups.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white p-3"
                >
                  <div>
                    <span className="font-medium text-zinc-900">{s.producer.stageName}</span>
                    <span className="ml-2 text-sm text-zinc-500">{s.producer.email}</span>
                    <Link
                      href={`/producers/${s.producer.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-sm text-zinc-600 hover:text-zinc-900"
                    >
                      View page
                    </Link>
                  </div>
                  {s.participantId ? (
                    <span className="text-sm text-emerald-600">Added to bracket</span>
                  ) : (
                    <button
                      type="button"
                      disabled={!!addingSignupId}
                      onClick={() => addSignupToEvent(s.id)}
                      className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-white hover:bg-zinc-700 disabled:opacity-50"
                    >
                      {addingSignupId === s.id ? "Adding…" : "Add to event"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Rounds panel */}
      <div
        role="tabpanel"
        id="panel-rounds"
        aria-labelledby="tab-rounds"
        hidden={activeTab !== "rounds"}
        className="space-y-8 pt-4"
      >
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
                <p className="text-zinc-500">Add at least 2 participants first (Participants tab), then create your first round here.</p>
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
      </div>

      {/* Live show panel */}
      <div
        role="tabpanel"
        id="panel-live"
        aria-labelledby="tab-live"
        hidden={activeTab !== "live"}
        className="space-y-8 pt-4"
      >
        <section>
          <h2 className="mb-3 text-lg font-medium text-zinc-900">Flow of show</h2>
          {event.rounds.length === 0 ? (
            <p className="text-sm text-zinc-600">
              Create your first round on the Rounds tab, then you can choose which matchup is shown on the voting screen.
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
      </div>
    </div>
  );
}
