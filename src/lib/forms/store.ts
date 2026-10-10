import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";

/**
 * PLACEHOLDER persistence only. Appends submissions to local JSON-lines files
 * under /data so the site is functionally testable end-to-end before a real
 * destination (dispatcher inbox, CRM, MediRoutes review queue) is wired up.
 *
 * Do not treat this as production storage: it is unencrypted, has no access
 * control, and must not receive protected health information until a
 * compliant backend (and any required HIPAA assessment) is in place.
 */
const DATA_DIR = path.join(process.cwd(), "data", "submissions");

export async function recordSubmission(kind: string, payload: Record<string, unknown>) {
  await mkdir(DATA_DIR, { recursive: true });
  const record = { ...payload, _receivedAt: new Date().toISOString() };
  await appendFile(path.join(DATA_DIR, `${kind}.jsonl`), JSON.stringify(record) + "\n", "utf8");

  // Dispatcher notification is not yet wired to a real channel (email/SMS/CRM).
  // Logging here stands in for that until Phase 9/12 integration is approved.
  console.log(`[submission:${kind}]`, record);
}
