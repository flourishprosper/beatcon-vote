"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Voter = { id: string; name: string; email: string; phone: string; contactConsent: boolean; createdAt: string };
type Producer = {
  id: string;
  email: string;
  stageName: string;
  slug: string;
  fullName: string;
  phone: string;
  genre: string;
  createdAt: string;
};
type AdminUser = { id: string; email: string; createdAt: string };

type Tab = "voters" | "producers" | "admins";

export default function AdminUsersPage() {
  const [tab, setTab] = useState<Tab>("voters");
  const [voters, setVoters] = useState<Voter[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        setVoters(data.voters ?? []);
        setProducers(data.producers ?? []);
        setAdmins(data.admins ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <p className="text-zinc-500">Loading users…</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "voters", label: "Voters", count: voters.length },
    { id: "producers", label: "Producers", count: producers.length },
    { id: "admins", label: "Admins", count: admins.length },
  ];

  return (
    <div>
      <Link href="/admin" className="mb-4 inline-block text-sm text-zinc-600 hover:text-zinc-900">
        ← Dashboard
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">Users</h1>

      <div className="mb-4 flex gap-2 border-b border-zinc-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              tab === t.id
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-600 hover:text-zinc-900"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {tab === "voters" && (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 font-medium text-zinc-700">Name</th>
                <th className="px-4 py-3 font-medium text-zinc-700">Email</th>
                <th className="px-4 py-3 font-medium text-zinc-700">Phone</th>
                <th className="px-4 py-3 font-medium text-zinc-700">Contact OK</th>
                <th className="px-4 py-3 font-medium text-zinc-700">Registered</th>
              </tr>
            </thead>
            <tbody>
              {voters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                    No voters yet.
                  </td>
                </tr>
              ) : (
                voters.map((v) => (
                  <tr key={v.id} className="border-b border-zinc-100">
                    <td className="px-4 py-3 text-zinc-900">{v.name}</td>
                    <td className="px-4 py-3 text-zinc-700">{v.email}</td>
                    <td className="px-4 py-3 text-zinc-700">{v.phone}</td>
                    <td className="px-4 py-3 text-zinc-600">{v.contactConsent ? "Yes" : "No"}</td>
                    <td className="px-4 py-3 text-zinc-500">
                      {new Date(v.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "producers" && (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 font-medium text-zinc-700">Stage name</th>
                <th className="px-4 py-3 font-medium text-zinc-700">Full name</th>
                <th className="px-4 py-3 font-medium text-zinc-700">Email</th>
                <th className="px-4 py-3 font-medium text-zinc-700">Genre</th>
                <th className="px-4 py-3 font-medium text-zinc-700">Page</th>
                <th className="px-4 py-3 font-medium text-zinc-700">Registered</th>
              </tr>
            </thead>
            <tbody>
              {producers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                    No producers yet.
                  </td>
                </tr>
              ) : (
                producers.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-100">
                    <td className="px-4 py-3 font-medium text-zinc-900">{p.stageName}</td>
                    <td className="px-4 py-3 text-zinc-700">{p.fullName}</td>
                    <td className="px-4 py-3 text-zinc-700">{p.email}</td>
                    <td className="px-4 py-3 text-zinc-600">{p.genre}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/producers/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-600 hover:text-zinc-900"
                      >
                        View page
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "admins" && (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 font-medium text-zinc-700">Email</th>
                <th className="px-4 py-3 font-medium text-zinc-700">Created</th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-zinc-500">
                    No admins.
                  </td>
                </tr>
              ) : (
                admins.map((a) => (
                  <tr key={a.id} className="border-b border-zinc-100">
                    <td className="px-4 py-3 font-medium text-zinc-900">{a.email}</td>
                    <td className="px-4 py-3 text-zinc-500">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
