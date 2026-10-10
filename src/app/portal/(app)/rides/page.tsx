import type { Metadata } from "next";
import Link from "next/link";
import { requireFacilitySession, canCreateRides } from "@/lib/portal/permissions";
import { getActiveFacilityId } from "@/lib/portal/activeFacility";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/portal/StatusBadge";
import type { RideRequestStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Rides", robots: { index: false } };

const STATUS_FILTERS: { value: RideRequestStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "CHANGES_REQUESTED", label: "Changes Requested" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELED", label: "Canceled" },
];

const PAGE_SIZE = 20;

export default async function PortalRidesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; q?: string }>;
}) {
  const { memberships } = await requireFacilitySession();
  const facilityId = await getActiveFacilityId(memberships);
  const membership = memberships.find((m) => m.facilityId === facilityId)!;

  const { status, page: pageParam, q } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const statusFilter = STATUS_FILTERS.some((f) => f.value === status) ? status : "ALL";

  const where = {
    facilityId,
    ...(statusFilter !== "ALL" ? { status: statusFilter as RideRequestStatus } : {}),
    ...(q
      ? {
          OR: [
            { publicRequestNumber: { contains: q, mode: "insensitive" as const } },
            { patient: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [rides, total] = await Promise.all([
    prisma.rideRequest.findMany({
      where,
      include: { patient: true },
      orderBy: { appointmentDateTime: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.rideRequest.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-extrabold text-ink">Rides</h1>
        {canCreateRides(membership.role) && (
          <Link
            href="/portal/rides/new"
            className="inline-flex items-center justify-center rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-gold-dark"
          >
            Schedule Transportation
          </Link>
        )}
      </div>

      <form className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-4 sm:flex-row sm:items-center">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by request # or rider name"
          className="flex-1 rounded-lg border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
        />
        <select
          name="status"
          defaultValue={statusFilter}
          className="rounded-lg border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg border border-ink px-4 py-2 text-sm font-semibold text-ink hover:bg-ink hover:text-paper"
        >
          Filter
        </button>
      </form>

      <div className="rounded-2xl border border-line bg-paper">
        {rides.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate">No ride requests match these filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-slate">
                  <th className="p-4">Request #</th>
                  <th className="p-4">Rider</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Service</th>
                  <th className="p-4">Trip</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {rides.map((ride) => (
                  <tr key={ride.id} className="border-b border-line/60 last:border-0 hover:bg-mist/50">
                    <td className="p-4 font-semibold text-ink">
                      <Link href={`/portal/rides/${ride.id}`} className="hover:underline">
                        {ride.publicRequestNumber}
                      </Link>
                    </td>
                    <td className="p-4 text-ink">{ride.patient.name}</td>
                    <td className="p-4 text-slate">
                      {ride.appointmentDateTime.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                    </td>
                    <td className="p-4 text-slate">{titleCase(ride.serviceType)}</td>
                    <td className="p-4 text-slate">{ride.tripType === "ROUND_TRIP" ? "Round trip" : "One-way"}</td>
                    <td className="p-4">
                      <StatusBadge status={ride.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/portal/rides?page=${p}${statusFilter !== "ALL" ? `&status=${statusFilter}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`rounded-full px-3 py-1.5 font-semibold ${
                p === page ? "bg-ink text-paper" : "border border-line text-ink hover:bg-mist"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
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
