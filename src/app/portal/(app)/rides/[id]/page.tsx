import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireFacilitySession } from "@/lib/portal/permissions";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = { title: "Ride Request", robots: { index: false } };

export default async function RideRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { memberships } = await requireFacilitySession();
  const facilityIds = memberships.map((m) => m.facilityId);

  const ride = await prisma.rideRequest.findFirst({
    // Scoped to facilities this user actually belongs to — a stranger's
    // request id returns 404, never a 403 that would confirm it exists.
    where: { id, facilityId: { in: facilityIds } },
    include: {
      patient: true,
      legs: { orderBy: { sequence: "asc" } },
      companionRequest: true,
      statusEvents: { orderBy: { createdAt: "asc" }, include: { actor: true } },
      facility: true,
    },
  });

  if (!ride) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/portal/rides" className="text-sm font-semibold text-slate hover:text-ink">
          &larr; Back to rides
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold text-ink">{ride.publicRequestNumber}</h1>
          <StatusBadge status={ride.status} />
        </div>
        <p className="mt-1 text-sm text-slate">{ride.facility.name}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Rider">
            <DataRow label="Name" value={ride.patient.name} />
            <DataRow label="Mobility" value={titleCase(ride.patient.mobilityRequirements)} />
            {ride.patient.authorizedContactName && (
              <DataRow label="Authorized Contact" value={ride.patient.authorizedContactName} />
            )}
            {ride.patient.authorizedContactPhone && (
              <DataRow label="Contact Phone" value={ride.patient.authorizedContactPhone} />
            )}
            {ride.additionalPassengers > 0 && (
              <DataRow label="Additional Passengers" value={String(ride.additionalPassengers)} />
            )}
          </Section>

          <Section title="Transportation">
            <DataRow label="Service Type" value={titleCase(ride.serviceType)} />
            <DataRow label="Trip Type" value={ride.tripType === "ROUND_TRIP" ? "Round trip" : "One-way"} />
            <DataRow label="Urgency" value={titleCase(ride.urgency)} />
            <DataRow
              label="Appointment"
              value={ride.appointmentDateTime.toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}
            />
            {ride.specialInstructions && <DataRow label="Special Instructions" value={ride.specialInstructions} />}
          </Section>

          <Section title="Legs">
            <div className="space-y-4">
              {ride.legs.map((leg) => (
                <div key={leg.id} className="rounded-xl border border-line p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gold-dark">
                    {leg.sequence === 1 ? "Outbound" : "Return"}
                  </p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold text-slate">Pickup</p>
                      <p className="text-sm text-ink">
                        {leg.pickupAddressLine1}, {leg.pickupCity}, {leg.pickupState} {leg.pickupZip}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate">Destination</p>
                      <p className="text-sm text-ink">
                        {leg.destinationAddressLine1}, {leg.destinationCity}, {leg.destinationState} {leg.destinationZip}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <DataRow
                      label="Requested Pickup"
                      value={leg.requestedPickupTime.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                    />
                    <DataRow
                      label="Confirmed Pickup"
                      value={
                        leg.confirmedPickupTime
                          ? leg.confirmedPickupTime.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
                          : "Pending dispatcher confirmation"
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {ride.companionRequest && (
            <Section title="Companion / Transitional Care">
              <DataRow label="Service Type" value={titleCase(ride.companionRequest.companionServiceType)} />
              <DataRow label="Requested Assistance" value={ride.companionRequest.requestedAssistance} />
              {ride.companionRequest.estimatedDurationMinutes != null && (
                <DataRow label="Estimated Duration" value={`${ride.companionRequest.estimatedDurationMinutes} min`} />
              )}
              {ride.companionRequest.pickupHandoffContactName && (
                <DataRow
                  label="Pickup Handoff Contact"
                  value={`${ride.companionRequest.pickupHandoffContactName}${ride.companionRequest.pickupHandoffContactPhone ? ` · ${ride.companionRequest.pickupHandoffContactPhone}` : ""}`}
                />
              )}
              {ride.companionRequest.destinationHandoffContactName && (
                <DataRow
                  label="Destination Handoff Contact"
                  value={`${ride.companionRequest.destinationHandoffContactName}${ride.companionRequest.destinationHandoffContactPhone ? ` · ${ride.companionRequest.destinationHandoffContactPhone}` : ""}`}
                />
              )}
              <DataRow
                label="Post-Arrival Assistance"
                value={ride.companionRequest.postArrivalAssistanceRequested ? "Requested" : "Not requested"}
              />
              <DataRow label="Dispatcher Review" value={titleCase(ride.companionRequest.reviewStatus)} />
            </Section>
          )}
        </div>

        <div className="space-y-6">
          <Section title="Status History">
            <ol className="space-y-4">
              {ride.statusEvents.map((event) => (
                <li key={event.id} className="border-l-2 border-line pl-4">
                  <p className="text-sm font-semibold text-ink">{titleCase(event.newStatus)}</p>
                  <p className="text-xs text-slate">
                    {event.createdAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                  {event.reason && <p className="mt-1 text-xs text-slate">{event.reason}</p>}
                </li>
              ))}
            </ol>
          </Section>

          <div className="rounded-2xl border border-line bg-mist p-5">
            <h3 className="text-sm font-bold text-ink">Need a change or cancellation?</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate">
              Changes to a confirmed trip require dispatcher approval. Call dispatch to request a
              change — in-portal change requests are coming soon.
            </p>
            <a
              href={SITE.phoneHref}
              className="mt-3 inline-flex items-center justify-center rounded-full border border-ink px-4 py-2 text-xs font-semibold text-ink hover:bg-ink hover:text-paper"
            >
              Call {SITE.phoneDisplay}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate">{title}</h2>
      <div className="mt-4 space-y-2">{children}</div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 text-sm sm:flex-row sm:items-baseline sm:justify-between">
      <span className="text-slate">{label}</span>
      <span className="font-semibold text-ink sm:text-right">{value}</span>
    </div>
  );
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}
