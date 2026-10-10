import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { SERVICE_AREA_CITIES, SERVICE_AREA_COUNTIES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Service Area",
  description: "Allegiance Transportation Services covers the Piedmont Triad, including Winston-Salem, Greensboro, High Point, and surrounding counties.",
};

export default function ServiceAreaPage() {
  return (
    <>
      <PageHeader
        eyebrow="Service Area"
        title="Serving the Piedmont Triad."
        description="Allegiance provides transportation throughout the Triad and greater Winston-Salem area. Need to travel outside our direct service area? Special accommodations can often be made."
      />

      <section className="py-16 lg:py-24">
        <Container className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-lg font-bold text-ink">Counties We Serve</h2>
            <ul className="mt-5 grid grid-cols-2 gap-3">
              {SERVICE_AREA_COUNTIES.map((c) => (
                <li key={c} className="rounded-lg border border-line bg-mist px-4 py-3 text-sm font-semibold text-ink">
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold text-ink">Priority Cities</h2>
            <ul className="mt-5 grid grid-cols-2 gap-3">
              {SERVICE_AREA_CITIES.map((c) => (
                <li key={c} className="rounded-lg border border-line bg-mist px-4 py-3 text-sm font-semibold text-ink">
                  {c}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-slate">
              Traveling outside our direct service area? Contact us — special accommodations can
              often be made.
            </p>
          </div>
        </Container>
      </section>

      <section className="border-t border-line bg-mist py-14">
        <Container className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <h2 className="text-2xl font-extrabold text-ink">Check availability in your area</h2>
          <Button href="/contact" variant="black">
            Contact Us
          </Button>
        </Container>
      </section>
    </>
  );
}
