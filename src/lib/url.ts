import { headers } from "next/headers";
import { adminHost } from "@/lib/staff";

async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Absolute base URL (no trailing slash) for building links that live outside
 * the request lifecycle — magic-link and quote emails. Prefers the configured
 * NEXT_PUBLIC_SITE_URL; otherwise derives it from the incoming request host.
 *
 * This is the PUBLIC storefront origin. Customer sign-in links belong here even
 * when minted from the admin tool.
 */
export async function baseUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  return requestOrigin();
}

/**
 * Absolute base URL of the STAFF admin surface. `/admin/*` 404s on the public
 * host, so a staff magic link built from `baseUrl()` would be dead on arrival
 * whenever NEXT_PUBLIC_SITE_URL points at the storefront (i.e. in production).
 * With ADMIN_HOST unset (local dev) admin is reachable anywhere, so fall back
 * to the request origin rather than NEXT_PUBLIC_SITE_URL.
 */
export async function adminBaseUrl(): Promise<string> {
  const host = adminHost();
  return host ? `https://${host}` : requestOrigin();
}
