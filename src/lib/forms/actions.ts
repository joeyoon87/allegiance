"use server";

import { z } from "zod";
import { contactSchema, facilityPartnerSchema, rideRequestSchema } from "@/lib/forms/schema";
import { recordSubmission } from "@/lib/forms/store";
import type { FormState } from "@/lib/forms/state";

function flattenErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function formDataToObject(formData: FormData) {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (key === "companionAssistance") {
      obj[key] = value === "on" || value === "true";
      continue;
    }
    obj[key] = value;
  }
  if (!("companionAssistance" in obj)) obj.companionAssistance = false;
  return obj;
}

export async function submitRideRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = rideRequestSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: flattenErrors(parsed.error) };
  }

  await recordSubmission("ride-requests", parsed.data);

  return {
    status: "success",
    message:
      "Your request has been received. Transportation is not confirmed until Allegiance contacts you. Need a ride today? Call 336-962-7433.",
  };
}

export async function submitFacilityPartnerInquiry(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = facilityPartnerSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: flattenErrors(parsed.error) };
  }

  await recordSubmission("facility-partner-inquiries", parsed.data);

  return {
    status: "success",
    message: "Thank you. A member of our team will follow up to discuss a facility partnership.",
  };
}

export async function submitContactMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = contactSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: flattenErrors(parsed.error) };
  }

  await recordSubmission("contact-messages", parsed.data);

  return {
    status: "success",
    message: "Thanks for reaching out — we'll be in touch soon.",
  };
}
