import { describe, expect, it } from "vitest";
import { newRideRequestSchema } from "@/lib/portal/schema";

const basePickup = { line1: "100 Main St", city: "Winston-Salem", state: "NC", zip: "27101" };
const baseDestination = { line1: "200 Elm St", city: "Winston-Salem", state: "NC", zip: "27103" };

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    submissionKey: "11111111-1111-4111-8111-111111111111",
    existingPatientId: "22222222-2222-4222-8222-222222222222",
    mobilityRequirements: "AMBULATORY",
    pickup: basePickup,
    destination: baseDestination,
    appointmentDate: "2026-11-01",
    appointmentTime: "10:00",
    tripType: "ONE_WAY",
    serviceType: "AMBULATORY",
    ...overrides,
  };
}

describe("newRideRequestSchema", () => {
  it("accepts a minimal valid one-way request for an existing patient", () => {
    const result = newRideRequestSchema.safeParse(baseInput());
    expect(result.success).toBe(true);
  });

  it("requires either an existing patient or a new patient name", () => {
    const result = newRideRequestSchema.safeParse(
      baseInput({ existingPatientId: undefined, newPatientName: undefined }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts a new patient name when no existing patient is selected", () => {
    const result = newRideRequestSchema.safeParse(
      baseInput({ existingPatientId: undefined, newPatientName: "Jane Demo" }),
    );
    expect(result.success).toBe(true);
  });

  it("requires a return time for round trips", () => {
    const result = newRideRequestSchema.safeParse(baseInput({ tripType: "ROUND_TRIP" }));
    expect(result.success).toBe(false);
  });

  it("accepts a round trip when a return time is provided", () => {
    const result = newRideRequestSchema.safeParse(
      baseInput({ tripType: "ROUND_TRIP", returnTime: "14:00" }),
    );
    expect(result.success).toBe(true);
  });

  it("requires a companion service type when companion assistance is requested", () => {
    const result = newRideRequestSchema.safeParse(baseInput({ companionRequested: true }));
    expect(result.success).toBe(false);
  });

  it("accepts companion assistance with a service type", () => {
    const result = newRideRequestSchema.safeParse(
      baseInput({ companionRequested: true, companionServiceType: "TRANSITIONAL_CARE" }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects an invalid submission key (not a UUID)", () => {
    const result = newRideRequestSchema.safeParse(baseInput({ submissionKey: "not-a-uuid" }));
    expect(result.success).toBe(false);
  });

  it("rejects a state code that isn't 2 letters", () => {
    const result = newRideRequestSchema.safeParse(
      baseInput({ pickup: { ...basePickup, state: "North Carolina" } }),
    );
    expect(result.success).toBe(false);
  });

  it("defaults additionalPassengers to 0 when omitted", () => {
    const result = newRideRequestSchema.safeParse(baseInput());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.additionalPassengers).toBe(0);
    }
  });
});
