import { Container } from "@/components/ui/Container";

const REASONS = [
  "Coordinated transportation scheduling",
  "Recurring ride arrangements",
  "Wheelchair-accessible transportation",
  "Companion assistance",
  "Facility communication",
  "Flexible scheduling requests",
  "A single transportation coordination contact",
];

export function WhyChooseUs() {
  return (
    <section className="bg-mist py-16 lg:py-24">
      <Container>
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-widest text-gold-dark">Why Partner With Allegiance</p>
          <h2 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">
            Why Healthcare Organizations Choose Allegiance.
          </h2>
        </div>

        <ul className="mt-10 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {REASONS.map((reason) => (
            <li key={reason} className="flex items-center gap-3 text-base font-semibold text-ink">
              <span className="h-1.5 w-1.5 flex-none rounded-full bg-gold" />
              {reason}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
