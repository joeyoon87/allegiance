"use client";

import { setActiveFacility } from "@/lib/portal/activeFacilityActions";
import type { ActiveMembership } from "@/lib/portal/permissions";

export function FacilitySwitcher({ memberships }: { memberships: ActiveMembership[] }) {
  if (memberships.length <= 1) {
    return (
      <span className="hidden text-sm font-semibold text-paper/90 sm:inline">
        {memberships[0]?.facility.name}
      </span>
    );
  }

  return (
    <form
      action={async (formData) => {
        const facilityId = formData.get("facilityId");
        if (typeof facilityId === "string") {
          await setActiveFacility(facilityId);
        }
      }}
    >
      <select
        name="facilityId"
        defaultValue={memberships[0]?.facilityId}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-lg border border-paper/30 bg-ink px-3 py-1.5 text-sm font-semibold text-paper"
        aria-label="Switch facility"
      >
        {memberships.map((m) => (
          <option key={m.facilityId} value={m.facilityId} className="text-ink">
            {m.facility.name}
          </option>
        ))}
      </select>
    </form>
  );
}
