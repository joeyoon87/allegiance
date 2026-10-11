"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePortalSession, canCreateRides } from "@/lib/portal/session";
import { apiFetch } from "@/lib/api";
import { RideRequestWizard } from "@/components/portal/RideRequestWizard";

type Patient = { id: string; name: string; mobilityRequirements: "AMBULATORY" | "WHEELCHAIR" };

function NewRideRequestContent() {
  const { state, activeFacilityId, activeMembership } = usePortalSession();
  const searchParams = useSearchParams();
  const defaultTransitionalCare = searchParams.get("type") === "transitional-care";
  const [patients, setPatients] = useState<Patient[] | null>(null);

  useEffect(() => {
    if (!activeFacilityId) return;
    apiFetch<Patient[]>(`/portal/patients?facilityId=${activeFacilityId}`, { auth: true })
      .then(setPatients)
      .catch(() => setPatients([]));
  }, [activeFacilityId]);

  if (state.status !== "authenticated" || !activeFacilityId) return null;

  if (activeMembership && !canCreateRides(activeMembership.role)) {
    return <p className="text-sm text-slate">Your role doesn&rsquo;t have permission to request transportation.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold text-ink">Schedule Transportation</h1>
      <p className="mt-1 text-sm text-slate">
        Submitting this request does not confirm transportation — an Allegiance dispatcher
        will review it and confirm availability and pickup time.
      </p>

      {patients === null ? (
        <p className="mt-8 text-sm text-slate">Loading…</p>
      ) : (
        <RideRequestWizard
          facilityId={activeFacilityId}
          patients={patients}
          defaultTransitionalCare={defaultTransitionalCare}
        />
      )}
    </div>
  );
}

export default function NewRideRequestPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate">Loading…</p>}>
      <NewRideRequestContent />
    </Suspense>
  );
}
