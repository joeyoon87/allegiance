"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { NAV_LINKS, SITE } from "@/lib/constants";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur">
      <Container className="flex h-20 items-center justify-between">
        <Logo variant="horizontal" className="w-44 sm:w-56" priority />

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-ink/80 transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={SITE.phoneHref}
            className="text-sm font-bold text-ink hover:text-gold-dark"
            aria-label={`Call Allegiance at ${SITE.phoneDisplay}`}
          >
            {SITE.phoneDisplay}
          </a>
          <Button href="/estimate" variant="outline" className="px-4 py-2.5">
            Ride Estimate
          </Button>
          <Button href="/request-ride" variant="gold" className="px-4 py-2.5">
            Request Transportation
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-md p-2 text-ink lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
            {open ? (
              <path d="M6 6L20 20M20 6L6 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <>
                <path d="M3 7H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M3 13H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M3 19H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>
      </Container>

      {open && (
        <div className="border-t border-line bg-paper lg:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-semibold text-ink hover:bg-mist"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/portal/login"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-slate hover:bg-mist"
            >
              Facility Portal Login
            </Link>

            <div className="mt-3 flex flex-col gap-3 border-t border-line pt-4">
              <a
                href={SITE.phoneHref}
                className="flex items-center justify-center rounded-full border border-ink px-4 py-3 text-sm font-bold text-ink"
              >
                Call {SITE.phoneDisplay}
              </a>
              <Button href="/estimate" variant="outline" className="w-full">
                Get a Ride Estimate
              </Button>
              <Button href="/request-ride" variant="gold" className="w-full">
                Request Transportation
              </Button>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
