import Image from "next/image";
import Link from "next/link";

export function Logo({
  variant = "horizontal",
  tone = "dark",
  className = "",
  priority = false,
}: {
  variant?: "horizontal" | "stacked" | "shield";
  tone?: "dark" | "light";
  className?: string;
  priority?: boolean;
}) {
  const file =
    variant === "horizontal"
      ? tone === "light"
        ? "logo-horizontal-white.svg"
        : "logo-horizontal.svg"
      : variant === "stacked"
        ? tone === "light"
          ? "logo-stacked-white.svg"
          : "logo-stacked.svg"
        : tone === "light"
          ? "shield-icon-white.svg"
          : "shield-icon.svg";

  const dims =
    variant === "horizontal"
      ? { width: 284, height: 86 }
      : variant === "stacked"
        ? { width: 103, height: 100 }
        : { width: 40, height: 40 };

  return (
    <Link href="/" className={`inline-flex items-center ${className}`} aria-label={`${"Allegiance Transportation Services"} home`}>
      <Image
        src={`/brand/${file}`}
        alt="Allegiance Transportation Services"
        width={dims.width}
        height={dims.height}
        priority={priority}
        className="h-auto w-full"
      />
    </Link>
  );
}
