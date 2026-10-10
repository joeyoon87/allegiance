import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";
import { FOOTER_LEGAL_LINKS, NAV_LINKS, OPERATING_HOURS, SERVICE_AREA_CITIES, SITE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <Container className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo variant="stacked" tone="light" className="w-28" />
          <p className="mt-5 text-sm leading-relaxed text-paper/70">
            Non-emergency medical transportation, wheelchair transport, and medical appointment
            companion services throughout the Piedmont Triad.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gold">Company</h3>
          <ul className="mt-4 space-y-3">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-paper/80 hover:text-paper">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/portal/login" className="text-sm text-paper/80 hover:text-paper">
                Facility Portal
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gold">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm text-paper/80">
            <li>
              <a href={SITE.phoneHref} className="hover:text-paper">
                {SITE.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${SITE.dispatchEmail}`} className="hover:text-paper">
                {SITE.dispatchEmail}
              </a>
            </li>
            <li className="pt-2 text-paper/60">Office hours: {OPERATING_HOURS.office}</li>
            <li className="text-paper/60">Transportation: {OPERATING_HOURS.transportation}</li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gold">Service Area</h3>
          <p className="mt-4 text-sm leading-relaxed text-paper/80">{SERVICE_AREA_CITIES.join(", ")}</p>
          <Link href="/service-area" className="mt-3 inline-block text-sm font-semibold text-gold hover:text-gold-dark">
            View full service area &rarr;
          </Link>
        </div>
      </Container>

      <div className="border-t border-paper/10">
        <Container className="flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-xs text-paper/60">
            &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <div className="flex gap-6">
            {FOOTER_LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-xs text-paper/60 hover:text-paper">
                {link.label}
              </Link>
            ))}
          </div>
        </Container>
      </div>
    </footer>
  );
}
