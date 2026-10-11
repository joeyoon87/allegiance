import type { Context, Next } from "hono";
import type { Env, Variables } from "../types";
import { verifySessionToken } from "./session";

/** Verifies the Bearer token and stashes userId on the context. 401s otherwise. */
export async function requireAuth(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) {
  const header = c.req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return c.json({ message: "Not signed in." }, 401);

  const payload = await verifySessionToken(token, c.env.SESSION_SECRET);
  if (!payload) return c.json({ message: "Session expired. Please sign in again." }, 401);

  c.set("userId", payload.userId);
  await next();
}

/** Loads the caller's ACTIVE memberships; 403s if they don't belong to the
 *  requested facilityId. Never trusts facilityId without this check. */
export async function requireFacilityMembership(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  facilityId: string,
): Promise<{ role: string } | null> {
  const userId = c.get("userId");
  const row = await c.env.DB.prepare(
    `SELECT role FROM facility_memberships WHERE user_id = ? AND facility_id = ? AND status = 'ACTIVE'`,
  )
    .bind(userId, facilityId)
    .first<{ role: string }>();
  return row ?? null;
}
