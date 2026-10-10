import type { Metadata } from "next";
import Link from "next/link";
import { requireFacilitySession } from "@/lib/portal/permissions";
import { getActiveFacilityId } from "@/lib/portal/activeFacility";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { canCreateRides } from "@/lib/portal/permissions";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default async function PortalDashboardPage() {
  const { memberships } = await requireFacilitySession();
  const facilityId = await getActiveFacilityId(memberships);
  const membership = memberships.find((m) => m.facilityId === facilityId)!;

  const [upcoming, pendingCount, confirmedCount, needsAttentionCount, recurringCount] = await Promise.all([
    prisma.rideRequest.findMany({
      where: { facilityId, appointmentDateTime: { gte: new Date() } },
      include: { patient: true },
      orderBy: { appointmentDateTime: "asc" },
      take: 6,
    }),
    prisma.rideRequest.count({ where: { facilityId, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
    prisma.rideRequest.count({
      where: { facilityId, status: { in: ["CONFIRMED", "IN_PROGRESS"] }, appointmentDateTime: { gte: new Date() } },
    }),
    prisma.rideRequest.count({ where: { facilityId, status: "CHANGES_REQUESTED" } }),
    prisma.recurringSchedule.count({ where: { facilityId, status: "ACTIVE" } }),
  ]);

  const canCreate = canCreateRides(membership.role);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">{membership.facility.name}</h1>
        <p className="mt-1 text-sm text-slate">Dashboard overview</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Pending Requests" value={pendingCount} />
        <SummaryCard label="Confirmed Upcoming" value={confirmedCount} />
        <SummaryCard label="Needs Attention" value={needsAttentionCount} accent={needsAttentionCount > 0} />
        <SummaryCard label="Active Recurring" value={recurringCount} />
      </div>

      <div className="rounded-2xl border border-line bg-paper p-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate">Quick Actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <QuickAction href="/portal/rides/new" label="Schedule Transportation" enabled={canCreate} primary />
          <QuickAction
            href="/portal/rides/new?type=transitional-care"
            label="Request Transitional Care"
            enabled={canCreate}
          />
          <QuickAction href="/portal/recurring/new" label="Create Recurring Schedule" enabled={false} />
          <QuickAction href="/portal/rides" label="View All Rides" enabled />
          <QuickAction href="/portal/messages" label="Contact Dispatch" enabled={false} />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-paper p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate">Upcoming Transportation</h2>
          <Link href="/portal/rides" className="text-sm font-semibold text-gold-dark hover:underline">
            View all &rarr;
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <p className="mt-6 text-sm text-slate">No upcoming transportation requests.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-slate">
                  <th className="pb-2 pr-4">Request #</th>
                  <th className="pb-2 pr-4">Rider</th>
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((ride) => (
                  <tr key={ride.id} className="border-b border-line/60 last:border-0">
                    <td className="py-3 pr-4 font-semibold text-ink">
                      <Link href={`/portal/rides/${ride.id}`} className="hover:underline">
                        {ride.publicRequestNumber}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-ink">{ride.patient.name}</td>
                    <td className="py-3 pr-4 text-slate">
                      {ride.appointmentDateTime.toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="py-3 pr-4 text-slate">{formatServiceType(ride.serviceType)}</td>
                    <td className="py-3">
                      <StatusBadge status={ride.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent && value > 0 ? "border-gold bg-gold/10" : "border-line bg-paper"}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-ink">{value}</p>
    </div>
  );
}

function QuickAction({
  href,
  label,
  enabled,
  primary,
}: {
  href: string;
  label: string;
  enabled: boolean;
  primary?: boolean;
}) {
  if (!enabled) {
    return (
      <span
        className="cursor-not-allowed rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-slate/50"
        title="Coming soon"
      >
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
        primary ? "bg-gold text-ink hover:bg-gold-dark" : "border border-ink text-ink hover:bg-ink hover:text-paper"
      }`}
    >
      {label}
    </Link>
  );
}

function formatServiceType(type: string) {
  return type
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}
