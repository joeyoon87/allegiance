import { z } from "zod";

const addressSchema = z.object({
  line1: z.string().trim().min(1, "Street address is required."),
  city: z.string().trim().min(1, "City is required."),
  state: z.string().trim().length(2, "Use a 2-letter state code."),
  zip: z.string().trim().min(5, "Enter a valid ZIP code."),
});

export const newRideRequestSchema = z
  .object({
    // Idempotency: one token per form mount; a resubmit with the same
    // token returns the original request instead of creating a duplicate.
    submissionKey: z.string().uuid(),

    // Step 1 — Patient
    existingPatientId: z.string().uuid().optional(),
    newPatientName: z.string().trim().optional(),
    newPatientContactName: z.string().trim().optional(),
    newPatientContactPhone: z.string().trim().optional(),
    mobilityRequirements: z.enum(["AMBULATORY", "WHEELCHAIR"]),
    additionalPassengers: z.coerce.number().int().min(0).max(5).default(0),

    // Step 2 — Transportation
    pickup: addressSchema,
    destination: addressSchema,
    appointmentDate: z.string().min(1, "Appointment date is required."),
    appointmentTime: z.string().min(1, "Appointment time is required."),
    tripType: z.enum(["ONE_WAY", "ROUND_TRIP"]),
    returnTime: z.string().optional(),
    serviceType: z.enum(["AMBULATORY", "WHEELCHAIR", "FACILITY_TRANSFER"]),
    urgency: z.enum(["ROUTINE", "URGENT", "SAME_DAY"]).default("ROUTINE"),

    // Step 3 — Additional services
    companionRequested: z.boolean().default(false),
    companionServiceType: z.enum(["APPOINTMENT_ESCORT", "TRANSITIONAL_CARE", "OTHER"]).optional(),
    companionRequestedAssistance: z.string().trim().optional(),
    estimatedCompanionDuration: z.coerce.number().int().min(0).optional(),
    pickupHandoffContactName: z.string().trim().optional(),
    pickupHandoffContactPhone: z.string().trim().optional(),
    destinationHandoffContactName: z.string().trim().optional(),
    destinationHandoffContactPhone: z.string().trim().optional(),
    postArrivalAssistanceRequested: z.boolean().default(false),
    postArrivalAssistanceNotes: z.string().trim().optional(),
    specialInstructions: z.string().trim().max(1000).optional(),
  })
  .refine((data) => data.existingPatientId || data.newPatientName, {
    message: "Select an existing patient or enter a new patient name.",
    path: ["newPatientName"],
  })
  .refine((data) => data.tripType === "ONE_WAY" || !!data.returnTime, {
    message: "Return time is required for a round trip.",
    path: ["returnTime"],
  })
  .refine((data) => !data.companionRequested || !!data.companionServiceType, {
    message: "Select a companion service type.",
    path: ["companionServiceType"],
  });

export type NewRideRequestInput = z.infer<typeof newRideRequestSchema>;
