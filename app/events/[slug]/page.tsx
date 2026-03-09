import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getProxiedImageUrl } from "@/lib/spaces";

type Props = { params: Promise<{ slug: string }> };

function formatDateTime(iso: string | Date | null): string {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export default async function PublicEventPage({ params }: Props) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      venueName: true,
      address: true,
      city: true,
      state: true,
      zip: true,
      eventStartsAt: true,
      eventEndsAt: true,
      participants: {
        select: { id: true, name: true, imageUrl: true },
      },
    },
  });
  if (!event) notFound();

  const signups = await prisma.producerEventSignup.findMany({
    where: { eventId: event.id, participantId: { not: null } },
    select: { participantId: true, producer: { select: { slug: true } } },
  });
  const participantIdToSlug = new Map<string, string>();
  for (const s of signups) {
    if (s.participantId) participantIdToSlug.set(s.participantId, s.producer.slug);
  }

  const hasWhen = event.eventStartsAt != null;
  const hasWhere =
    [event.venueName, event.address, event.city, event.state, event.zip].filter(Boolean).length > 0;
  const cityStateZip = [event.city, [event.state, event.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const addressLines = [event.address, cityStateZip].filter(Boolean);

  return (
    <div className="min-h-screen bg-zinc-50 p-4 py-8">
      <div className="mx-auto max-w-3xl">
        <p className="mb-6 text-sm text-zinc-500">
          <Link href="/" className="underline hover:text-zinc-700">
            BeatCon Vote
          </Link>
          {" / "}
          <Link href="/" className="underline hover:text-zinc-700">
            Events
          </Link>
          {" / "}
          <span className="text-zinc-700">{event.name}</span>
        </p>

        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
          <header className="border-b border-zinc-200 p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-zinc-900">{event.name}</h1>
            {event.description && (
              <p className="mt-3 text-zinc-600 whitespace-pre-wrap">{event.description}</p>
            )}
          </header>

          {(hasWhen || hasWhere) && (
            <section className="border-b border-zinc-200 p-6 sm:p-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                When &amp; where
              </h2>
              {hasWhen && (
                <p className="mt-2 text-zinc-900">
                  {event.eventStartsAt && formatDateTime(event.eventStartsAt)}
                  {event.eventEndsAt && (
                    <span> – {formatDateTime(event.eventEndsAt)}</span>
                  )}
                </p>
              )}
              {hasWhere && (
                <div className="mt-3 text-zinc-700">
                  {event.venueName && <p className="font-medium text-zinc-900">{event.venueName}</p>}
                  {addressLines.length > 0 && (
                    <p className="mt-0.5">{addressLines.join(", ")}</p>
                  )}
                </div>
              )}
            </section>
          )}

          <section className="p-6 sm:p-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Participants
            </h2>
            {event.participants.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">No participants yet.</p>
            ) : (
              <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
                {event.participants.map((p) => {
                  const producerSlug = participantIdToSlug.get(p.id);
                  const content = (
                    <>
                      <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100">
                        {p.imageUrl ? (
                          <img
                            src={getProxiedImageUrl(p.imageUrl) ?? p.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-3xl font-bold text-zinc-300">
                            {p.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-center text-sm font-medium text-zinc-900">{p.name}</p>
                    </>
                  );
                  return (
                    <li key={p.id}>
                      {producerSlug ? (
                        <Link
                          href={`/producers/${producerSlug}`}
                          className="block rounded-xl border border-zinc-200 p-3 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
                        >
                          {content}
                        </Link>
                      ) : (
                        <div className="block rounded-xl border border-zinc-200 p-3">{content}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <p className="mt-8 text-center text-sm text-zinc-500">
          <Link href="/" className="underline hover:text-zinc-700">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
