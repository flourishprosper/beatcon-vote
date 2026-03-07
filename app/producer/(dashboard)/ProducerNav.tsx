"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type ProducerNavProps = {
  email: string;
  profileSlug?: string | null;
};

export function ProducerNav({ email, profileSlug }: ProducerNavProps) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const isProfile = pathname === "/producer" || pathname === "/producer/profile";
  const isEvents = pathname === "/producer/events";
  const isPassword = pathname === "/producer/password";

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <nav className="flex items-center gap-6" aria-label="Producer dashboard">
          <Link
            href="/producer/profile"
            className={`text-sm font-medium ${
              isProfile ? "text-zinc-900" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            My profile
          </Link>
          <Link
            href="/producer/events"
            className={`text-sm font-medium ${
              isEvents ? "text-zinc-900" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            My events
          </Link>
          {profileSlug && (
            <Link
              href={`/producers/${profileSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              My BeatCon page
            </Link>
          )}
        </nav>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            aria-label="Account menu"
          >
            <span className="max-w-[160px] truncate sm:max-w-[220px]">{email}</span>
            <svg
              className={`h-4 w-4 shrink-0 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {dropdownOpen && (
            <div
              className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
              role="menu"
            >
              <Link
                href="/producer/password"
                role="menuitem"
                className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                onClick={() => setDropdownOpen(false)}
              >
                Change password
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="block w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
