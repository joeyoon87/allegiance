import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

const POINTS = [
  "Recurring transportation scheduling",
  "Hospital discharge transportation",
  "Facility-to-facility transfers",
  "Wheelchair transportation",
  "Appointment companion services",
  "Coordinated patient transitions",
];

export function PartnerSolutions() {
  return (
    <section className="border-y border-line bg-paper py-16 lg:py-24">
      <Container className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-gold-dark">For Healthcare Organizations</p>
          <h2 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">
            Transportation That Works With Your Care Team.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-slate">
            Allegiance supports hospitals, skilled nursing and rehabilitation facilities, assisted
            living communities, and outpatient clinics with coordinated transportation built
            around your discharge and scheduling needs.
          </p>
          <Button href="/healthcare-partners" variant="black" className="mt-7">
            Explore Healthcare Partnerships
          </Button>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {POINTS.map((point) => (
            <li
              key={point}
              className="flex items-start gap-3 rounded-xl border border-line bg-mist/60 p-5"
            >
              <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-gold text-ink">
                <svg width="13" height="10" viewBox="0 0 13 10" fill="none" aria-hidden="true">
                  <path d="M1 5L4.5 8.5L12 1" stroke="#0C0D0C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-sm font-semibold text-ink">{point}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
