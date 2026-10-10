import type { Metadata } from "next";
import { ServiceDetail } from "@/components/services/ServiceDetail";

export const metadata: Metadata = {
  title: "Ambulatory Transportation",
  description:
    "Door-to-door ambulatory transportation for patients who can walk but need assistance getting to medical appointments across the Piedmont Triad.",
};

export default function AmbulatoryTransportationPage() {
  return (
    <ServiceDetail
      eyebrow="Ambulatory Transportation"
      title="Ambulatory Transportation"
      description="Door-to-door transportation for individuals who can walk but need assistance getting to appointments."
      includes={[
        "Door-to-door pickup and drop-off",
        "Assistance to and from the vehicle",
        "Support for individuals using a cane or walker",
        "Round-trip scheduling for same-day return",
      ]}
      idealFor={[
        "Routine medical and specialist appointments",
        "Patients who are mobile but shouldn't drive themselves",
        "Older adults attending appointments without a family escort",
        "Outpatient visits, lab work, and follow-up care",
      ]}
      note="Pickup date and time is not guaranteed by an online request — Allegiance confirms availability and final scheduling directly."
    />
  );
}
