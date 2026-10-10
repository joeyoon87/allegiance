import { cookies } from "next/headers";
import type { ActiveMembership } from "@/lib/portal/permissions";

export const ACTIVE_FACILITY_COOKIE = "active_facility_id";

/**
 * Resolves which facility a multi-facility user is currently viewing.
 * Only ever returns a facilityId the user is actually an ACTIVE member of
 * (falls back to their first membership) — the cookie is just a UX
 * convenience, never trusted as authorization on its own. Server-only
 * (uses next/headers) — the mutating half of this lives in
 * activeFacilityActions.ts so client components can import that half
 * without pulling this one in too.
 */
export async function getActiveFacilityId(memberships: ActiveMembership[]): Promise<string> {
  const store = await cookies();
  const cookieValue = store.get(ACTIVE_FACILITY_COOKIE)?.value;
  const match = memberships.find((m) => m.facilityId === cookieValue);
  return (match ?? memberships[0]).facilityId;
}
