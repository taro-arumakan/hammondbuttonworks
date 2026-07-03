import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, createToken, verifyToken } from "./session";
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
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
