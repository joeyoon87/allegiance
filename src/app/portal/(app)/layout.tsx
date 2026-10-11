"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePortalGuard, usePortalSession } from "@/lib/portal/session";
import { Logo } from "@/components/brand/Logo";
import { FacilitySwitcher } from "@/components/portal/FacilitySwitcher";

const NAV_LINKS = [
  { href: "/portal/dashboard", label: "Dashboard", enabled: true },
  { href: "/portal/rides", label: "Rides", enabled: true },
  { href: "/portal/recurring", label: "Recurring", enabled: false },
  { href: "/portal/transitional-care", label: "Transitional Care", enabled: false },
  { href: "/portal/messages", label: "Messages", enabled: false },
  { href: "/portal/team", label: "Team", enabled: false },
  { href: "/portal/billing", label: "Billing", enabled: false },
] as const;

export default function PortalAppLayout({ children }: { children: React.ReactNode }) {
  const state = usePortalGuard();
  const { logout } = usePortalSession();
  const router = useRouter();
  const pathname = usePathname();

  if (state.status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mist">
        <p className="text-sm text-slate">Loading…</p>
      </div>
    );
  }

  function handleSignOut() {
    logout();
    router.push("/portal/login");
  }

  return (
    <div className="min-h-screen bg-mist">
      <header className="border-b border-line bg-ink text-paper">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Logo variant="horizontal" tone="light" className="w-40" />
            <span className="hidden rounded-full border border-paper/20 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-paper/70 sm:inline">
              Facility Portal
            </span>
          </div>
          <div className="flex items-center gap-4">
            <FacilitySwitcher />
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full border border-paper/30 px-4 py-1.5 text-xs font-semibold text-paper/90 hover:bg-paper/10"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5 pb-2 sm:px-6 lg:px-8">
          {NAV_LINKS.map((link) =>
            link.enabled ? (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-paper/10 hover:text-paper ${
                  pathname?.startsWith(link.href) ? "bg-paper/10 text-paper" : "text-paper/80"
                }`}
              >
                {link.label}
              </Link>
            ) : (
              <span
                key={link.href}
                className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-paper/35"
                title="Coming soon"
              >
                {link.label}
              </span>
            ),
          )}
        </nav>
      </header>

      <main id="main-content" className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
