import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

const EXAMPLES = [
  "Hospital-to-home transitions",
  "Hospital-to-skilled-nursing transfers",
  "Rehabilitation discharges",
  "Outpatient surgery escorts",
  "Blood transfusion and infusion appointments",
  "Return-home accompaniment",
];

export function TransitionalCareSpotlight() {
  return (
    <section className="bg-ink py-16 text-paper lg:py-24">
      <Container className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-gold">A Key Differentiator</p>
          <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">From One Care Setting to the Next.</h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-paper/75">
            Allegiance combines transportation with companion assistance to help patients
            navigate transitions between hospitals, rehabilitation facilities, senior living
            communities, outpatient appointments, and home.
          </p>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-paper/60">
            Limited post-arrival assistance may be available depending on the agreed service
            arrangement.
          </p>
          <Button href="/transitional-care" variant="gold" className="mt-7">
            Explore Transitional Care
          </Button>
        </div>

        <ul className="grid gap-3 border-l-2 border-gold/40 pl-6">
          {EXAMPLES.map((item) => (
            <li key={item} className="text-base font-medium text-paper/90">
              {item}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
