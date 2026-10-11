-- Allegiance Facility Portal — D1 schema.
--
-- IMPORTANT: this database stores PORTAL METADATA ONLY — facility
-- accounts, user logins, permissions, and a thin reconciliation link to
-- MediRoutes trip records. It is deliberately NOT a copy of operational
-- transportation data (riders, trips, schedules, statuses) — MediRoutes
-- remains the sole system of record for all of that, fetched live via
-- their API (src/mediroutes/client.ts). See CLAUDE.md "Architecture".

CREATE TABLE IF NOT EXISTS facilities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  facility_type TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  phone TEXT NOT NULL,
  billing_email TEXT NOT NULL,
  account_status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | ACTIVE | SUSPENDED
  -- How this facility maps into MediRoutes. UNRESOLVED as of 2026-10-11 —
  -- see CLAUDE.md "Facility identification problem". NULL until confirmed.
  mediroutes_funding_source_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | INVITED | SUSPENDED
  internal_role TEXT, -- NULL for facility users; SUPER_ADMIN | DISPATCHER | BILLING for Allegiance staff
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS facility_memberships (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  facility_id TEXT NOT NULL REFERENCES facilities(id),
  role TEXT NOT NULL, -- FACILITY_ADMIN | FACILITY_SCHEDULER | FACILITY_VIEWER
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | INVITED | REVOKED
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, facility_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON facility_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_facility ON facility_memberships(facility_id);

-- Links a portal submission to its MediRoutes trip. This is bookkeeping
-- for the submit pipeline (idempotency + sync status), NOT a duplicate
-- ride-history store — ride lists/detail always read live from MediRoutes.
CREATE TABLE IF NOT EXISTS ride_reconciliation (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL REFERENCES facilities(id),
  created_by_user_id TEXT NOT NULL REFERENCES users(id),
  submission_key TEXT NOT NULL UNIQUE, -- idempotency key from the client
  public_request_number TEXT NOT NULL UNIQUE,
  mediroutes_trip_guid TEXT, -- NULL until MediRoutes confirms creation
  mediroutes_rider_id TEXT,
  sync_status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | SYNCED | FAILED
  sync_error TEXT,
  request_payload TEXT NOT NULL, -- JSON snapshot of what was submitted
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_facility ON ride_reconciliation(facility_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_trip_guid ON ride_reconciliation(mediroutes_trip_guid);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  metadata TEXT, -- JSON, non-PHI only
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_events(target_type, target_id);

-- Public marketing-site form submissions (contact, ride-request before a
-- facility relationship exists, facility-partner inquiries). Separate
-- concern from the authenticated facility portal above.
CREATE TABLE IF NOT EXISTS marketing_submissions (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL, -- contact | ride-request | facility-partner
  payload TEXT NOT NULL, -- JSON
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- MOCK-ONLY. Stands in for MediRoutes while no API credentials are
-- configured (src/mediroutes/mock-client.ts) so trip creation/lookup work
-- end-to-end for demos. Never read by the real client, and should be
-- dropped once real MediRoutes credentials are in place — see CLAUDE.md.
CREATE TABLE IF NOT EXISTS mock_mediroutes_trips (
  trip_guid TEXT PRIMARY KEY,
  funding_source_id INTEGER NOT NULL,
  rider_id TEXT NOT NULL,
  rider_name TEXT NOT NULL,
  appointment_datetime TEXT NOT NULL,
  pickup_address1 TEXT NOT NULL,
  pickup_city TEXT NOT NULL,
  pickup_state TEXT NOT NULL,
  pickup_zip TEXT NOT NULL,
  destination_address1 TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  destination_state TEXT NOT NULL,
  destination_zip TEXT NOT NULL,
  service_type TEXT NOT NULL,
  trip_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SUBMITTED',
  confirmed_pickup_time TEXT,
  return_pickup_time TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mock_trips_fsid ON mock_mediroutes_trips(funding_source_id);

CREATE TABLE IF NOT EXISTS mock_mediroutes_riders (
  rider_id TEXT PRIMARY KEY,
  funding_source_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  mobility_requirements TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mock_riders_fsid ON mock_mediroutes_riders(funding_source_id);

-- Single-row atomic counter for public request numbers (ATS-000101…).
CREATE TABLE IF NOT EXISTS request_number_counter (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  value INTEGER NOT NULL DEFAULT 100
);
INSERT OR IGNORE INTO request_number_counter (id, value) VALUES (1, 100);
