import { z } from "zod";

// Mirrors src/lib/forms/schema.ts and src/lib/portal/schema.ts in the
// Next.js app. Kept in sync by hand (separate deployable units) — if you
// change one, change the other.

const requiredString = (label: string) => z.string().trim().min(1, `${label} is required.`);

export const contactSchema = z.object({
  name: requiredString("Name"),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().optional(),
  topic: z.string().trim().optional(),
  message: requiredString("Message"),
});

export const facilityPartnerSchema = z.object({
  organization: requiredString("Organization"),
  facilityType: requiredString("Facility type"),
  contactName: requiredString("Contact name"),
  jobTitle: requiredString("Job title"),
  workEmail: z.string().trim().email("Enter a valid work email address."),
  phone: requiredString("Phone"),
  estimatedMonthlyVolume: z.string().trim().optional(),
  primaryNeeds: requiredString("Primary transportation needs"),
  message: z.string().trim().max(2000).optional(),
});

export const marketingRideRequestSchema = z.object({
  riderName: requiredString("Rider name"),
  contactName: z.string().trim().optional(),
  contactPhone: requiredString("Contact phone"),
  contactEmail: z.string().trim().email("Enter a valid email address."),
  pickupAddress: requiredString("Pickup address"),
  destinationAddress: requiredString("Destination address"),
  appointmentDate: requiredString("Appointment date"),
  appointmentTime: requiredString("Appointment time"),
  mobilityType: z.enum(["ambulatory", "wheelchair"]),
  tripType: z.enum(["one-way", "round-trip"]),
  additionalPassengers: z.coerce.number().int().min(0).max(5).default(0),
  companionAssistance: z.boolean().default(false),
  notes: z.string().trim().max(1000).optional(),
});

const addressSchema = z.object({
  line1: z.string().trim().min(1, "Street address is required."),
  city: z.string().trim().min(1, "City is required."),
  state: z.string().trim().length(2, "Use a 2-letter state code."),
  zip: z.string().trim().min(5, "Enter a valid ZIP code."),
});

export const newPortalRideRequestSchema = z
  .object({
    facilityId: z.string().uuid(),
    submissionKey: z.string().uuid(),
    existingPatientId: z.string().optional(),
    newPatientName: z.string().trim().optional(),
    newPatientContactName: z.string().trim().optional(),
    newPatientContactPhone: z.string().trim().optional(),
    mobilityRequirements: z.enum(["AMBULATORY", "WHEELCHAIR"]),
    additionalPassengers: z.coerce.number().int().min(0).max(5).default(0),
    pickup: addressSchema,
    destination: addressSchema,
    appointmentDate: z.string().min(1),
    appointmentTime: z.string().min(1),
    tripType: z.enum(["ONE_WAY", "ROUND_TRIP"]),
    returnTime: z.string().optional(),
    serviceType: z.enum(["AMBULATORY", "WHEELCHAIR", "FACILITY_TRANSFER"]),
    urgency: z.enum(["ROUTINE", "URGENT", "SAME_DAY"]).default("ROUTINE"),
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

export function flattenZodErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
