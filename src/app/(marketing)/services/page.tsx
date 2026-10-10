import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { SERVICES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Transportation Services",
  description:
    "Wheelchair transportation, ambulatory transportation, medical appointment companions, and transitional care across the Piedmont Triad.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Transportation Matched to Every Need."
        description="From door-to-door ambulatory rides to wheelchair transportation and full companion support, Allegiance coordinates the right level of assistance for every trip."
      />

      <section className="py-16 lg:py-24">
        <Container className="grid gap-6 sm:grid-cols-2">
          {SERVICES.map((service, i) => (
            <Link
              key={service.slug}
              href={service.href}
              className="group flex flex-col rounded-2xl border border-line bg-paper p-8 transition-shadow hover:shadow-lg"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-sm font-bold text-gold">
                0{i + 1}
              </span>
              <h2 className="mt-5 text-xl font-bold text-ink">{service.name}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate">{service.short}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-gold-dark group-hover:underline">
                Learn more &rarr;
              </span>
            </Link>
          ))}
        </Container>
      </section>

      <section className="border-t border-line bg-ink py-14 text-paper">
        <Container className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-extrabold">Not sure which service fits?</h2>
            <p className="mt-2 text-paper/75">Call dispatch and we&rsquo;ll help you figure out the right level of assistance.</p>
          </div>
          <Button href="/request-ride" variant="gold">
            Request Transportation
          </Button>
        </Container>
      </section>
    </>
  );
}
