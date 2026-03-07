"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Event = {
  id: string;
  name: string;
  slug: string;
  maxVotesPerUser: number;
  _count: { participants: number; matchups: number };
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-zinc-500">Loading…</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Events</h1>
        <Link
          href="/admin/events/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          New event
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700">Slug</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700">Participants</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700">Matchups</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-zinc-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {events.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  No events yet. Create one to get started.
                </td>
              </tr>
            ) : (
              events.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 font-medium text-zinc-900">{e.name}</td>
                  <td className="px-4 py-3 text-zinc-600">{e.slug}</td>
                  <td className="px-4 py-3 text-zinc-600">{e._count.participants}</td>
                  <td className="px-4 py-3 text-zinc-600">{e._count.matchups}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/events/${e.id}`}
                      className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
