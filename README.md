# BeatCon Vote

Live voting app: admin manages events, rounds, and matchups; voters scan a QR code to vote; a bracket/scoreboard display updates in real time.

## Setup

1. Install dependencies: `npm install`
2. Copy `.env` and set `DATABASE_URL` (default: `file:./prisma/dev.db` for SQLite). Set `NEXTAUTH_SECRET` and `NEXTAUTH_URL` for auth.
3. Create DB and seed admin: `npm run db:migrate` then `npm run db:seed`
4. Default admin: `admin@beatcon.local` / `admin123` (override with `ADMIN_EMAIL` and `ADMIN_PASSWORD` when running seed)

## Run

- Dev: `npm run dev`
- Build: `npm run build`
- Start: `npm start`

## Usage

1. **Admin** – Sign in at `/admin/login`, then:
   - Create an event (name, slug, max votes per user).
   - Add participants and rounds/matchups under the event.
   - Set “Flow of show” current matchup to drive the QR and voter page.
   - Optionally set vote end time per matchup and export results (CSV) from the event page.

2. **QR display** – Open `/display/qr?eventId=<eventId>` (e.g. on a screen). Shows a QR code that links to the current matchup’s vote page. Updates when the admin changes the current matchup.

3. **Vote page** – Voters scan the QR (or open `/vote/current?eventId=<eventId>`). They enter name, email, and phone once, then vote for the current matchup. Real-time updates when the matchup or voting window changes.

4. **Bracket display** – Open `/display/bracket?eventId=<eventId>` on a TV/LED. Read-only bracket and live scores; refreshes via SSE and polling.

## Tech

- Next.js 16 (App Router), TypeScript, Tailwind, Prisma (SQLite dev), NextAuth (admin credentials), Server-Sent Events for real-time updates.
