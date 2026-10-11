export type Env = {
  DB: D1Database;
  ALLOWED_ORIGINS: string;
  SESSION_SECRET: string;
  GOOGLE_MAPS_API_KEY?: string;
  // All optional: absence is exactly what puts the MediRoutes client into
  // mock mode. See src/mediroutes/client.ts.
  MEDIROUTES_API_BASE_URL?: string;
  MEDIROUTES_CLIENT_ID?: string;
  MEDIROUTES_CLIENT_SECRET?: string;
};

export type Variables = {
  userId: string;
};
