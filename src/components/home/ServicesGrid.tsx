import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SERVICES } from "@/lib/constants";

export function ServicesGrid() {
  return (
    <section className="bg-mist py-16 lg:py-24">
      <Container>
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-widest text-gold-dark">Our Services</p>
          <h2 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">
            Dependable Transportation, Matched to Every Need.
          </h2>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service, i) => (
            <Link
              key={service.slug}
              href={service.href}
              className="group flex flex-col rounded-2xl border border-line bg-paper p-6 transition-shadow hover:shadow-lg"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-sm font-bold text-gold">
                0{i + 1}
              </span>
              <h3 className="mt-5 text-lg font-bold text-ink">{service.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate">{service.short}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-gold-dark group-hover:underline">
                Learn more &rarr;
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
