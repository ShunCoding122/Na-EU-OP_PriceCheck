import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "op-pricecheck-session";

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not configured.");
  return value;
}

function signature(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function valid(value?: string) {
  if (!value) return false;
  const [expires, supplied] = value.split(".");
  if (!expires || !supplied || Number(expires) < Date.now()) return false;
  const expected = signature(expires);
  if (expected.length !== supplied.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}

export async function isSignedIn() {
  return valid((await cookies()).get(COOKIE)?.value);
}

export function sessionValue() {
  const expires = String(Date.now() + 1000 * 60 * 60 * 24 * 30);
  return `${expires}.${signature(expires)}`;
}

export const sessionCookie = COOKIE;
