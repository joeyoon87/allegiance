export function newId(): string {
  return crypto.randomUUID();
}

export async function nextPublicRequestNumber(db: D1Database): Promise<string> {
  const row = await db
    .prepare(`UPDATE request_number_counter SET value = value + 1 WHERE id = 1 RETURNING value`)
    .first<{ value: number }>();
  const value = row?.value ?? 100;
  return `ATS-${String(value).padStart(6, "0")}`;
}
