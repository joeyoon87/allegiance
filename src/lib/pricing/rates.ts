/**
 * Transportation pricing configuration.
 *
 * This is the single source of truth the estimator reads from. Values marked
 * CONFIRMED were set directly by Joe. Values marked UNCONFIRMED are the
 * conservative defaults noted in the original rate sheet but still need a
 * final decision before they drive real customer billing — see each
 * comment. Until then, the estimator surfaces them as estimates subject to
 * dispatcher confirmation (never an auto-charged final price).
 */

export type TripRate = {
  base: number;
  includedMiles: number;
  perMile: number;
  sameDayReturnRequired?: boolean;
};

export const RATES = {
  ambulatory: {
    // CONFIRMED by Joe 2026-10-09: 5 miles included, then $2.50/mi.
    oneWay: { base: 35, includedMiles: 5, perMile: 2.5 } satisfies TripRate,
    // UNCONFIRMED: round-trip included-mileage threshold assumed same as one-way (5 mi).
    // Same-day return is required per the rate sheet.
    roundTrip: { base: 65, includedMiles: 5, perMile: 2.5, sameDayReturnRequired: true } satisfies TripRate,
  },
  facilityTransfer: {
    // UNCONFIRMED: no included-mileage threshold was specified; defaulting to 0 (charged from mile 1).
    oneWay: { base: 50, includedMiles: 0, perMile: 2.25 } satisfies TripRate,
  },
  wheelchair: {
    // UNCONFIRMED: included-mileage threshold not specified in the rate sheet; defaulting to 0.
    oneWay: { base: 55, includedMiles: 0, perMile: 2.25 } satisfies TripRate,
    roundTrip: { base: 90, includedMiles: 0, perMile: 2.25, sameDayReturnRequired: true } satisfies TripRate,
  },

  surcharges: {
    weekend: 0.2,
    eveningAfter5pm: 0.15,
    holiday: 0.25,
    // UNCONFIRMED: assuming surcharges stack additively (sum of applicable percentages
    // applied to the base+mileage subtotal). Could instead be "highest applicable only".
    stacking: "additive" as "additive" | "highest-only",
  },

  fees: {
    shortNotice: { thresholdHours: 24, amount: 25 },
    additionalPassenger: { included: 1, perExtra: 15 },
    // UNCONFIRMED: assuming each started 40-minute interval is billed in full (rounded up).
    waitingOutsideWinstonSalem: { perIntervalMinutes: 40, amount: 25, roundUpPartialInterval: true },
    bodilyFluidsCleanup: 50,
  },

  // UNCONFIRMED / NOT SUPPLIED: companion hourly rate and minimum duration were not
  // provided. Leave null until Joe configures them — the estimator will show
  // companion cost as "pending confirmation" rather than invent a number.
  companion: {
    hourlyRate: null as number | null,
    minimumHours: null as number | null,
  },

  // Admin-configurable holiday calendar (ISO dates, YYYY-MM-DD) for the holiday surcharge.
  holidayDates: [] as string[],
};

export type ServiceType = "ambulatory" | "wheelchair" | "facilityTransfer";
export type TripDirection = "one-way" | "round-trip";
