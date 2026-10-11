# Allegiance Facility Portal — Worker Backend

Separate deployable unit from the static site one directory up — see that
project's [CLAUDE.md](../CLAUDE.md) for the overall architecture and why
this is split out. This directory is a Cloudflare Worker (Hono) + D1.

## Architecture

MediRoutes is the sole system of record for transportation operations
(trips, riders, statuses) per the brief — this Worker never builds a
competing database of that data. D1 ([schema.sql](schema.sql)) holds only:

- `facilities`, `users`, `facility_memberships` — portal accounts/permissions.
- `ride_reconciliation` — links a portal submission to its MediRoutes trip
  guid (idempotency key, sync status/error). Not a ride history store —
  ride lists/detail always read live from MediRoutes
  ([src/mediroutes/client.ts](src/mediroutes/client.ts)).
- `audit_events`, `marketing_submissions` — logging and public-site form
  inbox, unrelated to the MediRoutes concern.
- `mock_mediroutes_*` — MOCK-ONLY, stands in for MediRoutes until real
  credentials exist (see below). Drop these once real credentials are set.

## Local setup

```bash
npm install
cp .env.example .dev.vars   # fill in SESSION_SECRET at minimum
npm run db:local:init       # applies schema.sql to a local D1 file
npm run db:local:seed       # loads fictional demo data (facilities/users)
npm run dev                 # wrangler dev, http://localhost:8787
```

Demo logins (password `DemoPass123!` for both):
`admin@forsythsnf.demo`, `scheduler@piedmonttriadmc.demo`.

Point the static site at this: in the project root's `.env.local`, set
`NEXT_PUBLIC_API_BASE_URL=http://localhost:8787`, then `npm run build`
there.

## Deploying for real (one-time setup)

```bash
npx wrangler login                              # your own Cloudflare auth
npx wrangler d1 create allegiance_portal        # note the database_id it prints
# paste that database_id into wrangler.jsonc's d1_databases[0].database_id
npm run db:remote:init                          # applies schema.sql to the real DB
npx wrangler secret put SESSION_SECRET          # paste a random 32+ byte value
npm run deploy                                  # deploys the Worker, prints its URL
```

Then in the root project's `.env.local`, set `NEXT_PUBLIC_API_BASE_URL` to
that deployed Worker URL, rebuild (`npm run build` in the root), and
re-upload `out/` to Cloudflare Pages (see ../CLAUDE.md Part A).

Also update `wrangler.jsonc`'s `ALLOWED_ORIGINS` to the real Pages domain
(comma-separated if you need more than one, e.g. a preview + production
URL) before deploying, or the browser's CORS check will reject the live
site's requests.

## MediRoutes credentials (optional — mock mode without them)

```bash
npx wrangler secret put MEDIROUTES_API_BASE_URL
npx wrangler secret put MEDIROUTES_CLIENT_ID
npx wrangler secret put MEDIROUTES_CLIENT_SECRET
```

All three must be set together — the client factory
([src/mediroutes/client.ts](src/mediroutes/client.ts)) falls back to mock
mode unless all three are present. See the root CLAUDE.md "MediRoutes
integration" for what's confirmed vs. still unverified about the real API,
and [src/mediroutes/real-client.ts](src/mediroutes/real-client.ts) for
exactly which endpoints are used (every method is commented CONFIRMED or
VERIFY — the latter means tested against docs only, not live credentials).

Once real credentials are in place: for each facility, confirm its
`mediroutes_funding_source_id` (see root CLAUDE.md "facility
identification problem" — this needs Joe/MediRoutes, not something to
guess) and set it:

```bash
npx wrangler d1 execute allegiance_portal --remote --command \
  "UPDATE facilities SET mediroutes_funding_source_id = <real id> WHERE id = '<facility id>'"
```

Then the `mock_mediroutes_*` tables and `mock-client.ts` are no longer
used and can be dropped.

## Admin tasks (no admin UI yet)

Creating a facility or user account today means a direct D1 write. Example
— create a facility, a user, and a membership:

```bash
npx wrangler d1 execute allegiance_portal --remote --command \
  "INSERT INTO facilities (id, name, facility_type, address_line1, city, state, zip, phone, billing_email, account_status) \
   VALUES ('<uuid>', 'Facility Name', 'HOSPITAL', '123 Main St', 'City', 'NC', '27101', '336-555-0100', 'billing@example.com', 'ACTIVE')"
```

Password hashes must be PBKDF2 in the exact format
`src/lib/password.ts` produces (`pbkdf2$210000$<saltHex>$<hashHex>`) — generate
one with Node:

```bash
node -e "
const { webcrypto: crypto } = require('node:crypto');
const toHex = b => Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');
(async () => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode('the-password'), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({name:'PBKDF2', salt, iterations:210000, hash:'SHA-256'}, key, 256);
  console.log(\`pbkdf2\$210000\$\${toHex(salt.buffer)}\$\${toHex(bits)}\`);
})();
"
```

A real admin UI for this (brief section 3.G, "Allegiance Administrator"
role) is not built yet — see root CLAUDE.md "Not built this phase".

## Verifying things are working

- `GET /` on the deployed Worker URL → `{"service":"allegiance-portal-api","status":"ok"}`.
- A facility's dashboard "Needs Attention" count reflects
  `ride_reconciliation` rows with `sync_status = 'FAILED'` — the quickest
  signal that MediRoutes submissions are failing.
- `npx tsc --noEmit` for a type check; there's no Worker-specific test
  suite yet (see root CLAUDE.md "Known limitations").
