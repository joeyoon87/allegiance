import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { FacilityPartnerForm } from "@/components/forms/FacilityPartnerForm";

export const metadata: Metadata = {
  title: "Healthcare Partners",
  description:
    "Coordinated transportation scheduling for hospitals, skilled nursing facilities, assisted living communities, and outpatient clinics across the Piedmont Triad.",
};

const AUDIENCES = [
  "Hospitals & discharge planners",
  "Skilled nursing & rehabilitation facilities",
  "Assisted living & senior living communities",
  "Outpatient surgery, infusion & specialty clinics",
];

const BENEFITS = [
  "Recurring transportation scheduling",
  "Coordinated facility transfers",
  "Wheelchair transportation",
  "Patient accompaniment",
  "Centralized scheduling requests",
  "Facility-specific arrangements",
  "Negotiated pricing where applicable",
];

export default function HealthcarePartnersPage() {
  return (
    <>
      <PageHeader
        eyebrow="Healthcare Partners"
        title="A Better Way to Coordinate Patient Transportation."
        description="Allegiance works with healthcare organizations across the Piedmont Triad to coordinate recurring transportation, facility transfers, and companion support for patients in your care."
      />

      <section className="py-14">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate">
            Organizations we work with
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCES.map((a) => (
              <div key={a} className="rounded-xl border border-line bg-mist p-5 text-sm font-semibold text-ink">
                {a}
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-paper py-16 lg:py-24">
        <Container className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-2xl font-extrabold text-ink">Partner Benefits</h2>
            <ul className="mt-6 space-y-4">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3 text-base text-slate">
                  <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-gold" />
                  {b}
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-xl border border-line bg-mist p-5 text-sm leading-relaxed text-slate">
              Customized pricing may be available for qualifying recurring transportation
              relationships. Contact us to discuss your facility&rsquo;s volume and needs.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-line bg-mist p-7">
            <h2 className="text-lg font-bold text-ink">Three Ways to Get Started</h2>
            <div className="rounded-xl border border-line bg-paper p-5">
              <h3 className="font-semibold text-ink">Become a Facility Partner</h3>
              <p className="mt-1 text-sm text-slate">Tell us about your organization below.</p>
            </div>
            <div className="rounded-xl border border-line bg-paper p-5">
              <h3 className="font-semibold text-ink">Request Facility Transportation</h3>
              <p className="mt-1 text-sm text-slate">Already working with us? Submit a transportation request.</p>
              <Button href="/request-ride" variant="outline" className="mt-3">
                Request Transportation
              </Button>
            </div>
            <div className="rounded-xl border border-line bg-paper p-5">
              <h3 className="font-semibold text-ink">Existing Facility Login</h3>
              <p className="mt-1 text-sm text-slate">Approved partners can access the facility portal.</p>
              <Button href="/portal/login" variant="ghost" className="mt-2 !px-0">
                Facility Portal Login &rarr;
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <section id="become-a-partner" className="bg-mist py-16 lg:py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">Become a Facility Partner</h2>
            <p className="mt-3 text-slate">
              Share a few details and our team will follow up to discuss a transportation
              partnership tailored to your facility.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-3xl">
            <FacilityPartnerForm />
          </div>
        </Container>
      </section>
    </>
  );
}
