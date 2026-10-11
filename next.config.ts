import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: `npm run build` produces a plain folder of HTML/CSS/JS
  // in `out/` with no server required — that's the folder that gets
  // dragged into Cloudflare Pages. No Server Actions, API routes, or
  // middleware can run here; all dynamic behavior (forms, the estimator's
  // distance lookup, the facility portal) calls the separate Cloudflare
  // Worker API instead. See CLAUDE.md "Cloudflare-first architecture".
  output: "export",
  images: {
    // No server means no on-demand image optimization endpoint.
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
