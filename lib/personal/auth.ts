import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const AUTH_COOKIE = "personal_auth";

function expectedToken(): string | null {
  const pw = process.env.PERSONAL_PASSWORD;
  if (!pw) return null;
  return createHmac("sha256", pw).update("personal-auth-v1").digest("hex");
}

export function checkPassword(input: string): boolean {
  const pw = process.env.PERSONAL_PASSWORD;
  if (!pw) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(pw);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function sessionToken(): string {
  const t = expectedToken();
  if (!t) throw new Error("PERSONAL_PASSWORD not configured");
  return t;
}

export async function isAuthed(): Promise<boolean> {
  const expected = expectedToken();
  if (!expected) return false;
  const jar = await cookies();
  const got = jar.get(AUTH_COOKIE)?.value;
  if (!got || got.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}
