"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Field, TextInput } from "@/components/ui/fields";
import { Logo } from "@/components/brand/Logo";
import { SITE } from "@/lib/constants";
import { usePortalSession } from "@/lib/portal/session";
import { ApiError } from "@/lib/api";

export default function PortalLoginPage() {
  const { login } = usePortalSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(email, password);
      router.push("/portal/dashboard");
    } catch (err) {
      const apiErr = err as ApiError;
      setError(
        apiErr.status === 401
          ? "That email or password isn't right. Try again, or contact your facility admin."
          : "Something went wrong signing you in. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-mist py-16">
      <Container className="max-w-md">
        <div className="rounded-2xl border border-line bg-paper p-8">
          <Logo variant="stacked" className="mx-auto w-20" />
          <h1 className="mt-5 text-center text-xl font-bold text-ink">Facility Portal</h1>
          <p className="mt-2 text-center text-sm text-slate">
            Sign in to request transportation and manage your facility&rsquo;s rides.
          </p>

          {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          <form onSubmit={onSubmit} className="mt-6 grid gap-4">
            <Field label="Work Email" htmlFor="email" required>
              <TextInput
                id="email"
                type="email"
                required
                placeholder="you@facility.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Password" htmlFor="password" required>
              <TextInput
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-charcoal disabled:opacity-60"
            >
              {pending ? "Signing in…" : "Log In"}
            </button>
          </form>

          <div className="mt-6 border-t border-line pt-6 text-sm text-slate">
            <p>
              Represent a facility that should have access? Start with a partnership inquiry, or
              call dispatch directly.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <a
                href="/healthcare-partners#become-a-partner"
                className="inline-flex flex-1 items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-ink hover:bg-gold-dark"
              >
                Facility Partner Inquiry
              </a>
              <a
                href={SITE.phoneHref}
                className="inline-flex flex-1 items-center justify-center rounded-full border border-ink px-6 py-3 text-sm font-semibold text-ink hover:bg-ink hover:text-paper"
              >
                Call {SITE.phoneDisplay}
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
