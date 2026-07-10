/**
 * Staff allowlist for the admin toolset. Kept free of `next/headers` and
 * `server-only` so the Edge middleware can gate `/admin` with it.
 *
 * STAFF_EMAILS accepts a comma-separated mix of exact addresses and whole
 * domains, e.g.:  "taro@sniarti.fi, @alvana.jp"
 * Unset ⇒ nobody is staff (the admin surface is effectively disabled).
 */

export const STAFF_COOKIE = "hbw_staff";

function entries(): string[] {
  return (process.env.STAFF_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isStaffEmail(email: string | null | undefined): boolean {
  const norm = email?.trim().toLowerCase();
  if (!norm || !norm.includes("@")) return false;
  const domain = norm.slice(norm.indexOf("@")); // "@alvana.jp"
  return entries().some((e) => (e.startsWith("@") ? e === domain : e === norm));
}

/** The host that serves the admin surface, e.g. "admin.hammondbutton.works".
 *  Unset (local dev) ⇒ admin is reachable on any host. */
export function adminHost(): string | undefined {
  return process.env.ADMIN_HOST?.trim() || undefined;
}
