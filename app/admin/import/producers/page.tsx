"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type EventOption = { id: string; name: string; slug: string };
type ImportResult = { email: string; stageName: string; password?: string; error?: string };

export default function AdminImportProducersPage() {
  const [csv, setCsv] = useState("");
  const [eventId, setEventId] = useState("");
  const [events, setEvents] = useState<EventOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    results: ImportResult[];
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    if (!csv.trim()) {
      setError("Paste or upload a CSV file.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/import/producers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csv: csv.trim(),
          eventId: eventId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Import failed.");
        return;
      }
      setResult({
        created: data.created ?? 0,
        skipped: data.skipped ?? 0,
        results: data.results ?? [],
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsv(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  function downloadPasswords() {
    if (!result?.results.length) return;
    const withPassword = result.results.filter((r) => r.password);
    if (withPassword.length === 0) return;
    const header = "Email,Stage Name,Temporary Password\n";
    const rows = withPassword
      .map((r) => `${r.email},${r.stageName ?? ""},${r.password ?? ""}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `producer-passwords-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <Link href="/admin" className="mb-4 inline-block text-sm text-zinc-600 hover:text-zinc-900">
        ← Dashboard
      </Link>
      <h1 className="mb-2 text-2xl font-semibold text-zinc-900">Import producers from CSV</h1>
      <p className="mb-6 text-sm text-zinc-600">
        Use a CSV with the same columns as the producer signup form: Full Name, Producer Name / Stage Name, Email Address, Phone Number, Instagram Handle, City / State, years producing, genre, production style, and the three agreement columns.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Optional: add to event
          </label>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
          >
            <option value="">No event (create accounts only)</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-500">
            If selected, each imported producer will also be registered for this event.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">CSV content</label>
          <div className="mb-2 flex gap-2">
            <label className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
              Choose file
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder="Paste CSV here or use Choose file…"
            rows={12}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm text-zinc-900"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-800">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {submitting ? "Importing…" : "Import producers"}
        </button>
      </form>

      {result && (
        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-2 text-lg font-medium text-zinc-900">Import result</h2>
          <p className="mb-4 text-sm text-zinc-600">
            Created: {result.created} · Skipped/failed: {result.skipped}
          </p>
          {result.created > 0 && (
            <button
              type="button"
              onClick={downloadPasswords}
              className="mb-4 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Download passwords CSV
            </button>
          )}
          <div className="max-h-80 overflow-auto rounded-lg border border-zinc-200">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-zinc-50">
                <tr>
                  <th className="px-3 py-2 font-medium text-zinc-700">Email</th>
                  <th className="px-3 py-2 font-medium text-zinc-700">Stage name</th>
                  <th className="px-3 py-2 font-medium text-zinc-700">Password / Note</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((r, i) => (
                  <tr key={i} className="border-t border-zinc-100">
                    <td className="px-3 py-2 text-zinc-900">{r.email}</td>
                    <td className="px-3 py-2 text-zinc-700">{r.stageName}</td>
                    <td className="px-3 py-2">
                      {r.password ? (
                        <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">{r.password}</code>
                      ) : (
                        <span className="text-red-600">{r.error}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
