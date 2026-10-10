/**
 * Driving-distance lookup via the Google Distance Matrix API.
 *
 * Requires a GOOGLE_MAPS_API_KEY server environment variable. Joe needs to
 * create the Google Cloud project, enable the Distance Matrix API, and
 * supply the key himself — account/billing setup isn't something this
 * codebase can do on its own. Until a key is configured, callers get a
 * clear error back (never a straight-line distance substituted silently).
 */

export type DistanceResult = {
  miles: number;
  originFormatted?: string;
  destinationFormatted?: string;
};

export type DistanceError = { error: string };

const FALLBACK_HINT = "Enter miles manually below.";

export async function getDrivingMiles(origin: string, destination: string): Promise<DistanceResult | DistanceError> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return { error: `Address-based mileage isn't configured yet (no mapping API key set). ${FALLBACK_HINT}` };
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
    return { error: `Couldn't reach the mapping provider. ${FALLBACK_HINT}` };
  }

  if (data.status !== "OK") {
    return { error: `Mapping provider error (${data.status ?? "unknown"}). ${FALLBACK_HINT}` };
  }

  const element = data.rows?.[0]?.elements?.[0];
  if (!element || element.status !== "OK" || !element.distance) {
    return { error: `Couldn't find driving directions between those addresses. Check them, or ${FALLBACK_HINT.toLowerCase()}` };
  }

  const miles = element.distance.value / 1609.344;

  return {
    miles: Math.round(miles * 10) / 10,
    originFormatted: data.origin_addresses?.[0],
    destinationFormatted: data.destination_addresses?.[0],
  };
}
