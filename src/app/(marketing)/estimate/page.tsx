import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { EstimatorForm } from "@/components/estimate/EstimatorForm";

export const metadata: Metadata = {
  title: "Ride Estimate",
  description: "Get an estimated transportation cost before requesting a ride with Allegiance.",
};

export default function EstimatePage() {
  return (
    <>
      <PageHeader
        eyebrow="Ride Estimate"
        title="Get an Estimated Transportation Cost."
        description="This tool gives you a working estimate before you request a ride. Final pricing is always confirmed by an Allegiance dispatcher."
      />
      <section className="py-16 lg:py-24">
        <Container>
          <EstimatorForm />
        </Container>
      </section>
    </>
  );
}
