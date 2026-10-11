import type { Env } from "../types";
import type { MediRoutesClient } from "./types";
import { MockMediRoutesClient } from "./mock-client";
import { RealMediRoutesClient } from "./real-client";

export function getMediRoutesClient(env: Env): MediRoutesClient {
  if (env.MEDIROUTES_API_BASE_URL && env.MEDIROUTES_CLIENT_ID && env.MEDIROUTES_CLIENT_SECRET) {
    return new RealMediRoutesClient(env.MEDIROUTES_API_BASE_URL, env.MEDIROUTES_CLIENT_ID, env.MEDIROUTES_CLIENT_SECRET);
  }
  return new MockMediRoutesClient(env.DB);
}

export * from "./types";
