import { NextRequest, NextResponse } from "next/server";
import { endStaffSession } from "@/lib/auth";

export async function POST(req: NextRequest): Promise<NextResponse> {
  await endStaffSession();
  return NextResponse.redirect(new URL("/admin/login", req.url), { status: 303 });
}
