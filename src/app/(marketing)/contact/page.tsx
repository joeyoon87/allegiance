import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContactForm } from "@/components/forms/ContactForm";
import { OPERATING_HOURS, SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Allegiance Transportation Services — phone, email, and office hours.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Get in Touch."
        description="Questions about a ride, a facility partnership, or anything else — reach out and we'll follow up."
      />

      <section className="py-16 lg:py-24">
        <Container className="grid gap-12 lg:grid-cols-[1fr_320px] lg:gap-14">
          <ContactForm defaultTopic={topic} />

          <aside className="space-y-6">
            <div className="rounded-2xl border border-line bg-mist p-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Direct Contact</h2>
              <p className="mt-3 text-sm text-slate">
                <a href={SITE.phoneHref} className="font-semibold text-ink">
                  {SITE.phoneDisplay}
                </a>
              </p>
              <p className="mt-1 text-sm text-slate">
                <a href={`mailto:${SITE.dispatchEmail}`} className="font-semibold text-ink">
                  {SITE.dispatchEmail}
                </a>
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-mist p-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Hours</h2>
              <p className="mt-3 text-sm text-slate">Office: {OPERATING_HOURS.office}</p>
              <p className="mt-1 text-sm text-slate">Transportation: {OPERATING_HOURS.transportation}</p>
            </div>
          </aside>
        </Container>
      </section>
    </>
  );
}
