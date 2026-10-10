import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "About",
  description: "Allegiance Transportation Services is a non-emergency medical transportation provider serving the Piedmont Triad.",
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About Allegiance"
        title="Pledging Our Allegiance to Your Care."
        description="Allegiance Transportation Services provides non-emergency medical transportation across the Triad and greater Winston-Salem area, specializing in wheelchair and ambulatory transport."
      />

      <section className="py-16 lg:py-24">
        <Container className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-5 text-base leading-relaxed text-slate">
            <p>
              Allegiance was built around a simple idea: getting to a medical appointment safely
              shouldn&rsquo;t be a source of stress for patients, families, or the healthcare
              organizations coordinating their care.
            </p>
            <p>
              We specialize in wheelchair and ambulatory transportation, with the option of
              companion assistance for patients who need more than a ride. Regardless of age or
              ability, our goal is to help people get where they need to go safely and on time.
            </p>
            <p>
              As we grow, Allegiance is expanding into transitional care — helping bridge the
              gap when patients move between hospitals, rehabilitation facilities, senior living
              communities, and home.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-mist p-8">
            <h2 className="text-lg font-bold text-ink">At a Glance</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-ink">Service Area</dt>
                <dd className="mt-1 text-slate">Piedmont Triad, North Carolina</dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">Specialties</dt>
                <dd className="mt-1 text-slate">Wheelchair transport, ambulatory transport, medical appointment companions</dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">Who We Work With</dt>
                <dd className="mt-1 text-slate">
                  Patients, families, and healthcare organizations including hospitals, skilled
                  nursing facilities, assisted living communities, and outpatient clinics
                </dd>
              </div>
            </dl>
          </div>
        </Container>
      </section>

      <section className="border-t border-line bg-ink py-14 text-paper">
        <Container className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-extrabold">Want to work with us?</h2>
            <p className="mt-2 text-paper/75">Request a ride, or talk with us about a facility partnership.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href="/request-ride" variant="gold">
              Request Transportation
            </Button>
            <Button href="/healthcare-partners" variant="outline-white">
              Healthcare Partners
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
