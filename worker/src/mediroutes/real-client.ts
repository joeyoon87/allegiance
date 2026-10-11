import type {
  CreateTripInput,
  CreateTripResult,
  MediRoutesClient,
  MediRoutesRider,
  MediRoutesTripDetail,
  MediRoutesTripSummary,
} from "./types";

/**
 * Real MediRoutes API client (api.mediroutes.com).
 *
 * UNTESTED — written against the public Swagger docs
 * (https://api.mediroutes.com/swagger/ui/index) without live credentials,
 * since those need Joe to obtain from his MediRoutes account rep. Methods
 * marked VERIFY below use the best-matching endpoint I could confirm
 * existed, but not its exact request/response shape under real data —
 * exercise each one against MediRoutes' sandbox (if available) before
 * relying on it for real facility traffic. Do not expand this client's
 * surface area without checking the real docs for the exact schema.
 */
export class RealMediRoutesClient implements MediRoutesClient {
  readonly mode = "live" as const;

  private tokenCache: { token: string; expiresAt: number } | null = null;

  constructor(
    private baseUrl: string,
    private clientId: string,
    private clientSecret: string,
  ) {}

  private async getAccessToken(): Promise<string> {
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now()) {
      return this.tokenCache.token;
    }
    // CONFIRMED endpoint exists (POST /token). Grant type assumed to be
    // client_credentials (standard for server-to-server API keys) — VERIFY
    // against MediRoutes' actual auth docs once credentials are issued;
    // adjust the body shape here if they specify something else.
    const res = await fetch(`${this.baseUrl}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });
    if (!res.ok) throw new Error(`MediRoutes auth failed: ${res.status}`);
    const data = (await res.json()) as { access_token: string; expires_in: number };
    this.tokenCache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
    return data.access_token;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`MediRoutes API ${res.status}: ${body.slice(0, 500)}`);
    }
    return (await res.json()) as T;
  }

  // CONFIRMED: POST /api/v1/singletrip/withFsid
  async createTrip(input: CreateTripInput): Promise<CreateTripResult> {
    const result = await this.request<{ trip_guid: string; rider_id: string }>(
      "/api/v1/singletrip/withFsid",
      {
        method: "POST",
        body: JSON.stringify({
          funding_source_id: input.fundingSourceId,
          rider_id: input.riderId,
          space_type: input.serviceType,
          trip_type: input.tripType === "ROUND_TRIP" ? 2 : 1, // VERIFY: assumed enum mapping
          additional_passengers: input.additionalPassengers,
          pickup: {
            complete_address: `${input.pickup.address1}, ${input.pickup.city}, ${input.pickup.state} ${input.pickup.zip}`,
            event_location: {
              address1: input.pickup.address1,
              city: input.pickup.city,
              state: input.pickup.state,
              zip: input.pickup.zip,
            },
            appt_time: input.pickup.appointmentTime,
            pickup_time: input.pickup.appointmentTime,
          },
          dropoff: {
            complete_address: `${input.destination.address1}, ${input.destination.city}, ${input.destination.state} ${input.destination.zip}`,
            event_location: {
              address1: input.destination.address1,
              city: input.destination.city,
              state: input.destination.state,
              zip: input.destination.zip,
            },
          },
        }),
      },
    );
    return { tripGuid: result.trip_guid, riderId: result.rider_id };
  }

  // VERIFY: no endpoint directly returns "upcoming rides for a funding
  // source." Using getRidesByDate across a date window and filtering by
  // funding_source_id client-side. POST rides/queryByFsid likely does this
  // more efficiently server-side — switch to it once its request schema is
  // confirmed with real API access.
  async getUpcomingRides(fundingSourceId: number): Promise<MediRoutesTripSummary[]> {
    const results: (MediRoutesTripSummary & { fundingSourceId: number })[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const iso = date.toISOString().slice(0, 10);
      const dayTrips = await this.request<unknown[]>(`/api/v1/rides/getRidesByDate?date=${iso}`);
      results.push(...dayTrips.map(mapUnknownTripToSummary).filter((t) => t.fundingSourceId === fundingSourceId));
      if (results.length >= 20) break;
    }
    return results.map(({ fundingSourceId: _fsid, ...rest }) => rest);
  }

  // VERIFY: same caveat as getUpcomingRides — using rides/query as a
  // best-effort match for "filterable, paginated ride search."
  async getRideHistory(
    fundingSourceId: number,
    opts: { status?: string; q?: string; page: number; pageSize: number },
  ): Promise<{ rides: MediRoutesTripSummary[]; total: number }> {
    const result = await this.request<{ rides: unknown[]; total: number }>("/api/v1/rides/query", {
      method: "POST",
      body: JSON.stringify({
        funding_source_id: fundingSourceId,
        status: opts.status !== "ALL" ? opts.status : undefined,
        search: opts.q,
        page: opts.page,
        page_size: opts.pageSize,
      }),
    });
    return {
      rides: result.rides.map(mapUnknownTripToSummary).map(({ fundingSourceId: _fsid, ...rest }) => rest),
      total: result.total,
    };
  }

  // CONFIRMED: GET /api/v1/rides/getTripByGuid
  async getTripDetail(tripGuid: string): Promise<MediRoutesTripDetail | null> {
    try {
      const trip = await this.request<Record<string, unknown>>(`/api/v1/rides/getTripByGuid?tripGuid=${tripGuid}`);
      const summary = mapUnknownTripToSummary(trip);
      return {
        ...summary,
        legs: [
          {
            sequence: 1,
            pickup: summary.pickupAddress,
            destination: summary.destinationAddress,
            requestedPickupTime: summary.appointmentDateTime,
            confirmedPickupTime: summary.confirmedPickupTime,
          },
        ],
      };
    } catch {
      return null;
    }
  }

  // CONFIRMED: GET /api/v1/singletrip/wheresMyRideUrl
  async getWheresMyRideUrl(tripGuid: string): Promise<string | null> {
    try {
      const result = await this.request<{ url: string }>(`/api/v1/singletrip/wheresMyRideUrl?tripGuid=${tripGuid}`);
      return result.url ?? null;
    } catch {
      return null;
    }
  }

  // CONFIRMED: GET /api/v1/riders (filterable)
  async listRiders(fundingSourceId: number): Promise<MediRoutesRider[]> {
    const riders = await this.request<Record<string, unknown>[]>(
      `/api/v1/riders?funding_source_id=${fundingSourceId}`,
    );
    return riders.map((r) => ({
      riderId: String(r.rider_id ?? r.id),
      name: String(r.name ?? `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim()),
      mobilityRequirements: r.space_type === "WHEELCHAIR" ? "WHEELCHAIR" : "AMBULATORY",
    }));
  }
}

