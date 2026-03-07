"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Signup = {
  id: string;
  eventId: string;
  createdAt: string;
  event: { id: string; name: string; slug: string };
};

type OpenEvent = { id: string; name: string; slug: string };

export default function ProducerEventsPage() {
  const [profile, setProfile] = useState<{ slug: string } | null>(null);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [openEvents, setOpenEvents] = useState<OpenEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningEventId, setJoiningEventId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/producer/profile").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/producer/events").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/events/open").then((r) => (r.ok ? r.json() : [])),
    ]).then(([p, s, e]) => {
      setProfile(p ?? null);
      setSignups(Array.isArray(s) ? s : []);
      setOpenEvents(Array.isArray(e) ? e : []);
    }).finally(() => setLoading(false));
  }, []);

  async function joinEvent(eventId: string) {
    setJoiningEventId(eventId);
    setMessage(null);
    const res = await fetch("/api/producer/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        agreeRules: true,
        agreeOriginal: true,
        agreeTimeLimits: true,
      }),
    });
    const data = await res.json();
    setJoiningEventId(null);
    if (res.ok) {
      setSignups((prev) => [data, ...prev]);
      setMessage({ type: "success", text: "You are now registered for this event." });
    } else {
      setMessage({ type: "error", text: data.error ?? "Could not join event." });
    }
  }

  const alreadySignedUpIds = new Set(signups.map((s) => s.eventId));

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-zinc-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">My events</h1>
      {message && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 ${
            message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}
      <div className="space-y-6">
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-medium text-zinc-900">My events</h2>
          {signups.length === 0 ? (
            <p className="text-sm text-zinc-500">You haven’t joined any events yet.</p>
          ) : (
            <ul className="space-y-2">
              {signups.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-lg border border-zinc-100 p-3">
                  <span className="font-medium text-zinc-900">{s.event.name}</span>
                  {profile?.slug && (
                    <Link
                      href={`/producers/${profile.slug}`}
                      className="text-sm text-zinc-600 hover:text-zinc-900"
                    >
                      View my page
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-medium text-zinc-900">Join another event</h2>
          {openEvents.filter((e) => !alreadySignedUpIds.has(e.id)).length === 0 ? (
            <p className="text-sm text-zinc-500">
              No events are currently open for registration, or you’ve already joined all of them.
            </p>
          ) : (
            <ul className="space-y-2">
              {openEvents
                .filter((e) => !alreadySignedUpIds.has(e.id))
                .map((ev) => (
                  <li
                    key={ev.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-100 p-3"
                  >
                    <span className="font-medium text-zinc-900">{ev.name}</span>
                    <button
                      type="button"
                      disabled={joiningEventId === ev.id}
                      onClick={() => joinEvent(ev.id)}
                      className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                    >
                      {joiningEventId === ev.id ? "Joining…" : "Join"}
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>
      <p className="mt-6 text-sm text-zinc-500">
        <Link href="/" className="underline hover:text-zinc-700">Back to home</Link>
      </p>
    </main>
  );
}
