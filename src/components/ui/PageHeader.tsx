import { ReactNode } from "react";
import { Container } from "@/components/ui/Container";

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-line bg-mist py-14 lg:py-20">
      <Container>
        {eyebrow && (
          <p className="text-sm font-bold uppercase tracking-widest text-gold-dark">{eyebrow}</p>
        )}
        <h1 className="mt-3 max-w-3xl text-3xl font-extrabold text-ink sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate">{description}</p>
        )}
        {children}
      </Container>
    </section>
  );
}