function mapUnknownTripToSummary(trip: unknown): MediRoutesTripSummary & { fundingSourceId: number } {
  // VERIFY: field names assumed from the SingleTrip create schema; the
  // *read* response shape wasn't expanded in docs research and may differ.
  const t = trip as Record<string, unknown>;
  const pickup = (t.pickup ?? {}) as Record<string, unknown>;
  const dropoff = (t.dropoff ?? {}) as Record<string, unknown>;
  const pickupLoc = (pickup.event_location ?? {}) as Record<string, unknown>;
  const dropoffLoc = (dropoff.event_location ?? {}) as Record<string, unknown>;

  return {
    tripGuid: String(t.trip_guid),
    riderName: String(t.rider_name ?? t.rider_id ?? "Unknown rider"),
    appointmentDateTime: String(pickup.appt_time ?? pickup.pickup_time ?? ""),
    pickupAddress: {
      address1: String(pickupLoc.address1 ?? ""),
      city: String(pickupLoc.city ?? ""),
      state: String(pickupLoc.state ?? ""),
      zip: String(pickupLoc.zip ?? ""),
    },
    destinationAddress: {
      address1: String(dropoffLoc.address1 ?? ""),
      city: String(dropoffLoc.city ?? ""),
      state: String(dropoffLoc.state ?? ""),
      zip: String(dropoffLoc.zip ?? ""),
    },
    serviceType: (t.space_type as MediRoutesTripSummary["serviceType"]) ?? "AMBULATORY",
    tripType: t.trip_type === 2 ? "ROUND_TRIP" : "ONE_WAY",
    status: (t.status as MediRoutesTripSummary["status"]) ?? "SUBMITTED",
    confirmedPickupTime: (t.confirmed_pickup_time as string) ?? null,
    fundingSourceId: Number(t.funding_source_id ?? 0),
  };
}
