import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { RideRequestForm } from "@/components/forms/RideRequestForm";
import { OPERATING_HOURS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Request Transportation",
  description: "Submit a non-emergency medical transportation request with Allegiance Transportation Services.",
};

export default function RequestRidePage() {
  return (
    <>
      <PageHeader
        eyebrow="Request Transportation"
        title="Request a Ride."
        description="Submitting this form requests transportation — it does not confirm a ride. A dispatcher will follow up to confirm availability and pricing."
      />
      <section className="py-16 lg:py-24">
        <Container className="grid gap-10 lg:grid-cols-[1fr_320px] lg:gap-14">
          <RideRequestForm />

          <aside className="space-y-6">
            <div className="rounded-2xl border border-line bg-mist p-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Operating Hours</h2>
              <p className="mt-3 text-sm text-slate">Office: {OPERATING_HOURS.office}</p>
              <p className="mt-1 text-sm text-slate">Transportation: {OPERATING_HOURS.transportation}</p>
              <p className="mt-3 text-xs text-slate">{OPERATING_HOURS.afterHours}</p>
            </div>
          </aside>
        </Container>
      </section>
    </>
  );
}
