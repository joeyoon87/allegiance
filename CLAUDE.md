# Allegiance Website Rebuild

## Objective

Full rebuild of rideallegiance.com (currently a small WordPress site) into a
Next.js marketing + booking site, per Joe's master brief: healthcare-partner
acquisition, ride estimator, ride request workflow, transitional care as a
differentiator, facility portal, MediRoutes integration.

## Status (as of 2026-10-09)

**Built and verified** (tests pass, production build is clean, pages manually
checked in-browser at desktop and mobile widths):
- Design system: brand colors/fonts, true-vector logo assets extracted from
  the supplied PDFs (not redrawn) in `public/brand/`, favicon.
- Global layout: header (desktop nav + mobile menu), footer.
- Pages: home, services (+ wheelchair/ambulatory/companions detail pages),
  transitional-care, healthcare-partners (with partner inquiry form),
  service-area, about, contact (with form), privacy, terms (both marked as
  drafts needing legal review), portal/login (placeholder UI only, no auth).
- Ride estimator (`/estimate`) backed by a real pricing engine
  (`src/lib/pricing/`) with 13 passing unit tests (`npm test`). Mileage is
  calculated from pickup/destination addresses via Google's Distance Matrix
  API (`src/lib/distance/`) — requires `GOOGLE_MAPS_API_KEY` (see
  `.env.example`); without it, the estimator clearly says so and offers a
  manual mile-entry fallback rather than guessing or using straight-line
  distance.
- Homepage hero now uses an AI-generated image Joe supplied directly
  (2026-10-09) showing a driver in an Allegiance polo and a branded van —
  not a real photo. See `public/images/stock/CREDITS.md`. Real Allegiance
  photography should replace it when available.
- Ride request workflow (`/request-ride`): validated form → Server Action →
  local JSONL storage, with the required "not confirmed until Allegiance
  contacts you" acknowledgment.
- SEO: per-page metadata, sitemap.xml, robots.txt, LocalBusiness JSON-LD on
  the homepage.

**Not started**: real payment processing, MediRoutes integration.

See "Facility Portal" below for the separate /portal build (Phase A/B of its
own master brief).

## Decisions Joe has made

- Ambulatory one-way: 5 miles included, then $2.50/mi (resolves the
  conflicting rate-sheet language) — confirmed 2026-10-09.
- Dark-background logo: generated as a straight black→white color swap of
  the same vector paths (no reversed logo file was supplied).
- Build location: new project folder here, not touching the live WordPress
  site. Local build only — nothing has been deployed.
- Pacing: proceed through all phases using clearly-flagged placeholder/
  configurable values anywhere a real number or integration wasn't supplied,
  rather than stopping at each gap.

## Still unresolved — needs Joe's input before this is production-ready

All of these are implemented as configurable defaults in
[`src/lib/pricing/rates.ts`](src/lib/pricing/rates.ts) with inline comments
marking them UNCONFIRMED, not silently treated as final:
- Wheelchair / round-trip included-mileage threshold (currently defaults to 0).
- Surcharge stacking rule — additive vs. highest-only (currently additive).
- Waiting-time rounding — whether each started 40-min interval bills in full
  (currently assumed yes).
- Companion hourly rate and minimum duration (not supplied — estimator shows
  "pending confirmation" rather than a invented number).
- Holiday calendar (empty list — admin-configurable).

