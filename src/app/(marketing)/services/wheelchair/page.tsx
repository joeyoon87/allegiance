import type { Metadata } from "next";
import { ServiceDetail } from "@/components/services/ServiceDetail";

export const metadata: Metadata = {
  title: "Wheelchair Transportation",
  description:
    "Professional wheelchair transportation with proper securement and assistance throughout Winston-Salem, Greensboro, High Point, and the Piedmont Triad.",
};

export default function WheelchairTransportationPage() {
  return (
    <ServiceDetail
      eyebrow="Wheelchair Transportation"
      title="Wheelchair Transportation"
      description="Professional, accessible transportation with wheelchair securement and appropriate assistance for every trip."
      includes={[
        "Wheelchair-accessible vehicle transport",
        "Proper wheelchair securement for the ride",
        "Door-to-door pickup and drop-off assistance",
        "Assistance entering and exiting the vehicle",
        "Coordination for medical appointments, procedures, and facility transfers",
      ]}
      idealFor={[
        "Individuals who use a wheelchair full- or part-time",
        "Patients returning home after a hospital or facility stay",
        "Recurring medical appointments and treatments",
        "Facility-to-facility transfers requiring wheelchair accessibility",
      ]}
      note="Pickup date and time is not guaranteed by an online request — Allegiance confirms availability and final scheduling directly."
    />
  );
}
