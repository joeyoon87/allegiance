import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/lib/constants";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-mist">
      <Container className="grid gap-12 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-gold-dark">
            Non-Emergency Medical Transportation &middot; Piedmont Triad
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] text-ink sm:text-5xl lg:text-[3.25rem]">
            {SITE.tagline}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate">
            Reliable wheelchair transportation, coordinated patient transitions, and medical
            appointment companion services for healthcare organizations, patients, and families
            throughout the Piedmont Triad.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button href="/healthcare-partners" variant="black">
              Partner With Allegiance
            </Button>
            <Button href="/request-ride" variant="gold">
              Request Transportation
            </Button>
          </div>

          <Button href="/estimate" variant="ghost" className="mt-5 !px-0 !py-0 text-base underline underline-offset-4">
            Get a Ride Estimate &rarr;
          </Button>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line bg-paper shadow-xl">
            <Image
              src="/images/hero-driver-wheelchair-assist.webp"
              alt="An Allegiance driver assisting a rider in a wheelchair at a facility entrance, with an Allegiance transport van parked alongside"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          </div>
          <div className="absolute -bottom-6 -left-6 hidden rounded-xl border border-line bg-paper px-6 py-4 shadow-lg sm:block">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate">Serving</p>
            <p className="font-heading text-lg font-bold text-ink">The Piedmont Triad</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
