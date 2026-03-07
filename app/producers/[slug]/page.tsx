import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";

type Props = { params: Promise<{ slug: string }> };

export default async function ProducerPublicPage({ params }: Props) {
  const { slug } = await params;
  const producer = await prisma.producer.findUnique({
    where: { slug },
    select: {
      stageName: true,
      fullName: true,
      genre: true,
      productionStyle: true,
      imageUrl: true,
      cityState: true,
      yearsProducing: true,
      instagramHandle: true,
      bio: true,
      spotifyUrl: true,
      appleMusicUrl: true,
      websiteUrl: true,
      soundCloudUrl: true,
      twitterHandle: true,
      eventSignups: {
        include: { event: { select: { id: true, name: true, slug: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!producer) notFound();

  const events = producer.eventSignups;
  const hasLinks =
    producer.spotifyUrl ||
    producer.appleMusicUrl ||
    producer.websiteUrl ||
    producer.soundCloudUrl ||
    producer.twitterHandle;

  return (
    <div className="min-h-screen bg-zinc-50 p-4 py-8">
      <div className="mx-auto max-w-lg">
        <p className="mb-6 text-sm text-zinc-500">
          <Link href="/" className="underline">BeatCon Vote</Link>
          {" / "}
          <span className="text-zinc-700">Producer</span>
        </p>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          {producer.imageUrl && (
            <div className="mb-4 flex justify-center">
              <img
                src={producer.imageUrl}
                alt={producer.stageName}
                className="h-32 w-32 rounded-full object-cover"
              />
            </div>
          )}
          <h1 className="text-3xl font-bold text-zinc-900">{producer.stageName}</h1>
          {producer.fullName && producer.fullName !== producer.stageName && (
            <p className="mt-1 text-zinc-600">{producer.fullName}</p>
          )}
          {producer.productionStyle && (
            <p className="mt-3 text-lg font-medium text-zinc-700">&ldquo;{producer.productionStyle}&rdquo;</p>
          )}
          {producer.bio && (
            <p className="mt-4 text-zinc-600 whitespace-pre-wrap">{producer.bio}</p>
          )}
          {hasLinks && (
            <div className="mt-4 flex flex-wrap gap-2">
              {producer.spotifyUrl && (
                <a
                  href={producer.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
                >
                  Spotify
                </a>
              )}
              {producer.appleMusicUrl && (
                <a
                  href={producer.appleMusicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
                >
                  Apple Music
                </a>
              )}
              {producer.websiteUrl && (
                <a
                  href={producer.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
                >
                  Website
                </a>
              )}
              {producer.soundCloudUrl && (
                <a
                  href={producer.soundCloudUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
                >
                  SoundCloud
                </a>
              )}
              {producer.twitterHandle && (
                <a
                  href={`https://x.com/${producer.twitterHandle.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
                >
                  X / Twitter
                </a>
              )}
            </div>
          )}
          <dl className="mt-4 space-y-2 text-sm">
            {producer.genre && (
              <>
                <dt className="font-medium text-zinc-500">Genre</dt>
                <dd className="text-zinc-900">{producer.genre}</dd>
              </>
            )}
            {producer.cityState && (
              <>
                <dt className="font-medium text-zinc-500">Location</dt>
                <dd className="text-zinc-900">{producer.cityState}</dd>
              </>
            )}
            {producer.yearsProducing && (
              <>
                <dt className="font-medium text-zinc-500">Years producing</dt>
                <dd className="text-zinc-900">{producer.yearsProducing}</dd>
              </>
            )}
            {producer.instagramHandle && (
              <>
                <dt className="font-medium text-zinc-500">Instagram</dt>
                <dd>
                  <a
                    href={`https://instagram.com/${producer.instagramHandle.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-900 underline hover:text-zinc-700"
                  >
                    {producer.instagramHandle}
                  </a>
                </dd>
              </>
            )}
          </dl>
          {events.length > 0 && (
            <section className="mt-6 border-t border-zinc-200 pt-4">
              <h2 className="text-lg font-medium text-zinc-900">BEATCON events</h2>
              <ul className="mt-2 space-y-2">
                {events.map((s) => (
                  <li key={s.event.id} className="text-sm text-zinc-700">
                    <Link href={`/events/${s.event.slug}`} className="underline hover:text-zinc-900">
                      {s.event.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link href="/" className="underline">Back to home</Link>
        </p>
      </div>
    </div>
  );
}
