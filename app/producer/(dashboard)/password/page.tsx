"use client";

import { useState } from "react";
import Link from "next/link";

export default function ProducerPasswordPage() {
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    setSaving(true);
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
    setSaving(false);
    if (res.ok) {
      setMessage({ type: "success", text: "Password updated." });
      setPasswordForm({ current: "", new: "", confirm: "" });
    } else {
      setMessage({ type: "error", text: data.error ?? "Failed to update password." });
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">Change password</h1>
      {message && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 ${
            message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
        <div>
          <label htmlFor="current" className="mb-1 block text-sm font-medium text-zinc-700">
            Current password
          </label>
          <input
            id="current"
            type="password"
            value={passwordForm.current}
            onChange={(e) => setPasswordForm((f) => ({ ...f, current: e.target.value }))}
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
          />
        </div>
        <div>
          <label htmlFor="new" className="mb-1 block text-sm font-medium text-zinc-700">
            New password (min 8 characters)
          </label>
          <input
            id="new"
            type="password"
            minLength={8}
            value={passwordForm.new}
            onChange={(e) => setPasswordForm((f) => ({ ...f, new: e.target.value }))}
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-zinc-700">
            Confirm new password
          </label>
          <input
            id="confirm"
            type="password"
            value={passwordForm.confirm}
            onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))}
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? "Updating…" : "Update password"}
          </button>
          <Link href="/producer/profile" className="text-sm text-zinc-600 hover:text-zinc-900">
            Back to profile
          </Link>
        </div>
      </form>
    </main>
  );
}
