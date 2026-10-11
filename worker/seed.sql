-- Fictional demonstration data only — never copy real facility/patient
-- records in here. Every name is prefixed [DEMO]. Password for both demo
-- logins: DemoPass123!
--
-- mediroutes_funding_source_id values below (9001/9002) are PLACEHOLDERS
-- for the mock client — they do not correspond to anything in real
-- MediRoutes. The real facility-to-funding-source mapping is unresolved
-- (see CLAUDE.md "Facility identification problem") and must be set by an
-- admin once confirmed.

INSERT OR IGNORE INTO facilities (id, name, facility_type, address_line1, city, state, zip, phone, billing_email, account_status, mediroutes_funding_source_id)
VALUES
  ('11111111-1111-4111-8111-111111111101', '[DEMO] Forsyth Skilled Nursing & Rehab', 'SKILLED_NURSING', '100 Demo Care Lane', 'Winston-Salem', 'NC', '27101', '336-555-0101', 'billing@forsythsnf.demo', 'ACTIVE', 9001),
  ('11111111-1111-4111-8111-111111111102', '[DEMO] Piedmont Triad Medical Center', 'HOSPITAL', '200 Demo Hospital Drive', 'Winston-Salem', 'NC', '27103', '336-555-0102', 'billing@piedmonttriadmc.demo', 'ACTIVE', 9002);

-- password_hash is PBKDF2("DemoPass123!") — see worker/src/lib/password.ts
INSERT OR IGNORE INTO users (id, name, email, password_hash, status)
VALUES
  ('22222222-2222-4222-8222-222222222201', '[DEMO] Dana Admin', 'admin@forsythsnf.demo', 'pbkdf2$210000$6f7211c50c8f956e81927de7afa2feb5$1b1125b970a3e87304d9e5bc126ad984c3be046de4f1a50927d5112a5cfd6d7d', 'ACTIVE'),
  ('22222222-2222-4222-8222-222222222202', '[DEMO] Sam Scheduler', 'scheduler@piedmonttriadmc.demo', 'pbkdf2$210000$6f7211c50c8f956e81927de7afa2feb5$1b1125b970a3e87304d9e5bc126ad984c3be046de4f1a50927d5112a5cfd6d7d', 'ACTIVE');

INSERT OR IGNORE INTO facility_memberships (id, user_id, facility_id, role, status)
VALUES
  ('33333333-3333-4333-8333-333333333301', '22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111101', 'FACILITY_ADMIN', 'ACTIVE'),
  ('33333333-3333-4333-8333-333333333302', '22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111102', 'FACILITY_SCHEDULER', 'ACTIVE'),
  ('33333333-3333-4333-8333-333333333303', '22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111102', 'FACILITY_SCHEDULER', 'ACTIVE');

-- Mock MediRoutes riders (stands in for real Riders until credentials exist)
INSERT OR IGNORE INTO mock_mediroutes_riders (rider_id, funding_source_id, name, mobility_requirements)
VALUES
  ('44444444-4444-4444-8444-444444444401', 9001, '[DEMO] Eleanor H.', 'WHEELCHAIR'),
  ('44444444-4444-4444-8444-444444444402', 9001, '[DEMO] Margaret T.', 'WHEELCHAIR'),
  ('44444444-4444-4444-8444-444444444403', 9002, '[DEMO] Walter B.', 'AMBULATORY');

-- Mock MediRoutes trips — a mix of statuses so the dashboard/list have
-- something to show immediately.
INSERT OR IGNORE INTO mock_mediroutes_trips
  (trip_guid, funding_source_id, rider_id, rider_name, appointment_datetime,
   pickup_address1, pickup_city, pickup_state, pickup_zip,
   destination_address1, destination_city, destination_state, destination_zip,
   service_type, trip_type, status)
VALUES
  ('55555555-5555-4555-8555-555555555501', 9001, '44444444-4444-4444-8444-444444444401', '[DEMO] Eleanor H.',
   datetime('now', '+2 days', '+10 hours'),
   '100 Demo Care Lane', 'Winston-Salem', 'NC', '27101',
   '350 Demo Specialty Clinic Rd', 'Winston-Salem', 'NC', '27104',
   'WHEELCHAIR', 'ROUND_TRIP', 'CONFIRMED'),
  ('55555555-5555-4555-8555-555555555502', 9002, '44444444-4444-4444-8444-444444444403', '[DEMO] Walter B.',
   datetime('now', '+1 day', '+9 hours'),
   '200 Demo Hospital Drive', 'Winston-Salem', 'NC', '27103',
   '45 Demo Residential Ct', 'Clemmons', 'NC', '27012',
   'AMBULATORY', 'ONE_WAY', 'SUBMITTED');
