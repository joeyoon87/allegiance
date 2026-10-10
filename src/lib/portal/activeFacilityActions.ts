"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireFacilitySession } from "@/lib/portal/permissions";
import { ACTIVE_FACILITY_COOKIE } from "@/lib/portal/activeFacility";

export async function setActiveFacility(facilityId: string) {
  const { memberships } = await requireFacilitySession();
  const membership = memberships.find((m) => m.facilityId === facilityId);
  if (!membership) return;

  const store = await cookies();
  store.set(ACTIVE_FACILITY_COOKIE, facilityId, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/portal/dashboard");
}
