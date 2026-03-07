import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/events"
          className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow"
        >
          <h2 className="font-medium text-zinc-900">Events</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Create and manage events, participants, rounds, and matchups.
          </p>
        </Link>
        <Link
          href="/display/qr"
          className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow"
        >
          <h2 className="font-medium text-zinc-900">QR display</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Show the current matchup QR code for voters to scan.
          </p>
        </Link>
        <Link
          href="/display/bracket"
          className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow"
        >
          <h2 className="font-medium text-zinc-900">Bracket / scoreboard</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Full-screen bracket and live scores for TV/LED.
          </p>
        </Link>
      </div>
    </div>
  );
}
