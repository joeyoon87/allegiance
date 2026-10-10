import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Transitional Care",
  description:
    "Coordinated transportation and nonclinical companion support when patients move between hospitals, rehabilitation facilities, senior living communities, and home.",
};

const SCENARIOS = [
  {
    title: "Hospital Discharge",
    body: "Transportation and agreed assistance from a hospital to home or another care setting.",
  },
  {
    title: "Skilled Nursing & Rehabilitation Transitions",
    body: "Support when transferring between facilities or returning home.",
  },
  {
    title: "Medical Appointment Escorts",
    body: "Companion assistance for procedures, blood transfusions, infusion treatments, outpatient surgery, and other appointments.",
  },
  {
    title: "Limited Post-Arrival Support",
    body: "Depending on the service arrangement, companions may assist after arrival to help complete the transition.",
  },
];

const RESPONSIBILITIES = [
  "Accompanying patients into facilities",
  "Assisting with check-in",
  "Waiting during appointments",
  "Escorting patients to their destination",
  "Coordinating arrival and handoff with designated contacts",
  "Providing agreed limited post-arrival assistance",
];

export default function TransitionalCarePage() {
  return (
    <>
      <PageHeader
        eyebrow="Transitional Care"
        title="Support Beyond the Ride."
        description="Patients may require more than transportation when transitioning between care settings or attending medical procedures. Allegiance helps bridge that gap through coordinated transportation and nonclinical accompaniment."
      />

      <section className="py-16 lg:py-24">
        <Container>
          <h2 className="text-2xl font-extrabold text-ink">Common Transition Scenarios</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {SCENARIOS.map((s) => (
              <div key={s.title} className="rounded-2xl border border-line bg-paper p-7">
                <h3 className="text-lg font-bold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate">{s.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-ink py-16 text-paper lg:py-24">
        <Container className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-2xl font-extrabold">Companion Responsibilities</h2>
            <p className="mt-3 max-w-md text-paper/70">
              Nonclinical activities a companion may provide as part of an agreed transitional
              care arrangement.
            </p>
            <ul className="mt-6 space-y-3">
              {RESPONSIBILITIES.map((item) => (
                <li key={item} className="flex items-start gap-3 text-base text-paper/90">
                  <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-gold/30 bg-charcoal p-7">
            <h3 className="text-lg font-bold text-gold">Important Scope Note</h3>
            <p className="mt-3 text-sm leading-relaxed text-paper/80">
              Allegiance provides non-emergency transportation and nonclinical companion
              assistance. We do not provide medical interpretation, clinical supervision,
              medication administration, personal care, or other regulated services without
              verified authorization.
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-mist py-16 lg:py-24">
        <Container className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-2xl font-extrabold text-ink">Discuss a Transition</h2>
            <p className="mt-2 max-w-md text-slate">
              Request transitional care for a patient, refer someone you&rsquo;re caring for, or
              talk with us about a facility partnership.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href="/request-ride?type=transitional-care" variant="black">
              Request Transitional Care
            </Button>
            <Button href="/contact?topic=referral" variant="outline">
              Refer a Patient
            </Button>
            <Button href="/healthcare-partners" variant="gold">
              Discuss a Facility Partnership
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
