"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePortalSession, canCreateRides } from "@/lib/portal/session";
import { apiFetch } from "@/lib/api";
import { StatusBadge } from "@/components/portal/StatusBadge";

type DashboardRide = {
  id: string;
  publicRequestNumber: string;
  patientName: string;
  appointmentDateTime: string;
  serviceType: string;
  status: string;
};

type DashboardData = {
  pendingCount: number;
  confirmedCount: number;
  needsAttentionCount: number;
  recurringCount: number;
  upcoming: DashboardRide[];
};

export default function PortalDashboardPage() {
  const { state, activeFacilityId, activeMembership } = usePortalSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeFacilityId) return;
    let cancelled = false;
    apiFetch<DashboardData>(`/portal/dashboard?facilityId=${activeFacilityId}`, { auth: true }).then(
      (result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      },
      () => {
        if (cancelled) return;
        setData(null);
        setError("Couldn't load dashboard data.");
      },
    );
    return () => {
      cancelled = true;
    };
  }, [activeFacilityId]);

  if (state.status !== "authenticated") return null;
  const canCreate = activeMembership ? canCreateRides(activeMembership.role) : false;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">{activeMembership?.facilityName}</h1>
        <p className="mt-1 text-sm text-slate">Dashboard overview</p>
      </div>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      {!data && !error ? (
        <p className="text-sm text-slate">Loading…</p>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="Pending Requests" value={data.pendingCount} />
            <SummaryCard label="Confirmed Upcoming" value={data.confirmedCount} />
            <SummaryCard label="Needs Attention" value={data.needsAttentionCount} accent={data.needsAttentionCount > 0} />
            <SummaryCard label="Active Recurring" value={data.recurringCount} />
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
                View all →
              </Link>
            </div>

            {data.upcoming.length === 0 ? (
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
                    {data.upcoming.map((ride) => (
                      <tr key={ride.id} className="border-b border-line/60 last:border-0">
                        <td className="py-3 pr-4 font-semibold text-ink">
                          <Link href={`/portal/rides/detail?id=${ride.id}`} prefetch={false} className="hover:underline">
                            {ride.publicRequestNumber}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-ink">{ride.patientName}</td>
                        <td className="py-3 pr-4 text-slate">
                          {new Date(ride.appointmentDateTime).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                        </td>
                        <td className="py-3 pr-4 text-slate">{titleCase(ride.serviceType)}</td>
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
        </>
      ) : null}
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

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}
