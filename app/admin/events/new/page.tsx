"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewEventPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [maxVotesPerUser, setMaxVotesPerUser] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function slugFromName() {
    setSlug(
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, maxVotesPerUser }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to create event");
      return;
    }
    router.push(`/admin/events/${data.id}`);
  }

  return (
    <div>
      <Link href="/admin/events" className="mb-4 inline-block text-sm text-zinc-600 hover:text-zinc-900">
        ← Events
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">New event</h1>
      <form onSubmit={onSubmit} className="max-w-md space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-zinc-700">
            Event name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={slugFromName}
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
          />
        </div>
        <div>
          <label htmlFor="slug" className="mb-1 block text-sm font-medium text-zinc-700">
            Slug (URL-friendly)
          </label>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            pattern="^[a-z0-9-]+$"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
          />
        </div>
        <div>
          <label htmlFor="maxVotes" className="mb-1 block text-sm font-medium text-zinc-700">
            Max votes per user (per matchup)
          </label>
          <input
            id="maxVotes"
            type="number"
            min={1}
            value={maxVotesPerUser}
            onChange={(e) => setMaxVotesPerUser(Number(e.target.value))}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create event"}
          </button>
          <Link
            href="/admin/events"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </Link>
        </div>
        <p className="mt-4 text-sm text-zinc-500">
          Next: set bracket settings and add participants on the event page.
        </p>
      </form>
    </div>
  );
}
