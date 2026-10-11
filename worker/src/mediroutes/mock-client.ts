import type {
  CreateTripInput,
  CreateTripResult,
  MediRoutesClient,
  MediRoutesRider,
  MediRoutesTripDetail,
  MediRoutesTripSummary,
} from "./types";

/**
 * Stands in for the real MediRoutes API until Joe provides API credentials
 * (see CLAUDE.md). Backed by the mock_mediroutes_* D1 tables so demo data
 * persists across requests. Every trip/rider this returns is clearly
 * synthetic — never presented as real transportation records.
 */
export class MockMediRoutesClient implements MediRoutesClient {
  readonly mode = "mock" as const;

  constructor(private db: D1Database) {}

  async createTrip(input: CreateTripInput): Promise<CreateTripResult> {
    const tripGuid = crypto.randomUUID();
    let riderId = input.riderId;

    if (!riderId && input.newRider) {
      riderId = crypto.randomUUID();
      await this.db
        .prepare(
          `INSERT INTO mock_mediroutes_riders (rider_id, funding_source_id, name, mobility_requirements) VALUES (?, ?, ?, ?)`,
        )
        .bind(riderId, input.fundingSourceId, input.newRider.name, input.serviceType === "WHEELCHAIR" ? "WHEELCHAIR" : "AMBULATORY")
        .run();
    }
    if (!riderId) throw new Error("createTrip requires riderId or newRider");

    await this.db
      .prepare(
        `INSERT INTO mock_mediroutes_trips
         (trip_guid, funding_source_id, rider_id, rider_name, appointment_datetime,
          pickup_address1, pickup_city, pickup_state, pickup_zip,
          destination_address1, destination_city, destination_state, destination_zip,
          service_type, trip_type, status, return_pickup_time)
         VALUES (?, ?, ?, (SELECT name FROM mock_mediroutes_riders WHERE rider_id = ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', ?)`,
      )
      .bind(
        tripGuid,
        input.fundingSourceId,
        riderId,
        riderId,
        input.pickup.appointmentTime,
        input.pickup.address1,
        input.pickup.city,
        input.pickup.state,
        input.pickup.zip,
        input.destination.address1,
        input.destination.city,
        input.destination.state,
        input.destination.zip,
        input.serviceType,
        input.tripType,
        input.returnPickupTime ?? null,
      )
      .run();

    return { tripGuid, riderId };
  }

  async getUpcomingRides(fundingSourceId: number): Promise<MediRoutesTripSummary[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM mock_mediroutes_trips WHERE funding_source_id = ? AND appointment_datetime >= datetime('now') ORDER BY appointment_datetime ASC LIMIT 20`,
      )
      .bind(fundingSourceId)
      .all();
    return results.map(rowToSummary);
  }

  async getRideHistory(
    fundingSourceId: number,
    opts: { status?: string; q?: string; page: number; pageSize: number },
  ): Promise<{ rides: MediRoutesTripSummary[]; total: number }> {
    const conditions = ["funding_source_id = ?"];
    const binds: unknown[] = [fundingSourceId];

    if (opts.status && opts.status !== "ALL") {
      conditions.push("status = ?");
      binds.push(opts.status);
    }
    if (opts.q) {
      conditions.push("(rider_name LIKE ? OR trip_guid LIKE ?)");
      binds.push(`%${opts.q}%`, `%${opts.q}%`);
    }
    const where = conditions.join(" AND ");

    const countRow = await this.db
      .prepare(`SELECT COUNT(*) as total FROM mock_mediroutes_trips WHERE ${where}`)
      .bind(...binds)
      .first<{ total: number }>();

    const offset = (opts.page - 1) * opts.pageSize;
    const { results } = await this.db
      .prepare(`SELECT * FROM mock_mediroutes_trips WHERE ${where} ORDER BY appointment_datetime DESC LIMIT ? OFFSET ?`)
      .bind(...binds, opts.pageSize, offset)
      .all();

    return { rides: results.map(rowToSummary), total: countRow?.total ?? 0 };
  }

  async getTripDetail(tripGuid: string): Promise<MediRoutesTripDetail | null> {
    const row = await this.db.prepare(`SELECT * FROM mock_mediroutes_trips WHERE trip_guid = ?`).bind(tripGuid).first();
    if (!row) return null;
    const summary = rowToSummary(row);
    const legs = [
      {
        sequence: 1,
        pickup: summary.pickupAddress,
        destination: summary.destinationAddress,
        requestedPickupTime: summary.appointmentDateTime,
        confirmedPickupTime: summary.confirmedPickupTime,
      },
    ];
    if (row.trip_type === "ROUND_TRIP" && row.return_pickup_time) {
      legs.push({
        sequence: 2,
        pickup: summary.destinationAddress,
        destination: summary.pickupAddress,
        requestedPickupTime: row.return_pickup_time as string,
        confirmedPickupTime: null,
      });
    }
    return { ...summary, legs };
  }

  async getWheresMyRideUrl(tripGuid: string): Promise<string | null> {
    // The real API returns an actual tracking URL (singletrip/wheresMyRideUrl).
    // Mocked here with an inert placeholder so the UI affordance is testable.
    return `https://mock.mediroutes.example/track/${tripGuid}`;
  }

  async listRiders(fundingSourceId: number): Promise<MediRoutesRider[]> {
    const { results } = await this.db
      .prepare(`SELECT * FROM mock_mediroutes_riders WHERE funding_source_id = ? ORDER BY name ASC`)
      .bind(fundingSourceId)
      .all();
    return results.map((r: Record<string, unknown>) => ({
      riderId: r.rider_id as string,
      name: r.name as string,
      mobilityRequirements: r.mobility_requirements as "AMBULATORY" | "WHEELCHAIR",
    }));
  }
}

function rowToSummary(row: Record<string, unknown>): MediRoutesTripSummary {
  return {
    tripGuid: row.trip_guid as string,
    riderName: row.rider_name as string,
    appointmentDateTime: row.appointment_datetime as string,
    pickupAddress: {
      address1: row.pickup_address1 as string,
      city: row.pickup_city as string,
      state: row.pickup_state as string,
      zip: row.pickup_zip as string,
    },
    destinationAddress: {
      address1: row.destination_address1 as string,
      city: row.destination_city as string,
      state: row.destination_state as string,
      zip: row.destination_zip as string,
    },
    serviceType: row.service_type as MediRoutesTripSummary["serviceType"],
    tripType: row.trip_type as MediRoutesTripSummary["tripType"],
    status: row.status as MediRoutesTripSummary["status"],
    confirmedPickupTime: (row.confirmed_pickup_time as string) ?? null,
  };
}
