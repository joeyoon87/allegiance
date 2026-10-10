import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SERVICE_AREA_CITIES, SERVICE_AREA_COUNTIES } from "@/lib/constants";

export function ServiceAreaSection() {
  return (
    <section className="bg-paper py-16 lg:py-24">
      <Container className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-gold-dark">Service Area</p>
          <h2 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">
            Serving the Piedmont Triad.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-slate">
            Allegiance serves {SERVICE_AREA_COUNTIES.join(", ")}. Need transportation outside our
            direct service area? Special accommodations can often be made &mdash; contact us to check
            availability.
          </p>
          <Button href="/service-area" variant="outline" className="mt-7">
            Check Transportation Availability
          </Button>
        </div>

        <div className="rounded-2xl border border-line bg-mist p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate">Priority Cities</p>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3">
            {SERVICE_AREA_CITIES.map((city) => (
              <li key={city} className="text-base font-semibold text-ink">
                {city}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
