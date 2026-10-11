"use client";

import { usePortalSession } from "@/lib/portal/session";

export function FacilitySwitcher() {
  const { state, activeFacilityId, setActiveFacilityId } = usePortalSession();
  if (state.status !== "authenticated") return null;
  const { memberships } = state;

  if (memberships.length <= 1) {
    return <span className="hidden text-sm font-semibold text-paper/90 sm:inline">{memberships[0]?.facilityName}</span>;
  }

  return (
    <select
      value={activeFacilityId ?? ""}
      onChange={(e) => setActiveFacilityId(e.target.value)}
      className="rounded-lg border border-paper/30 bg-ink px-3 py-1.5 text-sm font-semibold text-paper"
      aria-label="Switch facility"
    >
      {memberships.map((m) => (
        <option key={m.facilityId} value={m.facilityId} className="text-ink">
          {m.facilityName}
        </option>
      ))}
    </select>
  );
}
