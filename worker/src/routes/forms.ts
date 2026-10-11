import { Hono } from "hono";
import type { Env, Variables } from "../types";
import { contactSchema, facilityPartnerSchema, marketingRideRequestSchema, flattenZodErrors } from "../lib/schemas";

export const formsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

async function recordSubmission(db: D1Database, kind: string, payload: unknown) {
  await db
    .prepare(`INSERT INTO marketing_submissions (id, kind, payload) VALUES (?, ?, ?)`)
    .bind(crypto.randomUUID(), kind, JSON.stringify(payload))
    .run();
}

formsRoutes.post("/contact", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ message: "Please fix the highlighted fields.", fieldErrors: flattenZodErrors(parsed.error) }, 400);
  }
  await recordSubmission(c.env.DB, "contact", parsed.data);
  return c.json({ message: "Thanks for reaching out — we'll be in touch soon." });
});

formsRoutes.post("/facility-partner", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = facilityPartnerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ message: "Please fix the highlighted fields.", fieldErrors: flattenZodErrors(parsed.error) }, 400);
  }
  await recordSubmission(c.env.DB, "facility-partner", parsed.data);
  return c.json({ message: "Thank you. A member of our team will follow up to discuss a facility partnership." });
});

formsRoutes.post("/ride-request", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = marketingRideRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ message: "Please fix the highlighted fields.", fieldErrors: flattenZodErrors(parsed.error) }, 400);
  }
  await recordSubmission(c.env.DB, "ride-request", parsed.data);
  return c.json({
    message:
      "Your request has been received. Transportation is not confirmed until Allegiance contacts you. Need a ride today? Call 336-962-7433.",
  });
});
