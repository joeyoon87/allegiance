import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env, Variables } from "./types";
import { authRoutes } from "./routes/auth";
import { formsRoutes } from "./routes/forms";
import { portalRoutes } from "./routes/portal";
import { distanceRoutes } from "./routes/distance";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use("*", async (c, next) => {
  const allowed = c.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
  return cors({
    origin: (origin) => (allowed.includes(origin) ? origin : allowed[0]),
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  })(c, next);
});

app.get("/", (c) => c.json({ service: "allegiance-portal-api", status: "ok" }));

app.route("/auth", authRoutes);
app.route("/forms", formsRoutes);
app.route("/portal", portalRoutes);
app.route("/distance", distanceRoutes);

app.notFound((c) => c.json({ message: "Not found." }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ message: "Something went wrong." }, 500);
});

export default app;
