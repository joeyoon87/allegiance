import { Hono } from "hono";
import type { Env, Variables } from "../types";

export const distanceRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

const FALLBACK_HINT = "Enter miles manually below.";

distanceRoutes.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const origin = typeof body?.origin === "string" ? body.origin.trim() : "";
  const destination = typeof body?.destination === "string" ? body.destination.trim() : "";
  if (!origin || !destination) {
    return c.json({ error: "Both a pickup and destination address are required." }, 400);
  }

  const apiKey = c.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return c.json({ error: `Address-based mileage isn't configured yet (no mapping API key set). ${FALLBACK_HINT}` }, 422);
  }

  const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  url.searchParams.set("origins", origin);
  url.searchParams.set("destinations", destination);
  url.searchParams.set("units", "imperial");
  url.searchParams.set("key", apiKey);

  let data: {
    status?: string;
    origin_addresses?: string[];
    destination_addresses?: string[];
    rows?: { elements?: { status?: string; distance?: { value: number } }[] }[];
  };
  try {
    const res = await fetch(url.toString());
    data = await res.json();
  } catch {
    return c.json({ error: `Couldn't reach the mapping provider. ${FALLBACK_HINT}` }, 502);
  }

  if (data.status !== "OK") {
    return c.json({ error: `Mapping provider error (${data.status ?? "unknown"}). ${FALLBACK_HINT}` }, 502);
  }

  const element = data.rows?.[0]?.elements?.[0];
  if (!element || element.status !== "OK" || !element.distance) {
    return c.json({ error: `Couldn't find driving directions between those addresses. Check them, or ${FALLBACK_HINT.toLowerCase()}` }, 422);
  }

  const miles = element.distance.value / 1609.344;
  return c.json({
    miles: Math.round(miles * 10) / 10,
    originFormatted: data.origin_addresses?.[0],
    destinationFormatted: data.destination_addresses?.[0],
  });
});
