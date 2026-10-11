"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { contactSchema } from "@/lib/forms/schema";
import { idleFormState, flattenZodErrors, type FormState } from "@/lib/formState";
import { apiFetch, ApiError } from "@/lib/api";
import { Field, TextArea, TextInput } from "@/components/ui/fields";

export function ContactForm() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <ContactFormInner />
    </Suspense>
  );
}

function FormSkeleton() {
  return <div className="h-96 animate-pulse rounded-2xl border border-line bg-mist" />;
}

function ContactFormInner() {
  const defaultTopic = useSearchParams().get("topic") ?? undefined;
  const [state, setState] = useState<FormState>(idleFormState);
  const [pending, setPending] = useState(false);
  const errors = state.fieldErrors ?? {};

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const raw = Object.fromEntries(formData.entries());

    const parsed = contactSchema.safeParse(raw);
    if (!parsed.success) {
      setState({ status: "error", message: "Please fix the highlighted fields.", fieldErrors: flattenZodErrors(parsed.error) });
      return;
    }

    setPending(true);
    try {
      await apiFetch("/forms/contact", { body: parsed.data });
      setState({ status: "success", message: "Thanks for reaching out — we'll be in touch soon." });
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
        <h3 className="text-lg font-bold text-ink">Message sent</h3>
        <p className="mt-2 text-sm text-slate">{state.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 rounded-2xl border border-line bg-paper p-7">
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
