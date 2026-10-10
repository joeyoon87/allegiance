import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy Policy" />
      <section className="py-16">
        <Container className="prose max-w-3xl text-sm leading-relaxed text-slate">
          <p className="rounded-xl border border-gold/40 bg-mist p-5 text-sm text-ink">
            <strong>Draft placeholder.</strong> This page needs review by Joe and, if handling any
            health-related information, legal counsel before publishing. It is not a substitute
            for a reviewed privacy policy.
          </p>

          <h2 className="mt-8 text-lg font-bold text-ink">Information We Collect</h2>
          <p className="mt-2">
            When you request transportation or contact us, we collect information necessary to
            schedule and provide service, such as your name, contact information, pickup and
            destination addresses, and relevant mobility or scheduling details you choose to
            share.
          </p>

          <h2 className="mt-8 text-lg font-bold text-ink">How We Use Information</h2>
          <p className="mt-2">
            Information you submit is used to schedule and coordinate your transportation, follow
            up with you about a request, and communicate with healthcare facilities you authorize
            us to coordinate with.
          </p>

          <h2 className="mt-8 text-lg font-bold text-ink">Health Information</h2>
          <p className="mt-2">
            We ask that you share only the information necessary to arrange safe transportation.
            Allegiance&rsquo;s handling of any health-related information, and whether HIPAA or a
            business associate agreement applies to a given relationship, is being reviewed and
            will be reflected here once finalized.
          </p>

          <h2 className="mt-8 text-lg font-bold text-ink">Contact</h2>
          <p className="mt-2">
            Questions about this policy can be directed to {SITE.dispatchEmail} or {SITE.phoneDisplay}.
          </p>
        </Container>
      </section>
    </>
  );
}
