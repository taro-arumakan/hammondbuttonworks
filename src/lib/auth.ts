import "server-only";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  createToken,
  verifyToken,
  createStaffToken,
  verifyStaffToken,
} from "./session";
import { STAFF_COOKIE, isStaffEmail } from "./staff";
import { HINT_COOKIE, encodeHint } from "./hint-cookie";
import type { Account } from "./allowlist";
import type { CustomerClass } from "./customer";

/**
 * Session cookie helpers for Node-side code (server components, route handlers,
 * server actions). The Edge middleware reads the cookie via `session.ts`.
 */

export type Session = {
  user: {
    email: string;
    customerClass: CustomerClass;
    companyName: string;
  };
};

export async function auth(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const payload = await verifyToken(token, "session");
  if (!payload) return null;
  return {
    user: {
      email: payload.sub,
      customerClass: payload.customerClass,
      companyName: payload.company,
    },
  };
}

export async function currentClass(): Promise<CustomerClass | null> {
  return (await auth())?.user.customerClass ?? null;
}

export async function startSession(account: Account): Promise<void> {
  const token = await createToken("session", {
    email: account.email,
    customerClass: account.customerClass,
    company: account.company,
  });
  const jar = await cookies();
  const maxAge = 30 * 24 * 60 * 60;
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
  // Display hint for client JS on statically-served pages (header, price
  // tiles). Deliberately NOT httpOnly — and deliberately WITHOUT the customer
  // class; see hint-cookie.ts. Lifecycle is welded to the session cookie.
  jar.set(HINT_COOKIE, encodeHint({ email: account.email, company: account.company }), {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(HINT_COOKIE);
}

// --- Staff sessions (admin toolset) ---------------------------------------------

export type StaffSession = { email: string };

/** The signed-in staff member, or null. Re-checks the allowlist on every call,
 *  so removing someone from STAFF_EMAILS revokes them immediately. */
export async function staffSession(): Promise<StaffSession | null> {
  const token = (await cookies()).get(STAFF_COOKIE)?.value;
  const payload = await verifyStaffToken(token, "staff");
  if (!payload || !isStaffEmail(payload.sub)) return null;
  return { email: payload.sub };
}

export async function startStaffSession(email: string): Promise<void> {
  const token = await createStaffToken("staff", email);
  (await cookies()).set(STAFF_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 12 * 60 * 60,
  });
}

export async function endStaffSession(): Promise<void> {
  (await cookies()).delete(STAFF_COOKIE);
}
