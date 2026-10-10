import { Container } from "@/components/ui/Container";

const STEPS = [
  { title: "Request transportation.", body: "Submit a request online or call dispatch directly." },
  { title: "Allegiance confirms availability and pricing.", body: "A dispatcher reviews your request and follows up to confirm details." },
  { title: "The transportation team coordinates pickup.", body: "Your driver is scheduled and your pickup is confirmed." },
  { title: "The patient reaches the destination with the agreed level of assistance.", body: "Door-to-door, wheelchair, or companion support — as arranged." },
];

export function HowItWorks() {
  return (
    <section className="bg-paper py-16 lg:py-24">
      <Container>
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-widest text-gold-dark">How It Works</p>
          <h2 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">Simple to Request. Carefully Coordinated.</h2>
          <p className="mt-4 text-sm text-slate">
            Online requests are reviewed by a dispatcher before transportation is confirmed.
          </p>
        </div>

        <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative pl-14">
              <span className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border-2 border-gold font-heading text-lg font-bold text-ink">
                {i + 1}
              </span>
              <h3 className="font-heading text-base font-bold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
