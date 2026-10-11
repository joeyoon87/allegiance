import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

export const dynamic = "force-static";

const routes = [
  "",
  "/services",
  "/services/wheelchair",
  "/services/ambulatory",
  "/services/companions",
  "/transitional-care",
  "/healthcare-partners",
  "/service-area",
  "/about",
  "/contact",
  "/estimate",
  "/request-ride",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return routes.map((route) => ({
    url: `${SITE.url}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
