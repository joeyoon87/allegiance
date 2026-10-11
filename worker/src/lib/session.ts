/**
 * Minimal signed session tokens (HMAC-SHA256), not a JWT library — we only
 * need "issued to this userId, expires at this time, tamper-evident."
 * Format: base64url(payloadJSON) + "." + base64url(signature)
 */

export type SessionPayload = {
  userId: string;
  exp: number; // unix seconds
};

function toBase64Url(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(b64url.length / 4) * 4, "=");
  const str = atob(b64);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function createSessionToken(userId: string, secret: string): Promise<string> {
  const payload: SessionPayload = { userId, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const key = await hmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, payloadBytes);
  return `${toBase64Url(payloadBytes)}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token: string, secret: string): Promise<SessionPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, sigB64] = parts;
  const payloadBytes = fromBase64Url(payloadB64);
  const signatureBytes = fromBase64Url(sigB64);

  const key = await hmacKey(secret);
  const valid = await crypto.subtle.verify("HMAC", key, signatureBytes as BufferSource, payloadBytes as BufferSource);
  if (!valid) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
