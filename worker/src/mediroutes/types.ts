/**
 * MediRoutes is the sole system of record for transportation operations
 * (brief section 2). This interface is the only way the rest of the Worker
 * touches trip/rider data — nothing here gets duplicated into D1 as an
 * independent operational store. See client.ts for mock vs. real selection.
 */

export type MediRoutesAddress = {
  address1: string;
  city: string;
  state: string;
  zip: string;
};

export type MediRoutesTripSummary = {
  tripGuid: string;
  riderName: string;
  appointmentDateTime: string; // ISO
  pickupAddress: MediRoutesAddress;
  destinationAddress: MediRoutesAddress;
  serviceType: "AMBULATORY" | "WHEELCHAIR" | "FACILITY_TRANSFER";
  tripType: "ONE_WAY" | "ROUND_TRIP";
  status: MediRoutesTripStatus;
  confirmedPickupTime: string | null;
};

export type MediRoutesTripStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED"
  | "UNABLE_TO_COMPLETE";

export type MediRoutesTripDetail = MediRoutesTripSummary & {
  legs: {
    sequence: number;
    pickup: MediRoutesAddress;
    destination: MediRoutesAddress;
    requestedPickupTime: string;
    confirmedPickupTime: string | null;
  }[];
};

export type MediRoutesRider = {
  riderId: string;
  name: string;
  mobilityRequirements: "AMBULATORY" | "WHEELCHAIR";
};

export type CreateTripInput = {
  fundingSourceId: number;
  riderId?: string;
  newRider?: { name: string; phone?: string };
  pickup: MediRoutesAddress & { appointmentTime: string };
  destination: MediRoutesAddress;
  returnPickupTime?: string; // round trip only
  serviceType: "AMBULATORY" | "WHEELCHAIR" | "FACILITY_TRANSFER";
  tripType: "ONE_WAY" | "ROUND_TRIP";
  additionalPassengers: number;
};

export type CreateTripResult = { tripGuid: string; riderId: string };

export interface MediRoutesClient {
  readonly mode: "mock" | "live";
  createTrip(input: CreateTripInput): Promise<CreateTripResult>;
  getUpcomingRides(fundingSourceId: number): Promise<MediRoutesTripSummary[]>;
  getRideHistory(
    fundingSourceId: number,
    opts: { status?: string; q?: string; page: number; pageSize: number },
  ): Promise<{ rides: MediRoutesTripSummary[]; total: number }>;
  getTripDetail(tripGuid: string): Promise<MediRoutesTripDetail | null>;
  getWheresMyRideUrl(tripGuid: string): Promise<string | null>;
  listRiders(fundingSourceId: number): Promise<MediRoutesRider[]>;
}
