import Image from "next/image";
import Link from "next/link";
import { getUpcomingEvents } from "@/lib/events";

const TICKET_URL =
  process.env.NEXT_PUBLIC_TICKET_URL ?? "https://www.eventim.us/event/BEAT-CON/682819";

const DOWNLOADS = [
  {
    label: "Rules & format",
    href: "https://docs.google.com/document/d/1cZrspsoBMEPwQ8JM7ZQatlTbPKuYTmR2kEppfcJgIHs/edit?usp=sharing",
    description: "Official battle rules and format",
  },
  {
    label: "Sample pack",
    href: "https://drive.google.com/drive/folders/1qAxY6-MPPDWB2zOep5MoumAM4xJdL-kV",
    description: "Download stems and reference material",
  },
] as const;

function formatDateTime(iso: string | Date | null): string {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export default async function HomePage() {
  const upcomingEvents = await getUpcomingEvents();
  return (
    <div className="relative min-h-screen bg-[var(--lander-bg)] text-[var(--lander-text)]">
      <div className="lander-grain fixed inset-0 z-0" aria-hidden />
      <div className="relative z-10">
        {/* Nav */}
        <header className="border-b border-[var(--lander-border)]/80 bg-[var(--lander-bg)]/90 backdrop-blur-md sticky top-0 z-20">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
            <Link href="/" className="flex items-center">
              <Image
                src="/beatcon-logo.png"
                alt="BeatCon"
                width={120}
                height={40}
                className="h-8 w-auto object-contain sm:h-10"
                priority
              />
            </Link>
            <div className="flex items-center gap-4 sm:gap-6">
              <a
                href="#upcoming-events"
                className="text-sm font-medium text-[var(--lander-muted)] transition-colors hover:text-[var(--lander-text)]"
              >
                Events
              </a>
              <a
                href="#producers"
                className="text-sm font-medium text-[var(--lander-muted)] transition-colors hover:text-[var(--lander-text)]"
              >
                Producers
              </a>
              <a
                href="#downloads"
                className="text-sm font-medium text-[var(--lander-muted)] transition-colors hover:text-[var(--lander-text)]"
              >
                Downloads
              </a>
              <Link
                href="/producer/login"
                className="text-sm font-medium text-[var(--lander-muted)] transition-colors hover:text-[var(--lander-text)]"
              >
                Sign in
              </Link>
              <a
                href={TICKET_URL}
                target={TICKET_URL.startsWith("http") ? "_blank" : undefined}
                rel={TICKET_URL.startsWith("http") ? "noopener noreferrer" : undefined}
                className="rounded-full bg-[var(--lander-accent)] px-4 py-2 text-sm font-semibold text-[var(--lander-on-accent)] transition-colors hover:bg-[var(--lander-accent-hover)]"
              >
                Get tickets
              </a>
            </div>
          </nav>
        </header>

        {/* Hero */}
        <section className="px-5 pt-16 pb-24 sm:px-8 sm:pt-24 sm:pb-32">
          <div className="mx-auto max-w-6xl">
            <Link href="/" className="lander-reveal mb-8 inline-block" style={{ animationDelay: "0.05s", opacity: 0 }}>
              <Image
                src="/beatcon-logo.png"
                alt="BeatCon"
                width={200}
                height={72}
                className="h-14 w-auto object-contain sm:h-20"
                priority
              />
            </Link>
            <p
              className="lander-reveal mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--lander-accent)]"
              style={{ animationDelay: "0.1s", opacity: 0 }}
            >
              Beat battle & producer showcase
            </p>
            <h1
              className="lander-reveal font-display max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl"
              style={{ animationDelay: "0.2s", opacity: 0 }}
            >
              Make beats. Compete. Get voted.
            </h1>
            <p
              className="lander-reveal mt-6 max-w-xl text-lg text-[var(--lander-muted)] sm:text-xl"
              style={{ animationDelay: "0.35s", opacity: 0 }}
            >
              Live head-to-head battles, crowd voting, and a stage built for producers. Sign up to compete or grab a ticket and be in the room.
            </p>
            <div
              className="lander-reveal mt-10 flex flex-wrap items-center gap-4"
              style={{ animationDelay: "0.5s", opacity: 0 }}
            >
              <a
                href={TICKET_URL}
                target={TICKET_URL.startsWith("http") ? "_blank" : undefined}
                rel={TICKET_URL.startsWith("http") ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--lander-accent)] px-8 py-4 text-base font-bold text-[var(--lander-on-accent)] transition-all hover:bg-[var(--lander-accent-hover)] hover:scale-[1.02] active:scale-[0.98]"
              >
                Buy tickets
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--lander-border)] bg-transparent px-8 py-4 text-base font-bold transition-all hover:border-[var(--lander-muted)] hover:bg-white/5"
              >
                Producer sign up
              </Link>
            </div>
          </div>
        </section>

        {/* Upcoming events */}
        <section id="upcoming-events" className="border-t border-[var(--lander-border)] bg-[var(--lander-surface)] px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Upcoming events
            </h2>
            <p className="mt-2 text-[var(--lander-muted)]">
              See event details, when and where, and who’s competing.
            </p>
            {upcomingEvents.length === 0 ? (
              <p className="mt-8 text-[var(--lander-muted)]">
                No upcoming events right now. Check back soon.
              </p>
            ) : (
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingEvents.map((event) => {
                  const when = event.eventStartsAt
                    ? formatDateTime(event.eventStartsAt) + (event.eventEndsAt ? " – " + formatDateTime(event.eventEndsAt) : "")
                    : "Date TBA";
                  const where = [event.venueName, [event.city, event.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ") || null;
                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.slug}`}
                      className="group flex flex-col rounded-xl border border-[var(--lander-border)] bg-[var(--lander-bg)] p-5 transition-colors hover:border-[var(--lander-muted)] hover:bg-[var(--lander-surface)]/80"
                    >
                      <h3 className="font-semibold text-[var(--lander-text)] group-hover:text-[var(--lander-accent)]">
                        {event.name}
                      </h3>
                      <p className="mt-2 text-sm text-[var(--lander-muted)]">{when}</p>
                      {where && <p className="mt-1 text-sm text-[var(--lander-muted)]">{where}</p>}
                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--lander-accent)] group-hover:underline">
                        View event
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Producers block */}
        <section id="producers" className="border-t border-[var(--lander-border)] bg-[var(--lander-surface)] px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div>
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Compete as a producer
                </h2>
                <p className="mt-4 text-[var(--lander-muted)]">
                  Create an account, download the rules and sample pack, and register for the event. You’ll get a spot in the bracket and a chance to go head-to-head in front of the crowd.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/register"
                    className="rounded-full bg-[var(--lander-accent)] px-6 py-3 text-sm font-semibold text-[var(--lander-on-accent)] transition-colors hover:bg-[var(--lander-accent-hover)]"
                  >
                    Create producer account
                  </Link>
                  <Link
                    href="/producer/login"
                    className="rounded-full border border-[var(--lander-border)] px-6 py-3 text-sm font-semibold transition-colors hover:border-[var(--lander-muted)] hover:bg-white/5"
                  >
                    Already have an account? Sign in
                  </Link>
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--lander-border)] bg-[var(--lander-bg)] p-6 sm:p-8">
                <ul className="space-y-4 text-sm text-[var(--lander-muted)]">
                  <li className="flex gap-3">
                    <span className="text-[var(--lander-accent)]">1.</span>
                    <span>Sign up and confirm your profile.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[var(--lander-accent)]">2.</span>
                    <span>Download the rules and sample pack below.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[var(--lander-accent)]">3.</span>
                    <span>Join the event from your dashboard when registration is open.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[var(--lander-accent)]">4.</span>
                    <span>Show up, compete, and get voted on live.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Downloads */}
        <section id="downloads" className="border-t border-[var(--lander-border)] px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Rules &amp; samples
            </h2>
            <p className="mt-2 text-[var(--lander-muted)]">
              Everything you need before the battle: official rules and a sample pack to practice with.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {DOWNLOADS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-xl border border-[var(--lander-border)] bg-[var(--lander-surface)] p-5 transition-colors hover:border-[var(--lander-muted)] hover:bg-[var(--lander-surface)]/80"
                >
                  <div>
                    <p className="font-semibold text-[var(--lander-text)] group-hover:text-[var(--lander-accent)]">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-sm text-[var(--lander-muted)]">{item.description}</p>
                  </div>
                  <span className="rounded-full bg-[var(--lander-bg)] p-2 text-[var(--lander-accent)] transition-colors group-hover:bg-[var(--lander-accent)] group-hover:text-[var(--lander-on-accent)]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-[var(--lander-border)] bg-[var(--lander-surface)] px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Be in the room
            </h2>
            <p className="mt-4 text-lg text-[var(--lander-muted)]">
              Don’t want to compete? Get a ticket and vote live, watch the bracket, and be part of the night.
            </p>
            <a
              href={TICKET_URL}
              target={TICKET_URL.startsWith("http") ? "_blank" : undefined}
              rel={TICKET_URL.startsWith("http") ? "noopener noreferrer" : undefined}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--lander-accent)] px-10 py-4 text-lg font-bold text-[var(--lander-on-accent)] transition-all hover:bg-[var(--lander-accent-hover)] hover:scale-[1.02] active:scale-[0.98]"
            >
              Get tickets
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[var(--lander-border)] px-5 py-8 sm:px-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
            <Link href="/" className="flex items-center">
              <Image
                src="/beatcon-logo.png"
                alt="BeatCon"
                width={84}
                height={28}
                className="h-7 w-auto object-contain opacity-90 hover:opacity-100"
              />
            </Link>
            <div className="flex gap-6 text-sm text-[var(--lander-muted)]">
              <Link href="/register" className="transition-colors hover:text-[var(--lander-text)]">
                Producer sign up
              </Link>
              <Link href="/producer/login" className="transition-colors hover:text-[var(--lander-text)]">
                Producer sign in
              </Link>
              <a
                href={TICKET_URL}
                target={TICKET_URL.startsWith("http") ? "_blank" : undefined}
                rel={TICKET_URL.startsWith("http") ? "noopener noreferrer" : undefined}
                className="transition-colors hover:text-[var(--lander-text)]"
              >
                Tickets
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
