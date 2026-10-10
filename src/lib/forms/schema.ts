import { z } from "zod";

const requiredString = (label: string) => z.string().trim().min(1, `${label} is required.`);

export const rideRequestSchema = z.object({
  riderName: requiredString("Rider name"),
  contactName: z.string().trim().optional(),
  contactPhone: requiredString("Contact phone"),
  contactEmail: z.string().trim().email("Enter a valid email address."),
  pickupAddress: requiredString("Pickup address"),
  destinationAddress: requiredString("Destination address"),
  appointmentDate: requiredString("Appointment date"),
  appointmentTime: requiredString("Appointment time"),
  mobilityType: z.enum(["ambulatory", "wheelchair"], {
    error: "Select a mobility type.",
  }),
  tripType: z.enum(["one-way", "round-trip"], { error: "Select one-way or round trip." }),
  additionalPassengers: z.coerce.number().int().min(0).max(5).default(0),
  companionAssistance: z.boolean().default(false),
  notes: z.string().trim().max(1000).optional(),
});

export type RideRequestInput = z.infer<typeof rideRequestSchema>;

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

export type FacilityPartnerInput = z.infer<typeof facilityPartnerSchema>;

export const contactSchema = z.object({
  name: requiredString("Name"),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().optional(),
  topic: z.string().trim().optional(),
  message: requiredString("Message"),
});

export type ContactInput = z.infer<typeof contactSchema>;
