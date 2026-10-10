"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createRideRequest } from "@/lib/portal/actions";
import { Field, Select, TextArea, TextInput } from "@/components/ui/fields";

type Patient = { id: string; name: string; mobilityRequirements: "AMBULATORY" | "WHEELCHAIR" };

type WizardState = {
  existingPatientId: string; // "" means "new patient"
  newPatientName: string;
  newPatientContactName: string;
  newPatientContactPhone: string;
  mobilityRequirements: "AMBULATORY" | "WHEELCHAIR";
  additionalPassengers: string;

  pickupLine1: string;
  pickupCity: string;
  pickupState: string;
  pickupZip: string;
  destinationLine1: string;
  destinationCity: string;
  destinationState: string;
  destinationZip: string;
  appointmentDate: string;
  appointmentTime: string;
  tripType: "ONE_WAY" | "ROUND_TRIP";
  returnTime: string;
  serviceType: "AMBULATORY" | "WHEELCHAIR" | "FACILITY_TRANSFER";
  urgency: "ROUTINE" | "URGENT" | "SAME_DAY";

  companionRequested: boolean;
  companionServiceType: "APPOINTMENT_ESCORT" | "TRANSITIONAL_CARE" | "OTHER" | "";
  companionRequestedAssistance: string;
  estimatedCompanionDuration: string;
  pickupHandoffContactName: string;
  pickupHandoffContactPhone: string;
  destinationHandoffContactName: string;
  destinationHandoffContactPhone: string;
  postArrivalAssistanceRequested: boolean;
  postArrivalAssistanceNotes: string;
  specialInstructions: string;
};

function initialState(defaultTransitionalCare: boolean): WizardState {
  return {
    existingPatientId: "",
    newPatientName: "",
    newPatientContactName: "",
    newPatientContactPhone: "",
    mobilityRequirements: "AMBULATORY",
    additionalPassengers: "0",
    pickupLine1: "",
    pickupCity: "",
    pickupState: "NC",
    pickupZip: "",
    destinationLine1: "",
    destinationCity: "",
    destinationState: "NC",
    destinationZip: "",
    appointmentDate: "",
    appointmentTime: "",
    tripType: "ONE_WAY",
    returnTime: "",
    serviceType: "AMBULATORY",
    urgency: "ROUTINE",
    companionRequested: defaultTransitionalCare,
    companionServiceType: defaultTransitionalCare ? "TRANSITIONAL_CARE" : "",
    companionRequestedAssistance: "",
    estimatedCompanionDuration: "",
    pickupHandoffContactName: "",
    pickupHandoffContactPhone: "",
    destinationHandoffContactName: "",
    destinationHandoffContactPhone: "",
    postArrivalAssistanceRequested: false,
    postArrivalAssistanceNotes: "",
    specialInstructions: "",
  };
}

const STEPS = ["Patient", "Transportation", "Additional Services", "Review"] as const;

