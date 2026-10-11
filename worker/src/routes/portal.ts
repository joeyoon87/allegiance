import { Hono } from "hono";
import type { Env, Variables } from "../types";
import { requireAuth, requireFacilityMembership } from "../lib/auth-middleware";
import { getMediRoutesClient } from "../mediroutes/client";
import type { MediRoutesTripSummary } from "../mediroutes/types";
import { newPortalRideRequestSchema, flattenZodErrors } from "../lib/schemas";
import { newId, nextPublicRequestNumber } from "../lib/db";

export const portalRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
portalRoutes.use("*", requireAuth);

type Facility = {
  id: string;
  name: string;
  mediroutes_funding_source_id: number | null;
};

async function loadFacility(db: D1Database, facilityId: string): Promise<Facility | null> {
  return db
    .prepare(`SELECT id, name, mediroutes_funding_source_id FROM facilities WHERE id = ?`)
    .bind(facilityId)
    .first<Facility>();
}

async function reconciliationByTripGuid(db: D1Database, tripGuid: string) {
  return db.prepare(`SELECT * FROM ride_reconciliation WHERE mediroutes_trip_guid = ?`).bind(tripGuid).first<{
    public_request_number: string;
    created_at: string;
    additional_passengers: number;
    request_payload: string;
  }>();
}

function summaryToRow(trip: MediRoutesTripSummary, requestNumber: string | null) {
  return {
    id: trip.tripGuid,
    publicRequestNumber: requestNumber ?? `MR-${trip.tripGuid.slice(0, 8).toUpperCase()}`,
    patientName: trip.riderName,
    appointmentDateTime: trip.appointmentDateTime,
    serviceType: trip.serviceType,
    tripType: trip.tripType,
    status: trip.status,
  };
}

// --- Dashboard -------------------------------------------------------------

portalRoutes.get("/dashboard", async (c) => {
  const facilityId = c.req.query("facilityId");
  if (!facilityId) return c.json({ message: "facilityId is required." }, 400);
  if (!(await requireFacilityMembership(c, facilityId))) return c.json({ message: "Not found." }, 404);

  const facility = await loadFacility(c.env.DB, facilityId);
  if (!facility) return c.json({ message: "Not found." }, 404);

  if (facility.mediroutes_funding_source_id == null) {
    // Facility hasn't been linked to MediRoutes yet (brief's "facility
    // identification problem" — see CLAUDE.md). Honest empty state, not
    // an error.
    return c.json({ pendingCount: 0, confirmedCount: 0, needsAttentionCount: 0, recurringCount: 0, upcoming: [] });
  }

  const mediroutes = getMediRoutesClient(c.env);
  const upcoming = await mediroutes.getUpcomingRides(facility.mediroutes_funding_source_id);

  const needsAttention = await c.env.DB.prepare(
    `SELECT COUNT(*) as n FROM ride_reconciliation WHERE facility_id = ? AND sync_status = 'FAILED'`,
  )
    .bind(facilityId)
    .first<{ n: number }>();

  const rows = await Promise.all(
    upcoming.slice(0, 6).map(async (trip) => {
      const recon = await reconciliationByTripGuid(c.env.DB, trip.tripGuid);
      return summaryToRow(trip, recon?.public_request_number ?? null);
    }),
  );

  return c.json({
    pendingCount: upcoming.filter((t) => t.status === "SUBMITTED" || t.status === "UNDER_REVIEW").length,
    confirmedCount: upcoming.filter((t) => t.status === "CONFIRMED" || t.status === "IN_PROGRESS").length,
    needsAttentionCount: needsAttention?.n ?? 0,
    recurringCount: 0, // not built this phase — see CLAUDE.md
    upcoming: rows,
  });
});

// --- Rides list --------------------------------------------------------------

portalRoutes.get("/rides", async (c) => {
  const facilityId = c.req.query("facilityId");
  if (!facilityId) return c.json({ message: "facilityId is required." }, 400);
  if (!(await requireFacilityMembership(c, facilityId))) return c.json({ message: "Not found." }, 404);

  const facility = await loadFacility(c.env.DB, facilityId);
  if (!facility) return c.json({ message: "Not found." }, 404);
  if (facility.mediroutes_funding_source_id == null) {
    return c.json({ rides: [], total: 0 });
  }

  const status = c.req.query("status") ?? "ALL";
  const q = c.req.query("q") ?? undefined;
  const page = Math.max(1, Number(c.req.query("page")) || 1);
  const pageSize = 20;

  const mediroutes = getMediRoutesClient(c.env);
  const { rides, total } = await mediroutes.getRideHistory(facility.mediroutes_funding_source_id, {
    status,
    q,
    page,
    pageSize,
  });

  const rows = await Promise.all(
    rides.map(async (trip) => {
      const recon = await reconciliationByTripGuid(c.env.DB, trip.tripGuid);
      return summaryToRow(trip, recon?.public_request_number ?? null);
    }),
  );

  return c.json({ rides: rows, total });
});

