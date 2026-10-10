import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/lib/constants";

export function FinalCta() {
  return (
    <section className="bg-gold">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:py-20">
        <div>
          <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">Need Transportation?</h2>
          <p className="mt-3 text-base text-ink/80">
            Request a ride or call{" "}
            <a href={SITE.phoneHref} className="font-bold underline underline-offset-2">
              {SITE.phoneDisplay}
            </a>
            .
          </p>
          <Button href="/request-ride" variant="black" className="mt-6">
            Request Transportation
          </Button>
        </div>

        <div className="sm:border-l sm:border-ink/15 sm:pl-10">
          <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">Represent a Healthcare Facility?</h2>
          <p className="mt-3 text-base text-ink/80">
            Explore recurring transportation and partnership solutions.
          </p>
          <Button href="/healthcare-partners" variant="outline" className="mt-6 border-ink text-ink hover:bg-ink hover:text-paper">
            Partner With Allegiance
          </Button>
        </div>
      </Container>
    </section>
  );
}
