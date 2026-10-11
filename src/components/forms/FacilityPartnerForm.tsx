"use client";

import { useState } from "react";
import { facilityPartnerSchema } from "@/lib/forms/schema";
import { idleFormState, flattenZodErrors, type FormState } from "@/lib/formState";
import { apiFetch, ApiError } from "@/lib/api";
import { Field, Select, TextArea, TextInput } from "@/components/ui/fields";

export function FacilityPartnerForm() {
  const [state, setState] = useState<FormState>(idleFormState);
  const [pending, setPending] = useState(false);
  const errors = state.fieldErrors ?? {};

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const raw = Object.fromEntries(formData.entries());

    const parsed = facilityPartnerSchema.safeParse(raw);
    if (!parsed.success) {
      setState({ status: "error", message: "Please fix the highlighted fields.", fieldErrors: flattenZodErrors(parsed.error) });
      return;
    }

    setPending(true);
    try {
      await apiFetch("/forms/facility-partner", { body: parsed.data });
      setState({ status: "success", message: "Thank you. A member of our team will follow up to discuss a facility partnership." });
    } catch (err) {
      const apiErr = err as ApiError;
      setState({ status: "error", message: apiErr.message, fieldErrors: apiErr.fieldErrors });
    } finally {
      setPending(false);
    }
  }

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-gold/40 bg-mist p-8 text-center">
        <h3 className="text-lg font-bold text-ink">Request received</h3>
        <p className="mt-2 text-sm text-slate">{state.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 rounded-2xl border border-line bg-paper p-7 sm:grid-cols-2">
      <Field label="Organization" htmlFor="organization" required error={errors.organization} className="sm:col-span-2">
        <TextInput id="organization" name="organization" required />
      </Field>

      <Field label="Facility Type" htmlFor="facilityType" required error={errors.facilityType}>
        <Select id="facilityType" name="facilityType" required defaultValue="">
          <option value="" disabled>
            Select facility type
          </option>
          <option value="hospital">Hospital / Discharge Planning</option>
          <option value="skilled-nursing">Skilled Nursing / Rehabilitation</option>
          <option value="assisted-living">Assisted Living / Senior Living</option>
          <option value="outpatient">Outpatient Surgery / Infusion / Specialty Clinic</option>
          <option value="other">Other</option>
        </Select>
      </Field>

      <Field label="Estimated Monthly Volume" htmlFor="estimatedMonthlyVolume" error={errors.estimatedMonthlyVolume}>
        <TextInput id="estimatedMonthlyVolume" name="estimatedMonthlyVolume" placeholder="e.g. 10–20 rides/month" />
      </Field>

      <Field label="Contact Name" htmlFor="contactName" required error={errors.contactName}>
        <TextInput id="contactName" name="contactName" required />
      </Field>

      <Field label="Job Title" htmlFor="jobTitle" required error={errors.jobTitle}>
        <TextInput id="jobTitle" name="jobTitle" required />
      </Field>

      <Field label="Work Email" htmlFor="workEmail" required error={errors.workEmail}>
        <TextInput id="workEmail" name="workEmail" type="email" required />
      </Field>

      <Field label="Phone" htmlFor="phone" required error={errors.phone}>
        <TextInput id="phone" name="phone" type="tel" required />
      </Field>

      <Field label="Primary Transportation Needs" htmlFor="primaryNeeds" required error={errors.primaryNeeds} className="sm:col-span-2">
        <TextArea id="primaryNeeds" name="primaryNeeds" rows={3} required />
      </Field>

      <Field label="Message" htmlFor="message" error={errors.message} className="sm:col-span-2">
        <TextArea id="message" name="message" rows={3} />
      </Field>

      {state.status === "error" && (
        <p className="sm:col-span-2 text-sm font-medium text-red-600">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="sm:col-span-2 inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-charcoal disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Become a Facility Partner"}
      </button>
    </form>
  );
}
