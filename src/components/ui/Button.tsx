import Link from "next/link";
import { ReactNode } from "react";

type Variant = "gold" | "black" | "outline" | "outline-white" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

const variants: Record<Variant, string> = {
  gold: "bg-gold text-ink hover:bg-gold-dark",
  black: "bg-ink text-paper hover:bg-charcoal",
  outline: "border border-ink text-ink hover:bg-ink hover:text-paper",
  "outline-white": "border border-paper text-paper hover:bg-paper hover:text-ink",
  ghost: "text-ink hover:text-gold-dark",
};

export function Button({
  href,
  variant = "gold",
  children,
  className = "",
  onClick,
  type = "button",
}: {
  href?: string;
  variant?: Variant;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  const classes = `${base} ${variants[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
