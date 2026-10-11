"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePortalSession, canCreateRides } from "@/lib/portal/session";
import { apiFetch } from "@/lib/api";
import { StatusBadge } from "@/components/portal/StatusBadge";

type RideRow = {
  id: string;
  publicRequestNumber: string;
  patientName: string;
  appointmentDateTime: string;
  serviceType: string;
  tripType: string;
  status: string;
};

const STATUS_FILTERS = [
  { value: "ALL", label: "All" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "CHANGES_REQUESTED", label: "Changes Requested" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELED", label: "Canceled" },
] as const;

const PAGE_SIZE = 20;

export default function PortalRidesPage() {
  const { state, activeFacilityId, activeMembership } = usePortalSession();
  const [rides, setRides] = useState<RideRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("ALL");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeFacilityId) return;
    let cancelled = false;
    const params = new URLSearchParams({ facilityId: activeFacilityId, page: String(page) });
    if (status !== "ALL") params.set("status", status);
    if (q) params.set("q", q);

    apiFetch<{ rides: RideRow[]; total: number }>(`/portal/rides?${params}`, { auth: true }).then(
      (data) => {
        if (cancelled) return;
        setRides(data.rides);
        setTotal(data.total);
        setError(null);
      },
      () => {
        if (cancelled) return;
        setRides(null);
        setError("Couldn't load rides.");
      },
    );
    return () => {
      cancelled = true;
    };
  }, [activeFacilityId, status, q, page]);

  if (state.status !== "authenticated") return null;
  const canCreate = activeMembership ? canCreateRides(activeMembership.role) : false;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-extrabold text-ink">Rides</h1>
        {canCreate && (
          <Link
            href="/portal/rides/new"
            className="inline-flex items-center justify-center rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-gold-dark"
          >
            Schedule Transportation
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-4 sm:flex-row sm:items-center">
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
          placeholder="Search by request # or rider name"
          className="flex-1 rounded-lg border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
        />
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="rounded-lg border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <div className="rounded-2xl border border-line bg-paper">
        {!rides ? (
          <p className="p-8 text-center text-sm text-slate">Loading…</p>
        ) : rides.length === 0 ? (
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
                      <Link href={`/portal/rides/detail?id=${ride.id}`} prefetch={false} className="hover:underline">
                        {ride.publicRequestNumber}
                      </Link>
                    </td>
                    <td className="p-4 text-ink">{ride.patientName}</td>
                    <td className="p-4 text-slate">
                      {new Date(ride.appointmentDateTime).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
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
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`rounded-full px-3 py-1.5 font-semibold ${
                p === page ? "bg-ink text-paper" : "border border-line text-ink hover:bg-mist"
              }`}
            >
              {p}
            </button>
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
