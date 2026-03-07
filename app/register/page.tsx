"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const YEARS_OPTIONS = [
  { value: "3-5", label: "3–5 years" },
  { value: "6-10", label: "6–10 years" },
  { value: "10+", label: "10+ years" },
] as const;

function RegisterForm() {
  const searchParams = useSearchParams();
  const eventSlug = searchParams.get("event");
  const [event, setEvent] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(!!eventSlug);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    stageName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    instagramHandle: "",
    cityState: "",
    yearsProducing: "10+" as string,
    genre: "",
    productionStyle: "",
    agreeRules: false,
    agreeOriginal: false,
    agreeTimeLimits: false,
  });

  useEffect(() => {
    if (!eventSlug) {
      setLoadingEvent(false);
      return;
    }
    fetch(`/api/events/by-slug/${encodeURIComponent(eventSlug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setEvent(data);
      })
      .finally(() => setLoadingEvent(false));
  }, [eventSlug]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (form.password !== form.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (!form.agreeRules || !form.agreeOriginal || !form.agreeTimeLimits) {
      setMessage({ type: "error", text: "You must agree to all three statements." });
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.fullName,
        stageName: form.stageName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        instagramHandle: form.instagramHandle || null,
        cityState: form.cityState || null,
        yearsProducing: form.yearsProducing,
        genre: form.genre,
        productionStyle: form.productionStyle,
        agreeRules: true,
        agreeOriginal: true,
        agreeTimeLimits: true,
        eventId: event?.id ?? undefined,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setMessage({
        type: "success",
        text: "Account created. Log in with your email and password to continue.",
      });
    } else {
      setMessage({
        type: "error",
        text: data.error ?? "Something went wrong. Try again.",
      });
    }
  }

  if (loadingEvent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
        <p className="text-lg font-medium text-zinc-600">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-4 py-8">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-2 text-3xl font-bold text-zinc-900">Producer registration</h1>
        {event && (
          <p className="mb-6 text-lg font-medium text-zinc-600">
            Registering for: {event.name}
          </p>
        )}
        {!event && !eventSlug && (
          <p className="mb-6 text-base text-zinc-600">
            Create your producer account. You can join BEATCON events from your dashboard after signing in.
          </p>
        )}

        {message && (
          <div
            className={`mb-4 rounded-lg px-4 py-3 ${
              message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {message.text}
            {message.type === "success" && (
              <Link href="/producer/login" className="ml-2 font-medium underline">
                Log in
              </Link>
            )}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Full name *</label>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Producer / stage name *</label>
            <input
              type="text"
              required
              value={form.stageName}
              onChange={(e) => setForm((f) => ({ ...f, stageName: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Email *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Password * (min 8 characters)</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Confirm password *</label>
            <input
              type="password"
              required
              value={form.confirmPassword}
              onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Phone *</label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Instagram handle</label>
            <input
              type="text"
              value={form.instagramHandle}
              onChange={(e) => setForm((f) => ({ ...f, instagramHandle: e.target.value }))}
              placeholder="@username"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">City / state</label>
            <input
              type="text"
              value={form.cityState}
              onChange={(e) => setForm((f) => ({ ...f, cityState: e.target.value }))}
              placeholder="e.g. Los Angeles, CA"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Years producing *</label>
            <select
              required
              value={form.yearsProducing}
              onChange={(e) => setForm((f) => ({ ...f, yearsProducing: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            >
              {YEARS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Genre *</label>
            <input
              type="text"
              required
              value={form.genre}
              onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
              placeholder="e.g. Hip-Hop, Boom Bap"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Describe your production style in one sentence *</label>
            <textarea
              required
              rows={3}
              value={form.productionStyle}
              onChange={(e) => setForm((f) => ({ ...f, productionStyle: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <label className="flex items-start gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={form.agreeRules}
                onChange={(e) => setForm((f) => ({ ...f, agreeRules: e.target.checked }))}
                className="mt-0.5 rounded border-zinc-300"
              />
              I agree to follow all BEATCON battle rules.
            </label>
            <label className="flex items-start gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={form.agreeOriginal}
                onChange={(e) => setForm((f) => ({ ...f, agreeOriginal: e.target.checked }))}
                className="mt-0.5 rounded border-zinc-300"
              />
              I confirm that all material performed will be original and not plagiarized.
            </label>
            <label className="flex items-start gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={form.agreeTimeLimits}
                onChange={(e) => setForm((f) => ({ ...f, agreeTimeLimits: e.target.checked }))}
                className="mt-0.5 rounded border-zinc-300"
              />
              I understand that time limits will be strictly enforced.
            </label>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-zinc-900 px-4 py-3 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-600">
          Already have an account?{" "}
          <Link href="/producer/login" className="font-medium text-zinc-900 underline">
            Log in
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-zinc-500">
          <Link href="/" className="underline">Back to home</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
        <p className="text-lg font-medium text-zinc-600">Loading…</p>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
