import { describe, expect, it } from "vitest";
import { calculateEstimate } from "@/lib/pricing/calculate";

// A Tuesday at 10:00 AM — no weekend/evening/holiday surcharges apply.
const WEEKDAY_MORNING = new Date("2026-10-13T10:00:00");
// A Saturday at 10:00 AM — weekend surcharge applies, not evening.
const WEEKEND_MORNING = new Date("2026-10-17T10:00:00");
// A Tuesday at 6:00 PM — evening surcharge applies, not weekend.
const WEEKDAY_EVENING = new Date("2026-10-13T18:00:00");

describe("ambulatory one-way pricing", () => {
  it("charges only the base fare when mileage is within the 5-mile included threshold", () => {
    const result = calculateEstimate({
      serviceType: "ambulatory",
      direction: "one-way",
      oneWayMiles: 5,
      appointmentDateTime: WEEKDAY_MORNING,
      hoursNotice: 72,
    });
    expect(result.mileageBilled).toBe(0);
    expect(result.mileageCharge).toBe(0);
    expect(result.base).toBe(35);
    expect(result.total).toBe(35);
  });

  it("charges $2.50/mi only for miles beyond the 5-mile threshold", () => {
    const result = calculateEstimate({
      serviceType: "ambulatory",
      direction: "one-way",
      oneWayMiles: 12,
      appointmentDateTime: WEEKDAY_MORNING,
      hoursNotice: 72,
    });
    expect(result.mileageBilled).toBe(7);
    expect(result.mileageCharge).toBe(17.5);
    expect(result.total).toBe(35 + 17.5);
  });

  it("never bills negative mileage when the trip is shorter than the included threshold", () => {
    const result = calculateEstimate({
      serviceType: "ambulatory",
      direction: "one-way",
      oneWayMiles: 1,
      appointmentDateTime: WEEKDAY_MORNING,
      hoursNotice: 72,
    });
    expect(result.mileageBilled).toBe(0);
    expect(result.mileageCharge).toBe(0);
  });
});

describe("wheelchair round trip pricing", () => {
  it("applies the $90 base plus $2.25/mi from the first mile (no included threshold confirmed)", () => {
    const result = calculateEstimate({
      serviceType: "wheelchair",
      direction: "round-trip",
      oneWayMiles: 10,
      appointmentDateTime: WEEKDAY_MORNING,
      hoursNotice: 72,
    });
    expect(result.mileageBilled).toBe(10);
    expect(result.mileageCharge).toBe(22.5);
    expect(result.total).toBe(90 + 22.5);
  });
});

describe("surcharges", () => {
  it("applies the weekend surcharge as a percentage of base + mileage", () => {
    const result = calculateEstimate({
      serviceType: "ambulatory",
      direction: "one-way",
      oneWayMiles: 5,
      appointmentDateTime: WEEKEND_MORNING,
      hoursNotice: 72,
    });
    expect(result.surcharges).toHaveLength(1);
    expect(result.surcharges[0].label).toBe("Weekend");
    expect(result.surchargeTotal).toBe(7); // 35 * 0.20
    expect(result.total).toBe(42);
  });

  it("applies the evening surcharge for appointments at or after 5 PM", () => {
    const result = calculateEstimate({
      serviceType: "ambulatory",
      direction: "one-way",
      oneWayMiles: 5,
      appointmentDateTime: WEEKDAY_EVENING,
      hoursNotice: 72,
    });
    expect(result.surcharges).toHaveLength(1);
    expect(result.surcharges[0].label).toBe("Evening (after 5 PM)");
    expect(result.surchargeTotal).toBe(5.25); // 35 * 0.15
  });

  it("stacks multiple surcharges additively by default and warns that this is unconfirmed", () => {
    const saturdayEvening = new Date("2026-10-17T18:00:00");
    const result = calculateEstimate({
      serviceType: "ambulatory",
      direction: "one-way",
      oneWayMiles: 5,
      appointmentDateTime: saturdayEvening,
      hoursNotice: 72,
    });
    expect(result.surcharges).toHaveLength(2);
    expect(result.surchargeTotal).toBe(round2(35 * 0.2 + 35 * 0.15));
    expect(result.warnings.some((w) => w.includes("stacked additively"))).toBe(true);
  });
});

describe("fees", () => {
  it("adds the short-notice fee when the appointment is less than 24 hours away", () => {
    const result = calculateEstimate({
      serviceType: "ambulatory",
      direction: "one-way",
      oneWayMiles: 5,
      appointmentDateTime: WEEKDAY_MORNING,
      hoursNotice: 10,
    });
    expect(result.fees.find((f) => f.label.includes("24 hours"))?.amount).toBe(25);
  });

  it("does not add the short-notice fee at exactly 24 hours", () => {
    const result = calculateEstimate({
      serviceType: "ambulatory",
      direction: "one-way",
      oneWayMiles: 5,
      appointmentDateTime: WEEKDAY_MORNING,
      hoursNotice: 24,
    });
    expect(result.fees.find((f) => f.label.includes("24 hours"))).toBeUndefined();
  });

  it("includes one accompanying rider free and charges $15 for each additional rider", () => {
    const result = calculateEstimate({
      serviceType: "ambulatory",
      direction: "one-way",
      oneWayMiles: 5,
      appointmentDateTime: WEEKDAY_MORNING,
      hoursNotice: 72,
      additionalPassengers: 3,
    });
    const feeLine = result.fees.find((f) => f.label.startsWith("Additional passengers"));
    expect(feeLine?.amount).toBe(30); // 2 billable extra riders * $15
  });

  it("rounds waiting time up to the next full 40-minute interval", () => {
    const result = calculateEstimate({
      serviceType: "ambulatory",
      direction: "one-way",
      oneWayMiles: 5,
      appointmentDateTime: WEEKDAY_MORNING,
      hoursNotice: 72,
      waitingMinutesOutsideWinstonSalem: 45,
    });
    const feeLine = result.fees.find((f) => f.label.startsWith("Waiting"));
    expect(feeLine?.amount).toBe(50); // 2 intervals * $25
  });
});

describe("companion assistance", () => {
  it("flags companion pricing as pending configuration instead of inventing a rate", () => {
    const result = calculateEstimate({
      serviceType: "ambulatory",
      direction: "one-way",
      oneWayMiles: 5,
      appointmentDateTime: WEEKDAY_MORNING,
      hoursNotice: 72,
      companionAssistance: true,
      companionHours: 2,
    });
    expect(result.companion.status).toBe("pending-configuration");
    expect(result.companion.amount).toBe(0);
    expect(result.total).toBe(35); // companion cost excluded from the total until configured
    expect(result.warnings.some((w) => w.includes("no hourly rate is configured"))).toBe(true);
  });

  it("does not add a companion line item when companion assistance was not requested", () => {
    const result = calculateEstimate({
      serviceType: "ambulatory",
      direction: "one-way",
      oneWayMiles: 5,
      appointmentDateTime: WEEKDAY_MORNING,
      hoursNotice: 72,
    });
    expect(result.companion.status).toBe("not-requested");
  });
});

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
