# Allegiance Website Rebuild

## Architecture (as of 2026-10-11 — Cloudflare-first rebuild)

Two independent pieces, per Joe's explicit instruction ("drag a folder into
Cloudflare to publish, like The AC Co. — no GitHub, no terminal for routine
updates"):

1. **Public website + facility portal frontend** — this directory. A
   Next.js app built with `output: "export"`, so `npm run build` produces
   a plain static folder (`out/`) of HTML/CSS/JS — no server. That's the
   folder Joe drags into Cloudflare Pages. All dynamic behavior (forms,
   the estimator's mileage lookup, portal login/data) is client-side JS
   calling the separate Worker API below.
2. **Facility Portal backend** — [`/worker`](worker/), a Cloudflare Worker
   + D1 database, deployed independently via Wrangler. See
   [worker/CLAUDE.md](worker/CLAUDE.md) for everything backend-specific
   (schema, MediRoutes integration, deploy steps).

**MediRoutes is the sole system of record for transportation operations**
(trips, riders, statuses) — the Worker never builds a competing database of
that data. D1 holds only portal metadata: facility accounts, user logins,
permissions, and a thin reconciliation link between a portal submission and
its MediRoutes trip. See worker/CLAUDE.md "Architecture" for the full
reasoning and the specific tables.

This replaces an earlier approach (same marketing content, but built as a
server-rendered Next.js app with Prisma/Postgres as its own ride database,
deployed via GitHub → Cloudflare Workers CI). That work is gone from this
codebase — static export and Server Actions/API routes/a database inside
this app are mutually exclusive. If you're wondering why there's no
`src/app/api/`, `prisma/`, or `middleware`/`proxy` file here anymore, that's
why.

## Deployment guide

### Part A — Publishing public website updates (routine, no terminal)

1. Ask Claude to make the change.
2. Claude edits the source and runs `npm run build` here, producing `out/`.
3. Claude hands you the `out/` folder.
4. Cloudflare dashboard → **Workers & Pages** → your Pages project → the
   deploy/upload screen → drag `out/` in.
5. Cloudflare publishes it — you'll see a new deployment appear with a
   live URL. Open it and spot-check the change.
6. **Rollback**: Cloudflare keeps every previous deployment. Pages project
   → **Deployments** tab → find the last good one → **Rollback to this
   deployment**. Instant, no rebuild needed.

The very first time: Cloudflare dashboard → Workers & Pages → Create →
**Upload assets** (not "Connect to Git") → name the project → drag `out/`
in. After that first upload, the project exists and every future update is
just step 4 above (drag a new folder into the same project).

### Part B — One-time facility portal setup

Entirely separate from the public site above. Needs a terminal once (or
have Claude run these) — see [worker/CLAUDE.md](worker/CLAUDE.md) for the
exact commands:

1. Create a Cloudflare D1 database (`wrangler d1 create`).
2. Apply the schema (`wrangler d1 execute ... --file=schema.sql --remote`).
3. Set secrets: `SESSION_SECRET`, and once available,
   `GOOGLE_MAPS_API_KEY` + the MediRoutes credentials
   (`wrangler secret put <NAME>`).
4. Deploy the Worker (`wrangler deploy`).
5. Set `NEXT_PUBLIC_API_BASE_URL` in this project's `.env.local` to the
   deployed Worker's URL, then rebuild and re-upload the public site
   (Part A) so it points at the live backend instead of localhost.
6. Add real facility/user rows (no signup flow exists yet — an admin
   creates accounts directly in D1; see worker/CLAUDE.md "Admin tasks").

### Part C — Future portal maintenance

- **Portal feature changes**: Claude edits `/worker/src`, then redeploys
  with `wrangler deploy` (one command, one approval from you each time —
  this does need a terminal, there's no drag-and-drop equivalent for a
  Worker).
- **Verify MediRoutes sync is working**: check a facility's dashboard
  "Needs Attention" count — it's sourced from `ride_reconciliation` rows
  with `sync_status = 'FAILED'`. Non-zero means submissions aren't
  reaching MediRoutes.
- **Investigate a failed submission**: `wrangler d1 execute
  allegiance_portal --remote --command "SELECT * FROM ride_reconciliation
  WHERE sync_status = 'FAILED' ORDER BY created_at DESC"` — the
  `sync_error` column has the actual error.
- **Backup**: `wrangler d1 export allegiance_portal --remote
  --output=backup.sql` — D1 also keeps automatic point-in-time recovery
  on Cloudflare's side.

## MediRoutes integration — confirmed vs. still open

Confirmed directly from `api.mediroutes.com/swagger/ui/index`: trip
creation, trip/status lookup, rider CRUD, the "Where's My Ride" tracking
URL endpoint, and trip-change webhooks. Full detail and exact endpoints
used are in [worker/src/mediroutes/real-client.ts](worker/src/mediroutes/real-client.ts)
(every method marked CONFIRMED or VERIFY).

**Still open, needs Joe:**
- Real API credentials (base URL, client ID/secret) — only obtainable from
  the MediRoutes account rep. Until set, the Worker runs in mock mode
  (clearly labeled fake data) and every feature is still fully testable.
- **The facility-identification problem**: MediRoutes' `FundingSource`
  object is a billing/payer entity, not explicitly "a physical facility."
  Whether each Allegiance facility maps to its own funding source, or
  several facilities share one, can't be determined from the API docs —
  only from how your MediRoutes account is actually configured. Until
  this is confirmed, each facility's `mediroutes_funding_source_id` in D1
  is `NULL` and its portal shows an honest empty state rather than
  guessing.
- Whether MediRoutes charges extra for API access.

## Marketing site — pricing & other open questions

All configurable in [`src/lib/pricing/rates.ts`](src/lib/pricing/rates.ts),
with inline comments marking anything not yet confirmed:
- Wheelchair / round-trip included-mileage threshold (defaults to 0).
- Surcharge stacking — additive vs. highest-only (defaults to additive).
- Waiting-time rounding (assumed: each started 40-min interval bills in full).
- Companion hourly rate (not supplied — estimator shows "pending
  confirmation" rather than inventing a number).
- Payment provider — nothing wired up yet.
- `GOOGLE_MAPS_API_KEY` — without it, `/estimate` falls back to manual
  mile entry rather than guessing or using straight-line distance.
- Privacy Policy and Terms of Service pages are explicitly marked as
  drafts needing legal review before publishing.
- Homepage hero image is AI-generated (Joe supplied it directly,
  2026-10-09) — see `public/images/stock/CREDITS.md`. Real Allegiance
  photography should replace it when available.

## Known limitations (security checklist)

- [x] Server-side auth, re-verified on every request (`requireAuth` +
      `requireFacilityMembership` in the Worker — never trusts a
      client-supplied facilityId)
- [x] Passwords hashed with PBKDF2 (Web Crypto, not bcrypt — see
      worker/src/lib/password.ts for why), constant-time comparison
- [x] Idempotent ride creation (unique `submission_key`), verified live
- [x] Facility data isolation, verified live (a user outside a facility
      gets 404, not 403 — doesn't confirm the facility exists)
- [x] No independent transportation database — MediRoutes is the source
      of truth for all ride/rider data
- [ ] MFA — not implemented. Deferred to a managed auth provider if/when
      this needs to go beyond a handful of trusted facility accounts.
- [ ] Rate limiting on login — not implemented.
- [ ] HIPAA assessment / BAA review — explicitly not done. Do not put
      real patient data anywhere in this system until that's resolved.
- [ ] Admin UI for managing facilities/users — doesn't exist yet; use
      `wrangler d1 execute` directly (see worker/CLAUDE.md).
- [ ] Full automated test suite (auth, facility isolation, concurrent
      updates as formal tests, not just the manual verification already
      done) — pricing engine and form-schema validation have real unit
      tests (`npm test`, 23 passing); the Worker doesn't have its own test
      suite yet.

## Not built this phase

Recurring schedules, transitional-care-specific UI beyond the ride
wizard's companion step, secure messaging, facility team/billing admin
screens, a signup/invite flow for new facility users. Nav links for these
exist in the portal header, grayed out ("Coming soon"), so the IA matches
the full brief without implying anything is live that isn't.

## Expected AI role going forward

Keep `src/lib/pricing/rates.ts` and the MediRoutes-open-questions list
above up to date as Joe confirms real numbers — edit directly, don't
guess. Don't deploy (drag into Cloudflare, or `wrangler deploy`) without
Joe's go-ahead each time, even though the mechanics are simple. Don't
process real patient data anywhere in this system until the HIPAA/BAA
question above is resolved.
