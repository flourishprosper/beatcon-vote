"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const YEARS_OPTIONS = [
  { value: "3-5", label: "3–5 years" },
  { value: "6-10", label: "6–10 years" },
  { value: "10+", label: "10+ years" },
] as const;

const PROFILE_TAB_IDS = ["basic", "photo", "links"] as const;
type ProfileTabId = (typeof PROFILE_TAB_IDS)[number];

const PATCH_KEYS = [
  "fullName",
  "stageName",
  "phone",
  "instagramHandle",
  "cityState",
  "yearsProducing",
  "genre",
  "productionStyle",
  "imageUrl",
  "spotifyUrl",
  "appleMusicUrl",
  "websiteUrl",
  "bio",
  "soundCloudUrl",
  "twitterHandle",
] as const;

function isValidProfileTab(t: string | null): t is ProfileTabId {
  return t !== null && PROFILE_TAB_IDS.includes(t as ProfileTabId);
}

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
  spotifyUrl: string | null;
  appleMusicUrl: string | null;
  websiteUrl: string | null;
  bio: string | null;
  soundCloudUrl: string | null;
  twitterHandle: string | null;
};

export default function ProducerProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeTab: ProfileTabId = isValidProfileTab(rawTab) ? rawTab : "basic";
  const tabListRef = useRef<HTMLDivElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState<Partial<Profile>>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/producer/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        setProfile(p ?? null);
        if (p) setProfileForm(p);
      })
      .finally(() => setLoading(false));
  }, []);

  function setActiveTab(tab: ProfileTabId) {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    router.replace(url.pathname + url.search);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profileForm) return;
    setSavingProfile(true);
    setMessage(null);
    setFieldErrors({});
    const payload: Record<string, unknown> = {};
    for (const key of PATCH_KEYS) {
      if (key in profileForm) payload[key] = profileForm[key];
    }
    const res = await fetch("/api/producer/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSavingProfile(false);
    if (res.ok) {
      setProfile(data);
      setProfileForm(data);
      setMessage({ type: "success", text: "Profile updated." });
      setFieldErrors({});
    } else {
      setMessage({ type: "error", text: data.error ?? "Failed to update profile." });
      setFieldErrors((data.fieldErrors as Record<string, string[]>) ?? {});
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadError(null);
    setLocalPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
    setUploadingPhoto(true);
    try {
      const urlRes = await fetch("/api/producer/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: f.name,
          contentType: f.type,
          kind: "image",
          size: f.size,
        }),
      });
      const urlData = await urlRes.json();
      if (!urlRes.ok) {
        const message =
          urlRes.status === 503
            ? "Photo upload is not available right now. Please try again later or contact the organizer."
            : (urlData.error ?? "Could not get upload URL");
        setUploadError(message);
        return;
      }
      const putRes = await fetch(urlData.uploadUrl, {
        method: "PUT",
        body: f,
        headers: { "Content-Type": f.type },
      });
      if (!putRes.ok) {
        setUploadError("Upload to storage failed");
        return;
      }
      setProfileForm((prev) => ({ ...prev, imageUrl: urlData.publicUrl }));
      setMessage({ type: "success", text: "Photo uploaded. Save profile to keep it." });
      setLocalPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    } catch {
      setUploadError("Upload failed");
      setLocalPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  }

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-zinc-500">Loading…</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-zinc-600">Could not load profile.</p>
      </main>
    );
  }

  const tabLabels: Record<ProfileTabId, string> = {
    basic: "Basic info",
    photo: "Photo",
    links: "Bio and links",
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">Edit profile</h1>
      {message && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 ${
            message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          <p>{message.text}</p>
          {message.type === "error" && Object.keys(fieldErrors).length > 0 && (
            <ul className="mt-2 list-inside list-disc text-sm">
              {Object.entries(fieldErrors).flatMap(([field, errs]) =>
                (errs as string[]).map((err, i) => (
                  <li key={`${field}-${i}`}>
                    {field}: {err}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      )}

      <nav
        ref={tabListRef}
        role="tablist"
        aria-label="Profile sections"
        className="mb-6 border-b border-zinc-200"
      >
        <div className="flex gap-1">
          {PROFILE_TAB_IDS.map((tabId) => (
            <button
              key={tabId}
              type="button"
              role="tab"
              id={`profile-tab-${tabId}`}
              aria-selected={activeTab === tabId}
              aria-controls={`profile-panel-${tabId}`}
              tabIndex={activeTab === tabId ? 0 : -1}
              onClick={() => setActiveTab(tabId)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tabId
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
              }`}
            >
              {tabLabels[tabId]}
            </button>
          ))}
        </div>
      </nav>

      <form onSubmit={saveProfile} className="rounded-xl border border-zinc-200 bg-white">
        {/* Basic info panel */}
        <div
          role="tabpanel"
          id="profile-panel-basic"
          aria-labelledby="profile-tab-basic"
          hidden={activeTab !== "basic"}
          className="space-y-4 p-6"
        >
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
            <p className="mt-1 text-xs text-zinc-500">
              Your public page: /producers/{profileForm.slug ?? profile.slug}
            </p>
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
        </div>

        {/* Photo panel */}
        <div
          role="tabpanel"
          id="profile-panel-photo"
          aria-labelledby="profile-tab-photo"
          hidden={activeTab !== "photo"}
          className="space-y-4 p-6"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Profile photo</label>
            {(profileForm.imageUrl || localPreviewUrl) && (
              <div className="mb-4 flex justify-center">
                <img
                  src={localPreviewUrl ?? profileForm.imageUrl ?? ""}
                  alt="Profile preview"
                  className="h-40 w-40 rounded-full border-2 border-zinc-200 object-cover shadow-inner"
                />
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <label className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                {uploadingPhoto ? "Uploading…" : "Upload photo"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  disabled={uploadingPhoto}
                  onChange={handlePhotoUpload}
                />
              </label>
              <span className="text-sm text-zinc-500">or paste URL below</span>
            </div>
            {uploadError && <p className="mt-1 text-sm text-red-600">{uploadError}</p>}
            <input
              type="url"
              value={profileForm.imageUrl ?? ""}
              onChange={(e) => {
                setUploadError(null);
                setProfileForm((f) => ({ ...f, imageUrl: e.target.value || null }));
              }}
              placeholder="https://…"
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
        </div>

        {/* Bio and links panel */}
        <div
          role="tabpanel"
          id="profile-panel-links"
          aria-labelledby="profile-tab-links"
          hidden={activeTab !== "links"}
          className="space-y-4 p-6"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Bio</label>
            <textarea
              rows={4}
              value={profileForm.bio ?? ""}
              onChange={(e) => setProfileForm((f) => ({ ...f, bio: e.target.value || null }))}
              placeholder="Short bio for your public profile"
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
            <label className="mb-1 block text-sm font-medium text-zinc-700">Spotify URL</label>
            <input
              type="url"
              value={profileForm.spotifyUrl ?? ""}
              onChange={(e) => setProfileForm((f) => ({ ...f, spotifyUrl: e.target.value || null }))}
              placeholder="https://open.spotify.com/…"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Apple Music URL</label>
            <input
              type="url"
              value={profileForm.appleMusicUrl ?? ""}
              onChange={(e) => setProfileForm((f) => ({ ...f, appleMusicUrl: e.target.value || null }))}
              placeholder="https://music.apple.com/…"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Website URL</label>
            <input
              type="url"
              value={profileForm.websiteUrl ?? ""}
              onChange={(e) => setProfileForm((f) => ({ ...f, websiteUrl: e.target.value || null }))}
              placeholder="https://…"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">SoundCloud URL</label>
            <input
              type="url"
              value={profileForm.soundCloudUrl ?? ""}
              onChange={(e) => setProfileForm((f) => ({ ...f, soundCloudUrl: e.target.value || null }))}
              placeholder="https://soundcloud.com/…"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Twitter / X handle</label>
            <input
              type="text"
              value={profileForm.twitterHandle ?? ""}
              onChange={(e) => setProfileForm((f) => ({ ...f, twitterHandle: e.target.value || null }))}
              placeholder="@username"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
        </div>

        <div className="border-t border-zinc-200 p-6">
          <button
            type="submit"
            disabled={savingProfile}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {savingProfile ? "Saving…" : "Save profile"}
          </button>
        </div>
      </form>

      <p className="mt-6 text-sm text-zinc-500">
        <Link href="/" className="underline hover:text-zinc-700">Back to home</Link>
      </p>
    </main>
  );
}