Also outstanding:
- Payment provider selection (Stripe or similar) — nothing wired up yet.
- A real `GOOGLE_MAPS_API_KEY` — Joe needs to create the Google Cloud
  project/billing and enable the Distance Matrix API himself (account
  creation isn't something this session can do); until then `/estimate`
  falls back to manual mile entry.
- MediRoutes integration approach — no confirmed public API; current ride
  requests just land in local storage for manual dispatcher review.
- Dispatcher notification channel — submissions are currently only written
  to local `data/*.jsonl` files (gitignored) and logged to the server
  console. No email/SMS/CRM notification is wired up yet.
- Whether HIPAA / a business associate agreement applies to any of this
  (portal, companion scheduling notes) — flagged in `/privacy`, not decided.
- Privacy Policy and Terms of Service pages are explicitly marked as drafts
  needing legal review before publishing.
- Real photography (current hero/sections use labeled placeholders).

## Key files

- `src/lib/pricing/rates.ts` — single source of truth for rates; edit here
  once Joe confirms the unresolved items above.
- `src/lib/pricing/calculate.ts` + `calculate.test.ts` — pricing engine and
  its tests (`npm test`).
- `src/lib/forms/` — form schemas (zod), Server Actions, and placeholder
  local storage.
- `.claude/launch.json` (repo root) — dev server config, name
  `allegiance-website-rebuild`, runs on port 3101.

---

# Facility Portal (/portal)

A separate master brief (2026-10-09) asked for a full multi-tenant facility
transportation portal + internal dispatch dashboard, with MediRoutes
remaining the operational dispatch system. That brief's own instructions:
build Phase A (schema, auth, permissions) and Phase B (facility dashboard,
ride request wizard, ride history/detail) first, with fictional demo data,
and stop there. That's what's built so far.

## Status (as of 2026-10-09)

**Phase A — done:**
- Full Prisma schema (`prisma/schema.prisma`) covering every model the
  brief asked for (Organization, Facility, User, FacilityMembership,
  Patient, RideRequest, RideLeg, RecurringSchedule, CompanionRequest,
  DispatchAssignment, RequestStatusEvent, RideMessage, FacilityRatePlan,
  Invoice, AuditEvent, NotificationEvent), including tables for phases not
  built yet so the schema won't need reshaping later.
- Auth: Auth.js v5, email+password (bcrypt), JWT sessions. Edge-safe split
  (`src/auth.config.ts` vs `src/auth.ts`) so `src/proxy.ts` (Next 16 renamed
  "middleware" to "proxy") never imports Prisma into the Edge runtime.
- Centralized authorization (`src/lib/portal/permissions.ts`) —
  `requireFacilitySession()` / `requireFacilityAccess(facilityId)` re-verify
  membership server-side on every page AND every Server Action. The
  `src/proxy.ts` redirect is a convenience only, not the security boundary.
- Six-role model: `FACILITY_ADMIN` / `FACILITY_SCHEDULER` / `FACILITY_VIEWER`
  on `FacilityMembership` (facility-scoped); `SUPER_ADMIN` / `DISPATCHER` /
  `BILLING` on `User.internalRole` (not facility-scoped — see schema
  comments for why this splits from the brief's single-table suggestion).

**Phase B — done, facility side only:**
- `/portal/login`, `/portal/dashboard`, `/portal/rides`, `/portal/rides/new`
  (4-step wizard: Patient → Transportation → Additional Services → Review),
  `/portal/rides/[id]`.
- Ride creation is transactional, generates an atomic request number
  (`ATS-000101…`, `src/lib/portal/requestNumber.ts`), writes an initial
  `RequestStatusEvent` and `AuditEvent`, and is idempotent via a
  per-submission UUID (`submissionKey`, unique constraint) so a double
  click/retry can't create a duplicate request.
- Multi-facility support: users with >1 active membership get a facility
  switcher (cookie-backed, `src/lib/portal/activeFacility*.ts`); every data
  query is scoped to the resolved facility and re-checked against the
  user's actual memberships.
- Demo data: `prisma/seed.ts` — two fictional facilities, two fictional
  facility users, three fictional patients, and the five demo ride
  scenarios the brief asked for (discharge, confirmed wheelchair trip,
  transitional care, companion-supported infusion appointment, recurring
  dialysis schedule). Every name is prefixed `[DEMO]`. Nothing here is a
  real patient record.
- Tests: `src/lib/portal/schema.test.ts` (10 tests, pure validation logic,
  no DB needed). DB-dependent tests (auth, facility isolation, duplicate
  submission, concurrent updates — the rest of brief section 20) are not
  written yet; they need the live dev database wired up first (see below).

**Not built yet (by design — later phases per the brief's own sequencing):**
Phase C (dispatch dashboard, MediRoutes reconciliation), Phase D (recurring
schedule UI, transitional care's own UI beyond the wizard's companion step,
secure messaging UI — `RideMessage`/`RecurringSchedule` tables exist, no
pages), Phase E (facility account/team management UI, billing UI — tables
exist, no pages), Phase F (full test suite, security review, deployment
prep). Nav links for these are visible but grayed out ("Coming soon") in
the portal header so the IA matches the full brief without implying
anything is live that isn't.

## Decisions made this session (all flagged to Joe as they were made)

- **Database**: local PostgreSQL 16 (already installed on this machine),
  dedicated low-privilege role/database — not a shared or superuser
  connection. Production should move to a real hosted Postgres (Neon,
  Supabase, RDS, etc.) that Joe sets up himself.
- **Auth**: self-hosted Auth.js (email+password, JWT) for now, not a
  managed MFA provider — account creation with Clerk/Auth0/WorkOS is Joe's
  to do, not something this session can do on his behalf. The code is
  structured (`auth.config.ts` / `auth.ts` split, `authorize()` as the only
  place credentials are checked) so swapping providers later is a
  config/provider change, not a rewrite.
- **MFA**: not implemented. `User.mfaEnabled` exists as a placeholder field
  only. Real TOTP enrollment/verification is deferred to whichever managed
  provider Joe picks for production — hand-rolling MFA for a HIPAA-adjacent
  app isn't a good use of this phase.
- **Scope**: Phase A + B only this round (Joe's explicit choice over also
  building a basic dispatch dashboard), matching the brief's own "implement
  PHASE A and PHASE B first" instruction.

## Local setup

1. Create a dedicated Postgres role + database (don't reuse the postgres
   superuser):
   ```
   psql -U postgres -h localhost -c "CREATE ROLE allegiance_portal WITH LOGIN PASSWORD 'your-password';"
   psql -U postgres -h localhost -c "CREATE DATABASE allegiance_portal_dev OWNER allegiance_portal;"
   ```
2. Copy `.env.example` to `.env.local`, fill in `DATABASE_URL` with that
   role/database, and set `AUTH_SECRET` (`npx auth secret` generates one).
3. `npm run db:push` — applies the Prisma schema to the database (no
   migration history yet; fine for this stage, switch to
   `prisma migrate dev` once the schema stabilizes).
4. `npm run db:seed` — loads the fictional demo data. Prints the two demo
   login credentials to the console when it finishes.
5. `npm run dev`, then sign in at `/portal/login`.

## Security checklist — status, not a guarantee

- [x] Server-side auth (Auth.js, Node runtime only for the Credentials
      provider)
- [x] Server-side, re-verified-per-request authorization
      (`requireFacilityAccess`) — never trusts a client-supplied facilityId
- [x] Tenant/facility scoping enforced in every portal query shown so far
- [x] Passwords hashed (bcrypt), never logged
- [x] Idempotent ride creation (unique `submissionKey`)
- [x] Immutable status-event history + audit events on ride creation
- [x] Minimal patient data model (no diagnosis/treatment fields in `Patient`)
- [ ] MFA — deferred to a managed provider (see Decisions above)
- [ ] CSRF — relying on Next.js Server Actions' built-in origin check;
      not independently verified
- [ ] Rate limiting / brute-force protection on login — not implemented
- [ ] Session expiration / idle timeout policy — using Auth.js defaults,
      not explicitly configured
- [ ] Encryption at rest — depends on the production Postgres host's
      configuration, not something this app layer controls
- [ ] Backup/recovery procedure — not defined (depends on production host)
- [ ] HIPAA assessment / BAA review — explicitly not done; do not put real
      patient data in this environment until that's resolved
- [ ] Negative authorization tests (brief section 20) — not written yet,
      blocked on the live dev database

## Key files

- `prisma/schema.prisma` — data model, with inline comments on every
  deliberate deviation from the brief's literal field list.
- `src/lib/portal/permissions.ts` — the authorization boundary; read this
  before adding any new portal page or action.
- `src/lib/portal/actions.ts` — ride creation (transactional, idempotent).
- `src/lib/portal/schema.ts` — Zod validation for the ride wizard.
- `prisma/seed.ts` — fictional demo data (facilities, users, patients,
  rides). Safe to re-run; uses `upsert` where it matters.

## Expected AI role going forward

**Marketing site**: continue through the remaining phases (payment
integration scaffolding, MediRoutes integration doc/approach) once Joe
confirms the open pricing questions above. Update `rates.ts` directly
instead of guessing when real numbers are supplied.

**Facility portal**: once the local database is wired up and verified
(`npm run db:push && npm run db:seed`, sign in with the demo credentials),
run the DB-dependent tests that are still missing (auth, facility
isolation, duplicate submission, concurrent updates) before calling Phase
B done. Don't start Phase C (dispatch dashboard) or later phases without
checking in first — they were explicitly deferred this round.

**Both**: do not deploy over the live WordPress site, and do not process
real patient data anywhere in this project, without explicit approval.
