"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

const YEARS_OPTIONS = [
  { value: "3-5", label: "3–5 years" },
  { value: "6-10", label: "6–10 years" },
  { value: "10+", label: "10+ years" },
] as const;

type Profile = {
  id: string;
  email: string;
  fullName: string;
  stageName: string;
  slug: string;
  phone: string;
  instagramHandle: string | null;
  cityState: string | null;
  yearsProducing: string;
  genre: string;
  productionStyle: string;
  imageUrl: string | null;
};

type Signup = {
  id: string;
  eventId: string;
  createdAt: string;
  event: { id: string; name: string; slug: string };
};

type OpenEvent = { id: string; name: string; slug: string };

export function ProducerDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [openEvents, setOpenEvents] = useState<OpenEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [joiningEventId, setJoiningEventId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [profileForm, setProfileForm] = useState<Partial<Profile>>({});
  const [activeTab, setActiveTab] = useState<"profile" | "events">("profile");
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/producer/profile").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/producer/events").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/events/open").then((r) => (r.ok ? r.json() : [])),
    ]).then(([p, s, e]) => {
      setProfile(p ?? null);
      setSignups(Array.isArray(s) ? s : []);
      setOpenEvents(Array.isArray(e) ? e : []);
      if (p) setProfileForm(p);
    }).finally(() => setLoading(false));
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profileForm) return;
    setSavingProfile(true);
    setMessage(null);
    const res = await fetch("/api/producer/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileForm),
    });
    const data = await res.json();
    setSavingProfile(false);
    if (res.ok) {
      setProfile(data);
      setProfileForm(data);
      setMessage({ type: "success", text: "Profile updated." });
    } else {
      setMessage({ type: "error", text: data.error ?? "Failed to update profile." });
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    setSavingPassword(true);
    setMessage(null);
    const res = await fetch("/api/producer/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: passwordForm.current,
        newPassword: passwordForm.new,
      }),
    });
    const data = await res.json();
    setSavingPassword(false);
    if (res.ok) {
      setMessage({ type: "success", text: "Password updated." });
      setPasswordForm({ current: "", new: "", confirm: "" });
    } else {
      setMessage({ type: "error", text: data.error ?? "Failed to update password." });
    }
  }

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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
        <p className="text-lg font-medium text-zinc-600">Loading…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
        <p className="text-lg font-medium text-zinc-600">Could not load profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <nav className="flex items-center gap-4">
            <Link href="/producer" className="font-medium text-zinc-900 hover:text-zinc-600">
              Dashboard
            </Link>
            <Link href={`/producers/${profile.slug}`} className="text-zinc-600 hover:text-zinc-900">
              My BeatCon page
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">{profile.email}</span>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm text-zinc-600 hover:text-zinc-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold text-zinc-900">Producer dashboard</h1>

        {message && (
          <div
            className={`mb-4 rounded-lg px-4 py-3 ${
              message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mb-4 flex gap-2 border-b border-zinc-200">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              activeTab === "profile"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("events")}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              activeTab === "events"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-600 hover:text-zinc-900"
            }`}
          >
            My events
          </button>
        </div>

        {activeTab === "profile" && (
          <form onSubmit={saveProfile} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-medium text-zinc-900">Edit profile</h2>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Full name</label>
              <input
                type="text"
                value={profileForm.fullName ?? ""}
                onChange={(e) => setProfileForm((f) => ({ ...f, fullName: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Stage name</label>
              <input
                type="text"
                value={profileForm.stageName ?? ""}
                onChange={(e) => setProfileForm((f) => ({ ...f, stageName: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
              />
              <p className="mt-1 text-xs text-zinc-500">Your public page: /producers/{profileForm.slug ?? profile.slug}</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Phone</label>
              <input
                type="tel"
                value={profileForm.phone ?? ""}
                onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Instagram handle</label>
              <input
                type="text"
                value={profileForm.instagramHandle ?? ""}
                onChange={(e) => setProfileForm((f) => ({ ...f, instagramHandle: e.target.value || null }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">City / state</label>
              <input
                type="text"
                value={profileForm.cityState ?? ""}
                onChange={(e) => setProfileForm((f) => ({ ...f, cityState: e.target.value || null }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Years producing</label>
              <select
                value={profileForm.yearsProducing ?? ""}
                onChange={(e) => setProfileForm((f) => ({ ...f, yearsProducing: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
              >
                {YEARS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Genre</label>
              <input
                type="text"
                value={profileForm.genre ?? ""}
                onChange={(e) => setProfileForm((f) => ({ ...f, genre: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Production style (one sentence)</label>
              <textarea
                rows={2}
                value={profileForm.productionStyle ?? ""}
                onChange={(e) => setProfileForm((f) => ({ ...f, productionStyle: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Profile image URL</label>
              <input
                type="url"
                value={profileForm.imageUrl ?? ""}
                onChange={(e) => setProfileForm((f) => ({ ...f, imageUrl: e.target.value || null }))}
                placeholder="https://…"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
              />
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {savingProfile ? "Saving…" : "Save profile"}
            </button>
            <div className="mt-6 border-t border-zinc-200 pt-4">
              <h3 className="mb-2 text-sm font-medium text-zinc-700">Change password</h3>
              <form onSubmit={changePassword} className="flex flex-col gap-2">
                <input
                  type="password"
                  placeholder="Current password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, current: e.target.value }))}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                />
                <input
                  type="password"
                  placeholder="New password (min 8 characters)"
                  minLength={8}
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, new: e.target.value }))}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                />
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="w-fit rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50"
                >
                  {savingPassword ? "Updating…" : "Update password"}
                </button>
              </form>
            </div>
          </form>
        )}

        {activeTab === "events" && (
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
                      <Link
                        href={`/producers/${profile.slug}`}
                        className="text-sm text-zinc-600 hover:text-zinc-900"
                      >
                        View my page
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="rounded-xl border border-zinc-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-medium text-zinc-900">Join another event</h2>
              {openEvents.filter((e) => !alreadySignedUpIds.has(e.id)).length === 0 ? (
                <p className="text-sm text-zinc-500">No events are currently open for registration, or you’ve already joined all of them.</p>
              ) : (
                <ul className="space-y-2">
                  {openEvents
                    .filter((e) => !alreadySignedUpIds.has(e.id))
                    .map((ev) => (
                      <li key={ev.id} className="flex items-center justify-between rounded-lg border border-zinc-100 p-3">
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
        )}

        <p className="mt-6 text-sm text-zinc-500">
          <Link href="/" className="underline">Back to home</Link>
        </p>
      </main>
    </div>
  );
}
