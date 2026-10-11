"use client";

import { useState } from "react";
import { rideRequestSchema } from "@/lib/forms/schema";
import { idleFormState, formDataToObject, flattenZodErrors, type FormState } from "@/lib/formState";
import { apiFetch, ApiError } from "@/lib/api";
import { Field, Select, TextArea, TextInput } from "@/components/ui/fields";
import { SITE } from "@/lib/constants";

export function RideRequestForm() {
  const [state, setState] = useState<FormState>(idleFormState);
  const [pending, setPending] = useState(false);
  const errors = state.fieldErrors ?? {};

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const raw = formDataToObject(formData, ["companionAssistance"]);

    const parsed = rideRequestSchema.safeParse(raw);
    if (!parsed.success) {
      setState({ status: "error", message: "Please fix the highlighted fields.", fieldErrors: flattenZodErrors(parsed.error) });
      return;
    }

    setPending(true);
    try {
      await apiFetch("/forms/ride-request", { body: parsed.data });
      setState({
        status: "success",
        message:
          "Your request has been received. Transportation is not confirmed until Allegiance contacts you. Need a ride today? Call 336-962-7433.",
      });
    } catch (err) {
      const apiErr = err as ApiError;
      setState({ status: "error", message: apiErr.message, fieldErrors: apiErr.fieldErrors });
    } finally {
      setPending(false);
    }
  }

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-gold/40 bg-mist p-8">
        <h3 className="text-lg font-bold text-ink">Request received</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate">{state.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 rounded-2xl border border-line bg-paper p-7 sm:grid-cols-2">
      <Field label="Rider Name" htmlFor="riderName" required error={errors.riderName} className="sm:col-span-2">
        <TextInput id="riderName" name="riderName" required />
      </Field>

      <Field label="Contact Name (if different)" htmlFor="contactName" error={errors.contactName}>
        <TextInput id="contactName" name="contactName" />
      </Field>
      <Field label="Contact Phone" htmlFor="contactPhone" required error={errors.contactPhone}>
        <TextInput id="contactPhone" name="contactPhone" type="tel" required />
      </Field>

      <Field label="Contact Email" htmlFor="contactEmail" required error={errors.contactEmail} className="sm:col-span-2">
        <TextInput id="contactEmail" name="contactEmail" type="email" required />
      </Field>

      <Field label="Pickup Address" htmlFor="pickupAddress" required error={errors.pickupAddress} className="sm:col-span-2">
        <TextInput id="pickupAddress" name="pickupAddress" required />
      </Field>
      <Field label="Destination Address" htmlFor="destinationAddress" required error={errors.destinationAddress} className="sm:col-span-2">
        <TextInput id="destinationAddress" name="destinationAddress" required />
      </Field>

      <Field label="Appointment Date" htmlFor="appointmentDate" required error={errors.appointmentDate}>
        <TextInput id="appointmentDate" name="appointmentDate" type="date" required />
      </Field>
      <Field label="Appointment Time" htmlFor="appointmentTime" required error={errors.appointmentTime}>
        <TextInput id="appointmentTime" name="appointmentTime" type="time" required />
      </Field>

      <Field label="Mobility Type" htmlFor="mobilityType" required error={errors.mobilityType}>
        <Select id="mobilityType" name="mobilityType" required defaultValue="">
          <option value="" disabled>
            Select
          </option>
          <option value="ambulatory">Ambulatory</option>
          <option value="wheelchair">Wheelchair</option>
        </Select>
      </Field>
      <Field label="Trip Type" htmlFor="tripType" required error={errors.tripType}>
        <Select id="tripType" name="tripType" required defaultValue="">
          <option value="" disabled>
            Select
          </option>
          <option value="one-way">One-way</option>
          <option value="round-trip">Round trip</option>
        </Select>
      </Field>

      <Field label="Accompanying Passengers" htmlFor="additionalPassengers" error={errors.additionalPassengers}>
        <TextInput id="additionalPassengers" name="additionalPassengers" type="number" min={0} max={5} defaultValue={0} />
      </Field>

      <label className="flex items-center gap-2.5 self-end pb-2.5 text-sm font-semibold text-ink">
        <input type="checkbox" name="companionAssistance" className="h-4 w-4 rounded border-line" />
        Companion assistance requested
      </label>

      <Field
        label="Additional Coordination Instructions"
        htmlFor="notes"
        error={errors.notes}
        className="sm:col-span-2"
      >
        <TextArea id="notes" name="notes" rows={3} placeholder="DME needed, facility contact, anything dispatch should know" />
      </Field>

      {state.status === "error" && (
        <p className="sm:col-span-2 text-sm font-medium text-red-600">{state.message}</p>
      )}

      <p className="sm:col-span-2 text-xs text-slate">
        Need transportation today? Call{" "}
        <a href={SITE.phoneHref} className="font-semibold text-ink underline">
          {SITE.phoneDisplay}
        </a>{" "}
        to confirm availability.
      </p>

      <button
        type="submit"
        disabled={pending}
        className="sm:col-span-2 inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-gold-dark disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit Transportation Request"}
      </button>
    </form>
  );
}