// --- Ride detail -------------------------------------------------------------

portalRoutes.get("/rides/:id", async (c) => {
  const tripGuid = c.req.param("id");
  const facilityId = c.req.query("facilityId");
  if (!facilityId) return c.json({ message: "facilityId is required." }, 400);
  const membership = await requireFacilityMembership(c, facilityId);
  if (!membership) return c.json({ message: "Not found." }, 404);

  const facility = await loadFacility(c.env.DB, facilityId);
  if (!facility) return c.json({ message: "Not found." }, 404);

  const mediroutes = getMediRoutesClient(c.env);
  const trip = await mediroutes.getTripDetail(tripGuid);
  if (!trip) return c.json({ message: "Ride not found." }, 404);

  const recon = await c.env.DB.prepare(`SELECT * FROM ride_reconciliation WHERE mediroutes_trip_guid = ?`)
    .bind(tripGuid)
    .first<{
      public_request_number: string;
      additional_passengers: number;
      request_payload: string;
      created_at: string;
    }>();

  const payload = recon ? (JSON.parse(recon.request_payload) as Record<string, unknown>) : null;

  const statusEvents = [
    ...(recon ? [{ id: `${tripGuid}-submitted`, newStatus: "SUBMITTED", createdAt: recon.created_at, reason: null }] : []),
    { id: `${tripGuid}-current`, newStatus: trip.status, createdAt: new Date().toISOString(), reason: null },
  ];

  return c.json({
    id: trip.tripGuid,
    publicRequestNumber: recon?.public_request_number ?? `MR-${trip.tripGuid.slice(0, 8).toUpperCase()}`,
    status: trip.status,
    facilityName: facility.name,
    patientName: trip.riderName,
    mobilityRequirements: trip.serviceType === "WHEELCHAIR" ? "WHEELCHAIR" : "AMBULATORY",
    authorizedContactName: (payload?.newPatientContactName as string) ?? null,
    authorizedContactPhone: (payload?.newPatientContactPhone as string) ?? null,
    additionalPassengers: recon?.additional_passengers ?? 0,
    serviceType: trip.serviceType,
    tripType: trip.tripType,
    urgency: (payload?.urgency as string) ?? "ROUTINE",
    appointmentDateTime: trip.appointmentDateTime,
    specialInstructions: (payload?.specialInstructions as string) ?? null,
    legs: trip.legs.map((leg) => ({
      id: `${tripGuid}-leg-${leg.sequence}`,
      sequence: leg.sequence,
      pickupAddressLine1: leg.pickup.address1,
      pickupCity: leg.pickup.city,
      pickupState: leg.pickup.state,
      pickupZip: leg.pickup.zip,
      destinationAddressLine1: leg.destination.address1,
      destinationCity: leg.destination.city,
      destinationState: leg.destination.state,
      destinationZip: leg.destination.zip,
      requestedPickupTime: leg.requestedPickupTime,
      confirmedPickupTime: leg.confirmedPickupTime,
    })),
    companionRequest: payload?.companionRequested
      ? {
          companionServiceType: payload.companionServiceType,
          requestedAssistance: payload.companionRequestedAssistance ?? "Not specified",
          estimatedDurationMinutes: payload.estimatedCompanionDuration ?? null,
          pickupHandoffContactName: payload.pickupHandoffContactName ?? null,
          pickupHandoffContactPhone: payload.pickupHandoffContactPhone ?? null,
          destinationHandoffContactName: payload.destinationHandoffContactName ?? null,
          destinationHandoffContactPhone: payload.destinationHandoffContactPhone ?? null,
          postArrivalAssistanceRequested: Boolean(payload.postArrivalAssistanceRequested),
          reviewStatus: "PENDING",
        }
      : null,
    statusEvents,
    externalDispatchReference: trip.tripGuid,
  });
});

// --- Create ride request ------------------------------------------------------

