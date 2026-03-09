import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProducerAvatar } from "./ProducerAvatar";

type Props = { params: Promise<{ slug: string }> };

const linkConfig = [
  { key: "spotifyUrl" as const, label: "Spotify", href: (v: string) => v },
  { key: "appleMusicUrl" as const, label: "Apple Music", href: (v: string) => v },
  { key: "soundCloudUrl" as const, label: "SoundCloud", href: (v: string) => v },
  { key: "websiteUrl" as const, label: "Website", href: (v: string) => v },
  {
    key: "twitterHandle" as const,
    label: "X",
    href: (h: string) => `https://x.com/${h.replace(/^@/, "")}`,
  },
  {
    key: "instagramHandle" as const,
    label: "Instagram",
    href: (h: string) => `https://instagram.com/${h.replace(/^@/, "")}`,
  },
];

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
  const musicAndSocialLinks = linkConfig.filter((c) => {
    const val = producer[c.key];
    return typeof val === "string" && val.trim() !== "";
  });

  const hasDetails =
    producer.genre || producer.cityState || producer.yearsProducing;

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-100 to-zinc-50">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
        <nav className="mb-8">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-500 transition hover:text-zinc-800"
          >
            ← BeatCon Vote
          </Link>
        </nav>

        {/* Hero */}
        <header className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-8">
            <div className="shrink-0">
              <ProducerAvatar
                imageUrl={producer.imageUrl}
                stageName={producer.stageName}
              />
            </div>
            <div className="mt-4 min-w-0 flex-1 sm:mt-0">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                {producer.stageName}
              </h1>
              {producer.fullName && producer.fullName !== producer.stageName && (
                <p className="mt-0.5 text-zinc-600">{producer.fullName}</p>
              )}
              {producer.productionStyle && (
                <p className="mt-2 text-lg italic text-zinc-700">
                  &ldquo;{producer.productionStyle}&rdquo;
                </p>
              )}
              {hasDetails && (
                <ul className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-zinc-500 sm:justify-start">
                  {producer.genre && (
                    <li>
                      <span className="font-medium text-zinc-600">Genre:</span>{" "}
                      {producer.genre}
                    </li>
                  )}
                  {producer.cityState && <li>{producer.cityState}</li>}
                  {producer.yearsProducing && (
                    <li>{producer.yearsProducing} producing</li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </header>

        {/* Bio */}
        {producer.bio && (
          <section className="mt-6 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              About
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-zinc-700">
              {producer.bio}
            </p>
          </section>
        )}

        {/* Listen & connect */}
        {musicAndSocialLinks.length > 0 && (
          <section className="mt-6 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Listen & connect
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {musicAndSocialLinks.map(({ key, label, href }) => {
                const val = producer[key] as string;
                const url = href(val);
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-100"
                  >
                    {label}
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* BeatCon events */}
        {events.length > 0 && (
          <section className="mt-6 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              BeatCon events
            </h2>
            <ul className="mt-4 space-y-2">
              {events.map((s) => (
                <li key={s.event.id}>
                  <Link
                    href={`/events/${s.event.slug}`}
                    className="block rounded-lg border border-zinc-100 py-3 px-4 text-zinc-800 transition hover:border-zinc-200 hover:bg-zinc-50"
                  >
                    {s.event.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-10 text-center text-sm text-zinc-500">
          <Link href="/" className="font-medium underline hover:text-zinc-700">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
