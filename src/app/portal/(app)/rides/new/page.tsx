import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireFacilitySession, canCreateRides } from "@/lib/portal/permissions";
import { getActiveFacilityId } from "@/lib/portal/activeFacility";
import { prisma } from "@/lib/db";
import { RideRequestWizard } from "@/components/portal/RideRequestWizard";

export const metadata: Metadata = { title: "Schedule Transportation", robots: { index: false } };

export default async function NewRideRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { memberships } = await requireFacilitySession();
  const facilityId = await getActiveFacilityId(memberships);
  const membership = memberships.find((m) => m.facilityId === facilityId)!;

  if (!canCreateRides(membership.role)) {
    notFound();
  }

  const { type } = await searchParams;

  const patients = await prisma.patient.findMany({
    where: { facilityId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, mobilityRequirements: true },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold text-ink">Schedule Transportation</h1>
      <p className="mt-1 text-sm text-slate">
        Submitting this request does not confirm transportation — an Allegiance dispatcher
        will review it and confirm availability and pickup time.
      </p>

      <RideRequestWizard
        facilityId={facilityId}
        patients={patients}
        defaultTransitionalCare={type === "transitional-care"}
      />
    </div>
  );
}
