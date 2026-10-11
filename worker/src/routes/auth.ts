import { Hono } from "hono";
import type { Env, Variables } from "../types";
import { verifyPassword } from "../lib/password";
import { createSessionToken } from "../lib/session";
import { requireAuth } from "../lib/auth-middleware";

export const authRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

authRoutes.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) return c.json({ message: "Email and password are required." }, 400);

  const user = await c.env.DB.prepare(`SELECT * FROM users WHERE email = ? AND status = 'ACTIVE'`).bind(email).first<{
    id: string;
    name: string;
    email: string;
    password_hash: string;
  }>();

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return c.json({ message: "Invalid email or password." }, 401);
  }

  const memberships = await loadMemberships(c.env.DB, user.id);
  if (memberships.length === 0) {
    return c.json({ message: "Your account doesn't have an active facility assigned yet." }, 403);
  }

  const token = await createSessionToken(user.id, c.env.SESSION_SECRET);

  await c.env.DB.prepare(`INSERT INTO audit_events (id, actor_user_id, action, target_type, target_id) VALUES (?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), user.id, "auth.login", "User", user.id)
    .run();

  return c.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
    memberships,
  });
});

authRoutes.get("/me", requireAuth, async (c) => {
  const userId = c.get("userId");
  const user = await c.env.DB.prepare(`SELECT id, name, email FROM users WHERE id = ?`).bind(userId).first<{
    id: string;
    name: string;
    email: string;
  }>();
  if (!user) return c.json({ message: "User not found." }, 404);

  const memberships = await loadMemberships(c.env.DB, userId);
  return c.json({ user, memberships });
});

async function loadMemberships(db: D1Database, userId: string) {
  const { results } = await db
    .prepare(
      `SELECT fm.facility_id as facilityId, f.name as facilityName, fm.role as role
       FROM facility_memberships fm
       JOIN facilities f ON f.id = fm.facility_id
       WHERE fm.user_id = ? AND fm.status = 'ACTIVE'
       ORDER BY f.name ASC`,
    )
    .bind(userId)
    .all();
  return results;
}
