"use server";

import { prisma } from "@/lib/db";
import { requireFacilityAccess, canCreateRides } from "@/lib/portal/permissions";
import { newRideRequestSchema, type NewRideRequestInput } from "@/lib/portal/schema";
import { nextPublicRequestNumber } from "@/lib/portal/requestNumber";
import { revalidatePath } from "next/cache";

export type CreateRideRequestResult =
  | { success: true; requestNumber: string; id: string }
  | { success: false; message: string; fieldErrors?: Record<string, string> };

/**
 * Creates a ride request for `facilityId`. Re-verifies facility membership
 * server-side even though the calling page already checked it — a Server
 * Action is a public RPC endpoint and must not assume the page's guard ran.
 */
export async function createRideRequest(
  facilityId: string,
  rawInput: NewRideRequestInput,
): Promise<CreateRideRequestResult> {
  const { userId, membership } = await requireFacilityAccess(facilityId);

  if (!canCreateRides(membership.role)) {
    return { success: false, message: "Your role doesn't have permission to request transportation." };
  }

  const parsed = newRideRequestSchema.safeParse(rawInput);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_form";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { success: false, message: "Please fix the highlighted fields.", fieldErrors };
  }
  const input = parsed.data;

  // Idempotency: a resubmit (double-click, retry after a flaky network
  // response) with the same submissionKey returns the original request
  // instead of creating a second one.
  const existing = await prisma.rideRequest.findUnique({
    where: { submissionKey: input.submissionKey },
  });
  if (existing) {
    return { success: true, requestNumber: existing.publicRequestNumber, id: existing.id };
  }

  const appointmentDateTime = new Date(`${input.appointmentDate}T${input.appointmentTime}`);
  if (Number.isNaN(appointmentDateTime.getTime())) {
    return { success: false, message: "Invalid appointment date/time." };
  }

  let patientId = input.existingPatientId;
  if (patientId) {
    // Defense in depth: never trust that a client-supplied patientId
    // actually belongs to this facility.
    const patient = await prisma.patient.findFirst({ where: { id: patientId, facilityId } });
    if (!patient) {
      return { success: false, message: "That patient record wasn't found for this facility." };
    }
  }

  const requestNumber = await nextPublicRequestNumber();

  const created = await prisma.$transaction(async (tx) => {
    if (!patientId) {
      const patient = await tx.patient.create({
        data: {
          facilityId,
          name: input.newPatientName!.trim(),
          authorizedContactName: input.newPatientContactName?.trim() || null,
          authorizedContactPhone: input.newPatientContactPhone?.trim() || null,
          mobilityRequirements: input.mobilityRequirements,
        },
      });
      patientId = patient.id;
    }

    const rideRequest = await tx.rideRequest.create({
      data: {
        publicRequestNumber: requestNumber,
        facilityId,
        patientId: patientId!,
        createdByUserId: userId,
        serviceType: input.serviceType,
        tripType: input.tripType,
        appointmentDateTime,
        status: "SUBMITTED",
        urgency: input.urgency,
        companionRequested: input.companionRequested,
        estimatedCompanionDuration: input.estimatedCompanionDuration,
        additionalPassengers: input.additionalPassengers,
        specialInstructions: input.specialInstructions || null,
        submissionKey: input.submissionKey,
      },
    });

    await tx.rideLeg.create({
      data: {
        rideRequestId: rideRequest.id,
        sequence: 1,
        pickupAddressLine1: input.pickup.line1,
        pickupCity: input.pickup.city,
        pickupState: input.pickup.state.toUpperCase(),
        pickupZip: input.pickup.zip,
        destinationAddressLine1: input.destination.line1,
        destinationCity: input.destination.city,
        destinationState: input.destination.state.toUpperCase(),
        destinationZip: input.destination.zip,
        requestedPickupTime: appointmentDateTime,
      },
    });

    if (input.tripType === "ROUND_TRIP" && input.returnTime) {
      const returnDateTime = new Date(`${input.appointmentDate}T${input.returnTime}`);
      await tx.rideLeg.create({
        data: {
          rideRequestId: rideRequest.id,
          sequence: 2,
          // Return leg runs the trip in reverse.
          pickupAddressLine1: input.destination.line1,
          pickupCity: input.destination.city,
          pickupState: input.destination.state.toUpperCase(),
          pickupZip: input.destination.zip,
          destinationAddressLine1: input.pickup.line1,
          destinationCity: input.pickup.city,
          destinationState: input.pickup.state.toUpperCase(),
          destinationZip: input.pickup.zip,
          requestedPickupTime: returnDateTime,
        },
      });
    }

    if (input.companionRequested && input.companionServiceType) {
      await tx.companionRequest.create({
        data: {
          rideRequestId: rideRequest.id,
          companionServiceType: input.companionServiceType,
          requestedAssistance: input.companionRequestedAssistance?.trim() || "Not specified",
          estimatedDurationMinutes: input.estimatedCompanionDuration,
          pickupHandoffContactName: input.pickupHandoffContactName?.trim() || null,
          pickupHandoffContactPhone: input.pickupHandoffContactPhone?.trim() || null,
          destinationHandoffContactName: input.destinationHandoffContactName?.trim() || null,
          destinationHandoffContactPhone: input.destinationHandoffContactPhone?.trim() || null,
          postArrivalAssistanceRequested: input.postArrivalAssistanceRequested,
          postArrivalAssistanceNotes: input.postArrivalAssistanceNotes?.trim() || null,
        },
      });
    }

    await tx.requestStatusEvent.create({
      data: {
        rideRequestId: rideRequest.id,
        previousStatus: null,
        newStatus: "SUBMITTED",
        actorUserId: userId,
      },
    });

    await tx.auditEvent.create({
      data: {
        actorUserId: userId,
        action: "ride_request.created",
        targetType: "RideRequest",
        targetId: rideRequest.id,
        metadata: { facilityId, requestNumber },
      },
    });

    return rideRequest;
  });

  revalidatePath("/portal/rides");
  revalidatePath("/portal/dashboard");

  return { success: true, requestNumber: created.publicRequestNumber, id: created.id };
}
