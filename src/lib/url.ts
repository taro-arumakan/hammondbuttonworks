import { headers } from "next/headers";

/**
 * Absolute base URL (no trailing slash) for building links that live outside
 * the request lifecycle — magic-link and quote emails. Prefers the configured
 * NEXT_PUBLIC_SITE_URL; otherwise derives it from the incoming request host.
 */
export async function baseUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
