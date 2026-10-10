import type { Metadata } from "next";
import { ServiceDetail } from "@/components/services/ServiceDetail";

export const metadata: Metadata = {
  title: "Medical Appointment Companions",
  description:
    "Transportation plus companion assistance for medical appointments, procedures, and return journeys throughout the Piedmont Triad.",
};

export default function CompanionsPage() {
  return (
    <ServiceDetail
      eyebrow="Medical Appointment Companions"
      title="Medical Appointment Companions"
      description="Transportation plus companion assistance for appointments, procedures, and return journeys."
      includes={[
        "Transportation to and from the appointment",
        "Companion accompaniment into the facility",
        "Assistance with check-in",
        "Waiting during the appointment or procedure",
        "Escort back to the vehicle and safe return home",
      ]}
      idealFor={[
        "Procedures or appointments where a patient should not be alone",
        "Patients without a family member or caregiver available to attend",
        "Outpatient surgery, infusion, and specialty clinic visits",
        "Appointments where post-procedure monitoring during transport is appropriate",
      ]}
      note="Companions provide nonclinical accompaniment and assistance. Allegiance does not provide clinical supervision, medical interpretation, medication administration, or personal care unless specifically authorized."
    />
  );
}
