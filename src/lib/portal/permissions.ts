import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { FacilityRole } from "@prisma/client";

export type ActiveMembership = Awaited<ReturnType<typeof loadActiveMemberships>>[number];

async function loadActiveMemberships(userId: string) {
  return prisma.facilityMembership.findMany({
    where: { userId, status: "ACTIVE" },
    include: { facility: true },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Every /portal/* page/action starts here. Resolves the session server-side
 * (never trust a client-supplied userId/facilityId) and loads only the
 * facility memberships that are actually ACTIVE for this user.
 */
export async function requireFacilitySession() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/portal/login");
  }

  const memberships = await loadActiveMemberships(session.user.id);
  if (memberships.length === 0) {
    redirect("/portal/login?error=no-access");
  }

  return { userId: session.user.id, memberships };
}

/**
 * Scopes a request to one specific facility. `facilityId` may come from a
 * route param or query string, so it's untrusted input — this throws a
 * generic 404 (not a 403) when the user isn't a member, so we don't leak
 * whether the facility exists to someone probing IDs.
 */
export async function requireFacilityAccess(facilityId: string) {
  const { userId, memberships } = await requireFacilitySession();
  const membership = memberships.find((m) => m.facilityId === facilityId);
  if (!membership) {
    notFound();
  }
  return { userId, membership, memberships };
}

export function canCreateRides(role: FacilityRole) {
  return role === "FACILITY_ADMIN" || role === "FACILITY_SCHEDULER";
}

export function canManageTeam(role: FacilityRole) {
  return role === "FACILITY_ADMIN";
}

export function canRequestChanges(role: FacilityRole) {
  return role === "FACILITY_ADMIN" || role === "FACILITY_SCHEDULER";
}
