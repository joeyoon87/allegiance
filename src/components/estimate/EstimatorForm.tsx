"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { calculateEstimate } from "@/lib/pricing/calculate";
import { Field, Select, TextInput } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";

type FormValues = {
  serviceType: "ambulatory" | "wheelchair" | "facilityTransfer";
  direction: "one-way" | "round-trip";
  pickupAddress: string;
  destinationAddress: string;
  manualMiles: string;
  date: string;
  time: string;
  additionalPassengers: string;
  companionAssistance: boolean;
  companionHours: string;
  waitingMinutes: string;
};

const DEFAULTS: FormValues = {
  serviceType: "ambulatory",
  direction: "one-way",
  pickupAddress: "",
  destinationAddress: "",
  manualMiles: "",
  date: "",
  time: "",
  additionalPassengers: "0",
  companionAssistance: false,
  companionHours: "0",
  waitingMinutes: "0",
};

type DistanceLookupState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; miles: number; originFormatted?: string; destinationFormatted?: string }
  | { status: "error"; message: string };

export function EstimatorForm() {
  const [values, setValues] = useState<FormValues>(DEFAULTS);
  const [now] = useState(() => Date.now());
  const [lookup, setLookup] = useState<DistanceLookupState>({ status: "idle" });
  const [useManualMiles, setUseManualMiles] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  // Debounced address -> driving-miles lookup. Straight-line distance is
  // never used as a stand-in; if the lookup fails (or no mapping API key is
  // configured yet) the customer can switch to entering miles manually.
  const addressesReady =
    values.pickupAddress.trim().length >= 6 && values.destinationAddress.trim().length >= 6;

  useEffect(() => {
    if (useManualMiles || !addressesReady) return;

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLookup({ status: "loading" });

      try {
        const res = await fetch("/api/distance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ origin: values.pickupAddress, destination: values.destinationAddress }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) {
          setLookup({ status: "error", message: data.error ?? "Couldn't calculate mileage for those addresses." });
          return;
        }
        setLookup({
          status: "success",
          miles: data.miles,
          originFormatted: data.originFormatted,
          destinationFormatted: data.destinationFormatted,
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setLookup({ status: "error", message: "Couldn't calculate mileage for those addresses." });
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [values.pickupAddress, values.destinationAddress, useManualMiles, addressesReady]);

  const displayLookup: DistanceLookupState = useManualMiles || !addressesReady ? { status: "idle" } : lookup;

  const resolvedMiles = useManualMiles
    ? Number(values.manualMiles)
    : displayLookup.status === "success"
      ? displayLookup.miles
      : NaN;

  const result = useMemo(() => {
    if (!values.date || !values.time || !Number.isFinite(resolvedMiles) || resolvedMiles < 0) return null;

    const appointmentDateTime = new Date(`${values.date}T${values.time}`);
    if (Number.isNaN(appointmentDateTime.getTime())) return null;

    const hoursNotice = (appointmentDateTime.getTime() - now) / (1000 * 60 * 60);

    return calculateEstimate({
      serviceType: values.serviceType,
      direction: values.serviceType === "facilityTransfer" ? "one-way" : values.direction,
      oneWayMiles: resolvedMiles,
      appointmentDateTime,
      hoursNotice,
      additionalPassengers: Number(values.additionalPassengers) || 0,
      companionAssistance: values.companionAssistance,
      companionHours: Number(values.companionHours) || 0,
      waitingMinutesOutsideWinstonSalem: Number(values.waitingMinutes) || 0,
    });
  }, [values, now, resolvedMiles]);

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
      <form className="grid gap-5 rounded-2xl border border-line bg-paper p-7">
        <Field label="Transportation Type" htmlFor="serviceType" required>
          <Select
            id="serviceType"
            value={values.serviceType}
            onChange={(e) => update("serviceType", e.target.value as FormValues["serviceType"])}
          >
            <option value="ambulatory">Ambulatory</option>
            <option value="wheelchair">Wheelchair</option>
            <option value="facilityTransfer">Facility-to-Hospital Transfer</option>
          </Select>
        </Field>

        {values.serviceType !== "facilityTransfer" && (
          <Field label="Trip Type" htmlFor="direction" required>
            <Select
              id="direction"
              value={values.direction}
              onChange={(e) => update("direction", e.target.value as FormValues["direction"])}
            >
              <option value="one-way">One-way</option>
              <option value="round-trip">Round trip (same-day return)</option>
            </Select>
          </Field>
        )}

        <Field label="Pickup Address" htmlFor="pickupAddress" required>
          <TextInput
            id="pickupAddress"
            placeholder="Street address, city, state"
            value={values.pickupAddress}
            onChange={(e) => update("pickupAddress", e.target.value)}
          />
        </Field>

        <Field label="Destination Address" htmlFor="destinationAddress" required>
          <TextInput
            id="destinationAddress"
            placeholder="Street address, city, state"
            value={values.destinationAddress}
            onChange={(e) => update("destinationAddress", e.target.value)}
          />
        </Field>

        {!useManualMiles && (
          <div className="-mt-2 text-xs">
            {displayLookup.status === "loading" && <p className="text-slate">Calculating driving distance…</p>}
            {displayLookup.status === "success" && (
              <p className="text-slate">
                Driving distance:{" "}
                <span className="font-semibold text-ink">{displayLookup.miles} mi</span>
              </p>
            )}
            {displayLookup.status === "error" && (
              <div>
                <p className="text-red-600">{displayLookup.message}</p>
                <button
                  type="button"
                  onClick={() => setUseManualMiles(true)}
                  className="mt-1 font-semibold text-gold-dark underline"
                >
                  Enter miles manually instead
                </button>
              </div>
            )}
            {displayLookup.status === "idle" && (
              <button type="button" onClick={() => setUseManualMiles(true)} className="font-semibold text-slate underline">
                Know the mileage already? Enter it manually
              </button>
            )}
          </div>
        )}

        {useManualMiles && (
          <Field label="Estimated One-Way Driving Miles" htmlFor="manualMiles" required>
            <TextInput
              id="manualMiles"
              type="number"
              min={0}
              step="0.1"
              placeholder="e.g. 8.5"
              value={values.manualMiles}
              onChange={(e) => update("manualMiles", e.target.value)}
            />
            <button
              type="button"
              onClick={() => setUseManualMiles(false)}
              className="mt-1.5 text-xs font-semibold text-slate underline"
            >
              Calculate from addresses instead
            </button>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Date" htmlFor="date" required>
            <TextInput id="date" type="date" value={values.date} onChange={(e) => update("date", e.target.value)} />
          </Field>
          <Field label="Time" htmlFor="time" required>
            <TextInput id="time" type="time" value={values.time} onChange={(e) => update("time", e.target.value)} />
          </Field>
        </div>

        <Field label="Additional Passengers" htmlFor="additionalPassengers">
          <TextInput
            id="additionalPassengers"
            type="number"
            min={0}
            max={5}
            value={values.additionalPassengers}
            onChange={(e) => update("additionalPassengers", e.target.value)}
          />
        </Field>

        <Field label="Waiting Time Outside Winston-Salem (minutes)" htmlFor="waitingMinutes">
          <TextInput
            id="waitingMinutes"
            type="number"
            min={0}
            value={values.waitingMinutes}
            onChange={(e) => update("waitingMinutes", e.target.value)}
          />
        </Field>

        <label className="flex items-center gap-2.5 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={values.companionAssistance}
            onChange={(e) => update("companionAssistance", e.target.checked)}
            className="h-4 w-4 rounded border-line"
          />
          Companion assistance requested
        </label>

        {values.companionAssistance && (
          <Field label="Estimated Companion Hours" htmlFor="companionHours">
            <TextInput
              id="companionHours"
              type="number"
              min={0}
              step="0.5"
              value={values.companionHours}
              onChange={(e) => update("companionHours", e.target.value)}
            />
          </Field>
        )}
      </form>

      <div className="rounded-2xl border border-line bg-mist p-7">
        <h2 className="text-lg font-bold text-ink">Estimated Total</h2>

        {!result ? (
          <p className="mt-4 text-sm text-slate">Fill in the trip details to see an estimate.</p>
        ) : (
          <>
            <dl className="mt-5 space-y-2 text-sm">
              <Row label="Base fare" value={result.base} />
              {result.mileageCharge > 0 && (
                <Row label={`Mileage (${result.mileageBilled} mi billed)`} value={result.mileageCharge} />
              )}
              {result.surcharges.map((s) => (
                <Row key={s.label} label={s.label} value={s.amount} />
              ))}
              {result.fees.map((f) => (
                <Row key={f.label} label={f.label} value={f.amount} />
              ))}
            </dl>

            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
              <span className="font-heading text-base font-bold text-ink">Estimated Total</span>
              <span className="font-heading text-2xl font-extrabold text-ink">${result.total.toFixed(2)}</span>
            </div>

            {result.companion.status === "pending-configuration" && values.companionAssistance && (
              <p className="mt-3 text-xs font-medium text-gold-dark">{result.companion.note}</p>
            )}

            {result.warnings.length > 0 && (
              <ul className="mt-4 space-y-1.5 border-t border-line pt-4">
                {result.warnings.map((w) => (
                  <li key={w} className="text-xs text-slate">
                    &middot; {w}
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-5 rounded-lg bg-paper p-4 text-xs leading-relaxed text-slate">
              {result.disclaimer}
            </p>

            <Button href="/request-ride" variant="black" className="mt-6 w-full">
              Continue to Ride Request
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-slate">{label}</dt>
      <dd className="font-semibold text-ink">${value.toFixed(2)}</dd>
    </div>
  );
}
