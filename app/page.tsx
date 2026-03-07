import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6">
      <h1 className="mb-2 text-3xl font-bold text-zinc-900">BeatCon Vote</h1>
      <p className="mb-8 text-zinc-600">Live voting for your event</p>
      <div className="flex flex-col gap-3 text-center">
        <Link
          href="/admin"
          className="rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white hover:bg-zinc-800"
        >
          Admin dashboard
        </Link>
        <p className="text-sm text-zinc-500">
          Voters scan the QR code shown on the display, or use the link from the host.
        </p>
      </div>
    </div>
  );
}
