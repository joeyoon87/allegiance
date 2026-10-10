import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";

export function ServiceDetail({
  eyebrow,
  title,
  description,
  includes,
  idealFor,
  note,
}: {
  eyebrow: string;
  title: string;
  description: string;
  includes: string[];
  idealFor: string[];
  note?: string;
}) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />

      <section className="py-16 lg:py-24">
        <Container className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold text-ink">What&rsquo;s Included</h2>
            <ul className="mt-5 space-y-4">
              {includes.map((item) => (
                <li key={item} className="flex items-start gap-3 text-base text-slate">
                  <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ink">Ideal For</h2>
            <ul className="mt-5 space-y-4">
              {idealFor.map((item) => (
                <li key={item} className="flex items-start gap-3 text-base text-slate">
                  <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-gold" />
                  {item}
                </li>
              ))}
            </ul>

            {note && (
              <p className="mt-8 rounded-xl border border-line bg-mist p-5 text-sm leading-relaxed text-slate">
                {note}
              </p>
            )}
          </div>
        </Container>
      </section>

      <section className="border-t border-line bg-mist py-14">
        <Container className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-extrabold text-ink">Ready to schedule?</h2>
            <p className="mt-2 text-slate">Get a ride estimate or submit a transportation request.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href="/estimate" variant="outline">
              Get a Ride Estimate
            </Button>
            <Button href="/request-ride" variant="gold">
              Request Transportation
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
