"use client";

import { useActionState } from "react";
import { submitContactMessage } from "@/lib/forms/actions";
import { idleFormState } from "@/lib/forms/state";
import { Field, TextArea, TextInput } from "@/components/ui/fields";

export function ContactForm({ defaultTopic }: { defaultTopic?: string }) {
  const [state, formAction, pending] = useActionState(submitContactMessage, idleFormState);
  const errors = state.fieldErrors ?? {};

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-gold/40 bg-mist p-8 text-center">
        <h3 className="text-lg font-bold text-ink">Message sent</h3>
        <p className="mt-2 text-sm text-slate">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-5 rounded-2xl border border-line bg-paper p-7">
      <input type="hidden" name="topic" value={defaultTopic ?? "general"} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" required error={errors.name}>
          <TextInput id="name" name="name" required />
        </Field>
        <Field label="Phone" htmlFor="phone" error={errors.phone}>
          <TextInput id="phone" name="phone" type="tel" />
        </Field>
      </div>

      <Field label="Email" htmlFor="email" required error={errors.email}>
        <TextInput id="email" name="email" type="email" required />
      </Field>

      <Field label="Message" htmlFor="message" required error={errors.message}>
        <TextArea id="message" name="message" rows={4} required />
      </Field>

      {state.status === "error" && <p className="text-sm font-medium text-red-600">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-charcoal disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
