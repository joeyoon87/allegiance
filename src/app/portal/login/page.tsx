import type { Metadata } from "next";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { Container } from "@/components/ui/Container";
import { Field, TextInput } from "@/components/ui/fields";
import { Logo } from "@/components/brand/Logo";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Facility Portal Login",
  description: "Login for approved Allegiance Transportation Services facility partners.",
  robots: { index: false },
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "That email or password isn't right. Try again, or contact your facility admin.",
  "no-access": "Your account doesn't have an active facility assigned yet. Contact Allegiance dispatch.",
};

export default async function PortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/portal/dashboard",
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect("/portal/login?error=invalid");
      }
      throw err;
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

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {ERROR_MESSAGES[error] ?? "Something went wrong signing you in."}
            </p>
          )}

          <form action={login} className="mt-6 grid gap-4">
            <Field label="Work Email" htmlFor="email" required>
              <TextInput id="email" name="email" type="email" required placeholder="you@facility.org" />
            </Field>
            <Field label="Password" htmlFor="password" required>
              <TextInput id="password" name="password" type="password" required />
            </Field>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-charcoal"
            >
              Log In
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
