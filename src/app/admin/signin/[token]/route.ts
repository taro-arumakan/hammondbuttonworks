import { NextRequest, NextResponse } from "next/server";
import { verifyStaffToken } from "@/lib/session";
import { startStaffSession } from "@/lib/auth";
import { isStaffEmail } from "@/lib/staff";

/**
 * Staff magic-link landing. Re-checks the allowlist at click time, so removing
 * someone from STAFF_EMAILS invalidates links already in their inbox.
 * `next` is constrained to an /admin path so this can't be an open redirect.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const { token } = await params;
  const payload = await verifyStaffToken(token, "staff-magic");

  if (!payload || !isStaffEmail(payload.sub)) {
    return NextResponse.redirect(new URL("/admin/login?status=invalid", req.url));
  }

  await startStaffSession(payload.sub);

  const next = req.nextUrl.searchParams.get("next") ?? "/admin";
  const safe = next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
  return NextResponse.redirect(new URL(safe, req.url));
}