portalRoutes.post("/rides", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.facilityId) return c.json({ message: "facilityId is required." }, 400);

  const membership = await requireFacilityMembership(c, body.facilityId);
  if (!membership) return c.json({ message: "Not found." }, 404);
  if (membership.role !== "FACILITY_ADMIN" && membership.role !== "FACILITY_SCHEDULER") {
    return c.json({ message: "Your role doesn't have permission to request transportation." }, 403);
  }

  const parsed = newPortalRideRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ message: "Please fix the highlighted fields.", fieldErrors: flattenZodErrors(parsed.error) }, 400);
  }
  const input = parsed.data;

  // Idempotency: a resubmit with the same submissionKey returns the
  // original request instead of creating a duplicate MediRoutes trip. The
  // "id" returned must be the trip guid either way — it's what the
  // frontend uses for GET /portal/rides/:id — never the reconciliation
  // row's own internal id.
  const existing = await c.env.DB.prepare(`SELECT * FROM ride_reconciliation WHERE submission_key = ?`)
    .bind(input.submissionKey)
    .first<{ mediroutes_trip_guid: string | null; public_request_number: string; sync_status: string }>();
  if (existing) {
    if (existing.sync_status === "FAILED" || !existing.mediroutes_trip_guid) {
      return c.json(
        { message: "A previous attempt to submit this request failed. Please try again or contact dispatch." },
        502,
      );
    }
    return c.json({ id: existing.mediroutes_trip_guid, requestNumber: existing.public_request_number });
  }

  const facility = await loadFacility(c.env.DB, input.facilityId);
  if (!facility) return c.json({ message: "Facility not found." }, 404);
  if (facility.mediroutes_funding_source_id == null) {
    return c.json(
      { message: "This facility isn't linked to MediRoutes yet. Contact Allegiance dispatch to complete setup." },
      409,
    );
  }

  const appointmentDateTime = new Date(`${input.appointmentDate}T${input.appointmentTime}`);
  if (Number.isNaN(appointmentDateTime.getTime())) {
    return c.json({ message: "Invalid appointment date/time." }, 400);
  }

  const mediroutes = getMediRoutesClient(c.env);
  const userId = c.get("userId");
  const requestNumber = await nextPublicRequestNumber(c.env.DB);
  const reconciliationId = newId();

  try {
    const { tripGuid } = await mediroutes.createTrip({
      fundingSourceId: facility.mediroutes_funding_source_id,
      riderId: input.existingPatientId,
      newRider: input.existingPatientId ? undefined : { name: input.newPatientName!.trim() },
      pickup: {
        address1: input.pickup.line1,
        city: input.pickup.city,
        state: input.pickup.state.toUpperCase(),
        zip: input.pickup.zip,
        appointmentTime: appointmentDateTime.toISOString(),
      },
      destination: {
        address1: input.destination.line1,
        city: input.destination.city,
        state: input.destination.state.toUpperCase(),
        zip: input.destination.zip,
      },
      returnPickupTime:
        input.tripType === "ROUND_TRIP" && input.returnTime
          ? new Date(`${input.appointmentDate}T${input.returnTime}`).toISOString()
          : undefined,
      serviceType: input.serviceType,
      tripType: input.tripType,
      additionalPassengers: input.additionalPassengers,
    });

    await c.env.DB.prepare(
      `INSERT INTO ride_reconciliation
       (id, facility_id, created_by_user_id, submission_key, public_request_number, mediroutes_trip_guid, sync_status, request_payload)
       VALUES (?, ?, ?, ?, ?, ?, 'SYNCED', ?)`,
    )
      .bind(reconciliationId, input.facilityId, userId, input.submissionKey, requestNumber, tripGuid, JSON.stringify(input))
      .run();

    await c.env.DB.prepare(`INSERT INTO audit_events (id, actor_user_id, action, target_type, target_id, metadata) VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(newId(), userId, "ride_request.created", "RideReconciliation", reconciliationId, JSON.stringify({ facilityId: input.facilityId, requestNumber }))
      .run();

    return c.json({ id: tripGuid, requestNumber });
  } catch (err) {
    // Record the attempt even on failure so it shows up as "needs
    // attention" on the dashboard instead of silently vanishing.
    await c.env.DB.prepare(
      `INSERT INTO ride_reconciliation
       (id, facility_id, created_by_user_id, submission_key, public_request_number, sync_status, sync_error, request_payload)
       VALUES (?, ?, ?, ?, ?, 'FAILED', ?, ?)`,
    )
      .bind(reconciliationId, input.facilityId, userId, input.submissionKey, requestNumber, String(err), JSON.stringify(input))
      .run();

    return c.json({ message: "We couldn't submit this request to MediRoutes. Dispatch has been notified." }, 502);
  }
});

// --- Patients / riders ---------------------------------------------------------

portalRoutes.get("/patients", async (c) => {
  const facilityId = c.req.query("facilityId");
  if (!facilityId) return c.json({ message: "facilityId is required." }, 400);
  if (!(await requireFacilityMembership(c, facilityId))) return c.json({ message: "Not found." }, 404);

  const facility = await loadFacility(c.env.DB, facilityId);
  if (!facility || facility.mediroutes_funding_source_id == null) return c.json([]);

  const mediroutes = getMediRoutesClient(c.env);
  const riders = await mediroutes.listRiders(facility.mediroutes_funding_source_id);
  return c.json(riders.map((r) => ({ id: r.riderId, name: r.name, mobilityRequirements: r.mobilityRequirements })));
});
