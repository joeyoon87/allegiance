import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { OPERATING_HOURS, SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Terms of Service" />
      <section className="py-16">
        <Container className="prose max-w-3xl text-sm leading-relaxed text-slate">
          <p className="rounded-xl border border-gold/40 bg-mist p-5 text-sm text-ink">
            <strong>Draft placeholder.</strong> This page needs review by Joe and legal counsel
            (especially cancellation, no-show, and liability language) before publishing.
          </p>

          <h2 className="mt-8 text-lg font-bold text-ink">Requesting Transportation</h2>
          <p className="mt-2">
            Submitting an online request does not confirm transportation. Allegiance confirms
            availability, pickup time, and pricing directly before a ride is scheduled.
          </p>

          <h2 className="mt-8 text-lg font-bold text-ink">Scheduling</h2>
          <p className="mt-2">
            Transportation operates {OPERATING_HOURS.transportation}. Requests made with less than
            24 hours&rsquo; notice may be subject to an additional fee and are not guaranteed.
          </p>

          <h2 className="mt-8 text-lg font-bold text-ink">Cancellations &amp; No-Shows</h2>
          <p className="mt-2">
            Late cancellations and no-shows may be billed the cost of one-way transportation.
            Exact cancellation windows are confirmed by dispatch at the time of scheduling.
          </p>

          <h2 className="mt-8 text-lg font-bold text-ink">Scope of Service</h2>
          <p className="mt-2">
            Allegiance provides non-emergency transportation and nonclinical companion
            assistance. We do not provide clinical care, medical supervision, or emergency
            medical services.
          </p>

          <h2 className="mt-8 text-lg font-bold text-ink">Contact</h2>
          <p className="mt-2">
            Questions about these terms can be directed to {SITE.dispatchEmail} or {SITE.phoneDisplay}.
          </p>
        </Container>
      </section>
    </>
  );
}
