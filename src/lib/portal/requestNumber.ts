import { prisma } from "@/lib/db";

/**
 * Atomically increments the shared counter row and returns a formatted
 * request number like "ATS-000101". Uses a single UPDATE ... RETURNING so
 * two concurrent submissions can't collide on the same number.
 */
export async function nextPublicRequestNumber(): Promise<string> {
  const rows = await prisma.$queryRaw<{ value: number }[]>`
    UPDATE "RequestNumberCounter" SET value = value + 1 WHERE id = 1 RETURNING value
  `;
  const value = rows[0]?.value ?? 100;
  return `ATS-${String(value).padStart(6, "0")}`;
}
