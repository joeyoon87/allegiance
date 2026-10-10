import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/constants";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | Non-Emergency Medical Transportation, Piedmont Triad`,
    template: `%s | ${SITE.name}`,
  },
  description:
    "Allegiance Transportation Services provides wheelchair and ambulatory non-emergency medical transportation, medical appointment companions, and transitional care coordination throughout Winston-Salem, Greensboro, High Point, and the Piedmont Triad.",
  openGraph: {
    type: "website",
    siteName: SITE.name,
    url: SITE.url,
    title: `${SITE.name} | A Partner in Patient Care`,
    description:
      "Reliable wheelchair transportation, coordinated patient transitions, and medical appointment companion services throughout the Piedmont Triad.",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${manrope.variable} font-sans antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