export function RideRequestWizard({
  facilityId,
  patients,
  defaultTransitionalCare,
}: {
  facilityId: string;
  patients: Patient[];
  defaultTransitionalCare: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<WizardState>(() => initialState(defaultTransitionalCare));
  const [submissionKey] = useState(() => crypto.randomUUID());
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function update<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  const selectedPatient = patients.find((p) => p.id === values.existingPatientId);

  const stepValid = useMemo(() => {
    if (step === 0) {
      return Boolean(values.existingPatientId || values.newPatientName.trim());
    }
    if (step === 1) {
      const addressesOk =
        values.pickupLine1 && values.pickupCity && values.pickupState && values.pickupZip &&
        values.destinationLine1 && values.destinationCity && values.destinationState && values.destinationZip;
      const timingOk = values.appointmentDate && values.appointmentTime;
      const returnOk = values.tripType === "ONE_WAY" || Boolean(values.returnTime);
      return Boolean(addressesOk && timingOk && returnOk);
    }
    if (step === 2) {
      return !values.companionRequested || Boolean(values.companionServiceType);
    }
    return true;
  }, [step, values]);

  async function handleSubmit() {
    setSubmitting(true);
    setErrorMessage(null);
    setFieldErrors({});

    const result = await createRideRequest(facilityId, {
      submissionKey,
      existingPatientId: values.existingPatientId || undefined,
      newPatientName: values.newPatientName || undefined,
      newPatientContactName: values.newPatientContactName || undefined,
      newPatientContactPhone: values.newPatientContactPhone || undefined,
      mobilityRequirements: values.mobilityRequirements,
      additionalPassengers: Number(values.additionalPassengers) || 0,
      pickup: {
        line1: values.pickupLine1,
        city: values.pickupCity,
        state: values.pickupState,
        zip: values.pickupZip,
      },
      destination: {
        line1: values.destinationLine1,
        city: values.destinationCity,
        state: values.destinationState,
        zip: values.destinationZip,
      },
      appointmentDate: values.appointmentDate,
      appointmentTime: values.appointmentTime,
      tripType: values.tripType,
      returnTime: values.returnTime || undefined,
      serviceType: values.serviceType,
      urgency: values.urgency,
      companionRequested: values.companionRequested,
      companionServiceType: values.companionServiceType || undefined,
      companionRequestedAssistance: values.companionRequestedAssistance || undefined,
      estimatedCompanionDuration: values.estimatedCompanionDuration
        ? Number(values.estimatedCompanionDuration)
        : undefined,
      pickupHandoffContactName: values.pickupHandoffContactName || undefined,
      pickupHandoffContactPhone: values.pickupHandoffContactPhone || undefined,
      destinationHandoffContactName: values.destinationHandoffContactName || undefined,
      destinationHandoffContactPhone: values.destinationHandoffContactPhone || undefined,
      postArrivalAssistanceRequested: values.postArrivalAssistanceRequested,
      postArrivalAssistanceNotes: values.postArrivalAssistanceNotes || undefined,
      specialInstructions: values.specialInstructions || undefined,
    });

    setSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.message);
      setFieldErrors(result.fieldErrors ?? {});
      return;
    }

    router.push(`/portal/rides/${result.id}?submitted=1`);
  }

  return (
    <div className="mt-8">
      <ol className="flex flex-wrap gap-2 text-xs font-semibold">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`rounded-full px-3 py-1.5 ${
              i === step ? "bg-ink text-paper" : i < step ? "bg-gold/20 text-gold-dark" : "bg-mist text-slate"
            }`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-2xl border border-line bg-paper p-6">
        {step === 0 && (
          <div className="grid gap-5">
            <Field label="Rider" htmlFor="existingPatientId">
              <Select
                id="existingPatientId"
                value={values.existingPatientId}
                onChange={(e) => {
                  const id = e.target.value;
                  update("existingPatientId", id);
                  const p = patients.find((pt) => pt.id === id);
                  if (p) update("mobilityRequirements", p.mobilityRequirements);
                }}
              >
                <option value="">+ New rider</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>

            {!values.existingPatientId && (
              <>
                <Field label="Rider Name" htmlFor="newPatientName" required error={fieldErrors.newPatientName}>
                  <TextInput
                    id="newPatientName"
                    value={values.newPatientName}
                    onChange={(e) => update("newPatientName", e.target.value)}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Authorized Contact Name" htmlFor="newPatientContactName">
                    <TextInput
                      id="newPatientContactName"
                      value={values.newPatientContactName}
                      onChange={(e) => update("newPatientContactName", e.target.value)}
                    />
                  </Field>
                  <Field label="Authorized Contact Phone" htmlFor="newPatientContactPhone">
                    <TextInput
                      id="newPatientContactPhone"
                      type="tel"
                      value={values.newPatientContactPhone}
                      onChange={(e) => update("newPatientContactPhone", e.target.value)}
                    />
                  </Field>
                </div>
              </>
            )}

            {!selectedPatient && (
              <Field label="Mobility Type" htmlFor="mobilityRequirements" required>
                <Select
                  id="mobilityRequirements"
                  value={values.mobilityRequirements}
                  onChange={(e) => update("mobilityRequirements", e.target.value as WizardState["mobilityRequirements"])}
                >
                  <option value="AMBULATORY">Ambulatory</option>
                  <option value="WHEELCHAIR">Wheelchair</option>
                </Select>
              </Field>
            )}

            <Field label="Additional Passenger Count" htmlFor="additionalPassengers">
              <TextInput
                id="additionalPassengers"
                type="number"
                min={0}
                max={5}
                value={values.additionalPassengers}
                onChange={(e) => update("additionalPassengers", e.target.value)}
              />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-6">
            <AddressFields
              legend="Pickup Address"
              prefix="pickup"
              values={values}
              onChange={update}
            />
            <AddressFields
              legend="Destination Address"
              prefix="destination"
              values={values}
              onChange={update}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Appointment Date" htmlFor="appointmentDate" required>
                <TextInput
                  id="appointmentDate"
                  type="date"
                  value={values.appointmentDate}
                  onChange={(e) => update("appointmentDate", e.target.value)}
                />
              </Field>
              <Field label="Appointment Time" htmlFor="appointmentTime" required>
                <TextInput
                  id="appointmentTime"
                  type="time"
                  value={values.appointmentTime}
                  onChange={(e) => update("appointmentTime", e.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Trip Type" htmlFor="tripType" required>
                <Select
                  id="tripType"
                  value={values.tripType}
                  onChange={(e) => update("tripType", e.target.value as WizardState["tripType"])}
                >
                  <option value="ONE_WAY">One-way</option>
                  <option value="ROUND_TRIP">Round trip</option>
                </Select>
              </Field>
              {values.tripType === "ROUND_TRIP" && (
                <Field label="Return Time" htmlFor="returnTime" required error={fieldErrors.returnTime}>
                  <TextInput
                    id="returnTime"
                    type="time"
                    value={values.returnTime}
                    onChange={(e) => update("returnTime", e.target.value)}
                  />
                </Field>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Service Type" htmlFor="serviceType" required>
                <Select
                  id="serviceType"
                  value={values.serviceType}
                  onChange={(e) => update("serviceType", e.target.value as WizardState["serviceType"])}
                >
                  <option value="AMBULATORY">Ambulatory</option>
                  <option value="WHEELCHAIR">Wheelchair</option>
                  <option value="FACILITY_TRANSFER">Facility-to-Hospital Transfer</option>
                </Select>
              </Field>
              <Field label="Urgency" htmlFor="urgency">
                <Select id="urgency" value={values.urgency} onChange={(e) => update("urgency", e.target.value as WizardState["urgency"])}>
                  <option value="ROUTINE">Routine</option>
                  <option value="URGENT">Urgent</option>
                  <option value="SAME_DAY">Same day</option>
                </Select>
              </Field>
            </div>

            <p className="text-xs text-slate">
              You&rsquo;re entering the appointment time — dispatch determines and confirms the
              actual pickup time.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-5">
            <label className="flex items-center gap-2.5 text-sm font-semibold text-ink">
              <input
                type="checkbox"
                checked={values.companionRequested}
                onChange={(e) => update("companionRequested", e.target.checked)}
                className="h-4 w-4 rounded border-line"
              />
              Companion assistance requested
            </label>

            {values.companionRequested && (
              <>
                <Field
                  label="Companion Service Type"
                  htmlFor="companionServiceType"
                  required
                  error={fieldErrors.companionServiceType}
                >
                  <Select
                    id="companionServiceType"
                    value={values.companionServiceType}
                    onChange={(e) =>
                      update("companionServiceType", e.target.value as WizardState["companionServiceType"])
                    }
                  >
                    <option value="">Select</option>
                    <option value="APPOINTMENT_ESCORT">Appointment Escort</option>
                    <option value="TRANSITIONAL_CARE">Transitional Care</option>
                    <option value="OTHER">Other</option>
                  </Select>
                </Field>
                <Field label="Requested Assistance" htmlFor="companionRequestedAssistance">
                  <TextArea
                    id="companionRequestedAssistance"
                    rows={3}
                    value={values.companionRequestedAssistance}
                    onChange={(e) => update("companionRequestedAssistance", e.target.value)}
                    placeholder="e.g. accompany to check-in, wait during procedure, escort to vehicle"
                  />
                </Field>
                <Field label="Estimated Companion Duration (minutes)" htmlFor="estimatedCompanionDuration">
                  <TextInput
                    id="estimatedCompanionDuration"
                    type="number"
                    min={0}
                    value={values.estimatedCompanionDuration}
                    onChange={(e) => update("estimatedCompanionDuration", e.target.value)}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Pickup Handoff Contact Name" htmlFor="pickupHandoffContactName">
                    <TextInput
                      id="pickupHandoffContactName"
                      value={values.pickupHandoffContactName}
                      onChange={(e) => update("pickupHandoffContactName", e.target.value)}
                    />
                  </Field>
                  <Field label="Pickup Handoff Contact Phone" htmlFor="pickupHandoffContactPhone">
                    <TextInput
                      id="pickupHandoffContactPhone"
                      type="tel"
                      value={values.pickupHandoffContactPhone}
                      onChange={(e) => update("pickupHandoffContactPhone", e.target.value)}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Destination Handoff Contact Name" htmlFor="destinationHandoffContactName">
                    <TextInput
                      id="destinationHandoffContactName"
                      value={values.destinationHandoffContactName}
                      onChange={(e) => update("destinationHandoffContactName", e.target.value)}
                    />
                  </Field>
                  <Field label="Destination Handoff Contact Phone" htmlFor="destinationHandoffContactPhone">
                    <TextInput
                      id="destinationHandoffContactPhone"
                      type="tel"
                      value={values.destinationHandoffContactPhone}
                      onChange={(e) => update("destinationHandoffContactPhone", e.target.value)}
                    />
                  </Field>
                </div>
                <label className="flex items-center gap-2.5 text-sm font-semibold text-ink">
                  <input
                    type="checkbox"
                    checked={values.postArrivalAssistanceRequested}
                    onChange={(e) => update("postArrivalAssistanceRequested", e.target.checked)}
                    className="h-4 w-4 rounded border-line"
                  />
                  Limited post-arrival assistance requested
                </label>
                {values.postArrivalAssistanceRequested && (
                  <Field label="Post-Arrival Assistance Notes" htmlFor="postArrivalAssistanceNotes">
                    <TextArea
                      id="postArrivalAssistanceNotes"
                      rows={2}
                      value={values.postArrivalAssistanceNotes}
                      onChange={(e) => update("postArrivalAssistanceNotes", e.target.value)}
                    />
                  </Field>
                )}
              </>
            )}

            <Field label="Additional Coordination Instructions" htmlFor="specialInstructions">
              <TextArea
                id="specialInstructions"
                rows={3}
                value={values.specialInstructions}
                onChange={(e) => update("specialInstructions", e.target.value)}
                placeholder="DME needed, facility contact, anything dispatch should know"
              />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="rounded-xl border border-gold/40 bg-mist p-4 text-sm text-ink">
              Submitting this request does <strong>not</strong> confirm transportation. A dispatcher
              will review it and confirm availability, pickup time, and final details.
            </div>

            <ReviewSection title="Rider">
              <ReviewRow label="Name" value={selectedPatient?.name || values.newPatientName} />
              <ReviewRow label="Mobility" value={values.mobilityRequirements} />
              <ReviewRow label="Additional Passengers" value={values.additionalPassengers} />
            </ReviewSection>

            <ReviewSection title="Transportation">
              <ReviewRow
                label="Pickup"
                value={`${values.pickupLine1}, ${values.pickupCity}, ${values.pickupState} ${values.pickupZip}`}
              />
              <ReviewRow
                label="Destination"
                value={`${values.destinationLine1}, ${values.destinationCity}, ${values.destinationState} ${values.destinationZip}`}
              />
              <ReviewRow label="Appointment" value={`${values.appointmentDate} ${values.appointmentTime}`} />
              <ReviewRow label="Trip Type" value={values.tripType === "ROUND_TRIP" ? "Round trip" : "One-way"} />
              <ReviewRow label="Service Type" value={values.serviceType} />
              <ReviewRow label="Urgency" value={values.urgency} />
            </ReviewSection>

            {values.companionRequested && (
              <ReviewSection title="Companion / Transitional Care">
                <ReviewRow label="Type" value={values.companionServiceType} />
                <ReviewRow label="Assistance" value={values.companionRequestedAssistance || "—"} />
              </ReviewSection>
            )}

            {errorMessage && <p className="text-sm font-medium text-red-600">{errorMessage}</p>}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-40"
          >
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              disabled={!stepValid}
              className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-paper disabled:opacity-40"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-ink hover:bg-gold-dark disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit Request"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AddressFields({
  legend,
  prefix,
  values,
  onChange,
}: {
  legend: string;
  prefix: "pickup" | "destination";
  values: WizardState;
  onChange: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
}) {
  const line1Key = `${prefix}Line1` as keyof WizardState;
  const cityKey = `${prefix}City` as keyof WizardState;
  const stateKey = `${prefix}State` as keyof WizardState;
  const zipKey = `${prefix}Zip` as keyof WizardState;

  return (
    <fieldset>
      <legend className="text-sm font-bold text-ink">{legend}</legend>
      <div className="mt-3 grid gap-4">
        <TextInput
          placeholder="Street address"
          value={values[line1Key] as string}
          onChange={(e) => onChange(line1Key, e.target.value as WizardState[typeof line1Key])}
        />
        <div className="grid grid-cols-3 gap-3">
          <TextInput
            placeholder="City"
            className="col-span-1"
            value={values[cityKey] as string}
            onChange={(e) => onChange(cityKey, e.target.value as WizardState[typeof cityKey])}
          />
          <TextInput
            placeholder="State"
            maxLength={2}
            value={values[stateKey] as string}
            onChange={(e) => onChange(stateKey, e.target.value.toUpperCase() as WizardState[typeof stateKey])}
          />
          <TextInput
            placeholder="ZIP"
            value={values[zipKey] as string}
            onChange={(e) => onChange(zipKey, e.target.value as WizardState[typeof zipKey])}
          />
        </div>
      </div>
    </fieldset>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate">{title}</h3>
      <div className="mt-2 space-y-1.5 rounded-xl border border-line p-4">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-slate">{label}</span>
      <span className="text-right font-semibold text-ink">{value}</span>
    </div>
  );
}
