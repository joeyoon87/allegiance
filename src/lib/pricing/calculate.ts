import { RATES, ServiceType, TripDirection, TripRate } from "@/lib/pricing/rates";

export type EstimateInput = {
  serviceType: ServiceType;
  direction: TripDirection;
  /** Manually entered one-way driving mileage. Real address-to-address routing
   *  (Google Maps / Mapbox) is not yet configured — see README. Straight-line
   *  distance must never be substituted for driving mileage. */
  oneWayMiles: number;
  appointmentDateTime: Date;
  hoursNotice: number;
  additionalPassengers?: number;
  companionAssistance?: boolean;
  companionHours?: number;
  waitingMinutesOutsideWinstonSalem?: number;
};

export type LineItem = { label: string; amount: number; note?: string };

export type EstimateResult = {
  rate: TripRate;
  mileageBilled: number;
  base: number;
  mileageCharge: number;
  preSurchargeSubtotal: number;
  surcharges: LineItem[];
  surchargeTotal: number;
  fees: LineItem[];
  feesTotal: number;
  companion: { status: "not-requested" | "pending-configuration"; amount: number; note?: string };
  total: number;
  warnings: string[];
  disclaimer: string;
};

function getRate(serviceType: ServiceType, direction: TripDirection): TripRate {
  if (serviceType === "facilityTransfer") return RATES.facilityTransfer.oneWay;
  return RATES[serviceType][direction === "round-trip" ? "roundTrip" : "oneWay"];
}

function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isEvening(date: Date) {
  return date.getHours() >= 17;
}

function isHoliday(date: Date) {
  const iso = date.toISOString().slice(0, 10);
  return RATES.holidayDates.includes(iso);
}

export function calculateEstimate(input: EstimateInput): EstimateResult {
  const warnings: string[] = [];
  const rate = getRate(input.serviceType, input.direction);

  const mileageBilled = Math.max(0, input.oneWayMiles - rate.includedMiles);
  const mileageCharge = round2(mileageBilled * rate.perMile);
  const base = rate.base;
  const preSurchargeSubtotal = round2(base + mileageCharge);

  const surcharges: LineItem[] = [];
  const applicablePcts: number[] = [];
  if (isWeekend(input.appointmentDateTime)) {
    applicablePcts.push(RATES.surcharges.weekend);
    surcharges.push({ label: "Weekend", amount: round2(preSurchargeSubtotal * RATES.surcharges.weekend) });
  }
  if (isEvening(input.appointmentDateTime)) {
    applicablePcts.push(RATES.surcharges.eveningAfter5pm);
    surcharges.push({ label: "Evening (after 5 PM)", amount: round2(preSurchargeSubtotal * RATES.surcharges.eveningAfter5pm) });
  }
  if (isHoliday(input.appointmentDateTime)) {
    applicablePcts.push(RATES.surcharges.holiday);
    surcharges.push({ label: "Holiday", amount: round2(preSurchargeSubtotal * RATES.surcharges.holiday) });
  }

  let surchargeTotal: number;
  if (RATES.surcharges.stacking === "highest-only" && applicablePcts.length > 1) {
    const highest = Math.max(...applicablePcts);
    surchargeTotal = round2(preSurchargeSubtotal * highest);
    warnings.push("Multiple surcharges applied — only the highest was charged (stacking rule: highest-only).");
  } else {
    surchargeTotal = round2(surcharges.reduce((sum, s) => sum + s.amount, 0));
    if (surcharges.length > 1) {
      warnings.push("Multiple surcharges stacked additively — this assumption is unconfirmed; verify with dispatch.");
    }
  }

  const fees: LineItem[] = [];
  if (input.hoursNotice < RATES.fees.shortNotice.thresholdHours) {
    fees.push({
      label: "Less than 24 hours’ notice",
      amount: RATES.fees.shortNotice.amount,
    });
  }

  const extraPassengers = Math.max(0, (input.additionalPassengers ?? 0) - RATES.fees.additionalPassenger.included);
  if (extraPassengers > 0) {
    fees.push({
      label: `Additional passengers (${extraPassengers})`,
      amount: round2(extraPassengers * RATES.fees.additionalPassenger.perExtra),
    });
  }

  if (input.waitingMinutesOutsideWinstonSalem && input.waitingMinutesOutsideWinstonSalem > 0) {
    const { perIntervalMinutes, amount } = RATES.fees.waitingOutsideWinstonSalem;
    const intervals = Math.ceil(input.waitingMinutesOutsideWinstonSalem / perIntervalMinutes);
    fees.push({
      label: `Waiting outside Winston-Salem (${input.waitingMinutesOutsideWinstonSalem} min)`,
      amount: round2(intervals * amount),
      note: "Billed per started 40-minute interval — rounding rule unconfirmed.",
    });
    warnings.push("Waiting-time rounding (each started interval billed in full) is unconfirmed; verify with dispatch.");
  }

  if (rate.sameDayReturnRequired && input.direction === "round-trip") {
    warnings.push("Round trip must return the same day.");
  }

  const feesTotal = round2(fees.reduce((sum, f) => sum + f.amount, 0));

  let companion: EstimateResult["companion"] = { status: "not-requested", amount: 0 };
  if (input.companionAssistance) {
    if (RATES.companion.hourlyRate == null) {
      companion = {
        status: "pending-configuration",
        amount: 0,
        note: "Companion hourly rate has not been configured yet — this will be quoted by a dispatcher.",
      };
      warnings.push("Companion assistance requested, but no hourly rate is configured — excluded from the total below.");
    } else {
      const hours = Math.max(input.companionHours ?? 0, RATES.companion.minimumHours ?? 0);
      companion = { status: "pending-configuration", amount: round2(hours * RATES.companion.hourlyRate) };
    }
  }

  const total = round2(preSurchargeSubtotal + surchargeTotal + feesTotal + (companion.status === "not-requested" ? 0 : companion.amount));

  return {
    rate,
    mileageBilled,
    base,
    mileageCharge,
    preSurchargeSubtotal,
    surcharges,
    surchargeTotal,
    fees,
    feesTotal,
    companion,
    total,
    warnings,
    disclaimer: "This is an estimate only. Final pricing is confirmed by an Allegiance dispatcher before your ride is scheduled.",
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
