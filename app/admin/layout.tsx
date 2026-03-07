import { auth, signOut } from "@/lib/auth";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-zinc-50">
      {session && (
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <nav className="flex items-center gap-6">
              <Link href="/admin" className="font-medium text-zinc-900 hover:text-zinc-600">
                Dashboard
              </Link>
              <Link href="/admin/events" className="text-zinc-600 hover:text-zinc-900">
                Events
              </Link>
              <Link href="/admin/users" className="text-zinc-600 hover:text-zinc-900">
                Users
              </Link>
              <Link href="/admin/import/producers" className="text-zinc-600 hover:text-zinc-900">
                Import producers
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-500">{session.user?.email}</span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/admin/login" });
                }}
              >
                <button type="submit" className="text-sm text-zinc-600 hover:text-zinc-900">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </header>
      )}
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
