import { NextRequest, NextResponse } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { json, sameOrigin } from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Request blocked." }, { status: 400 });

  const admin = await currentAdmin();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ exists: false });
  }

  try {
    const result = await sql()`select id from admin_users where email = ${email} limit 1`;
    return NextResponse.json({ exists: result.length > 0 });
  } catch (err) {
    return NextResponse.json({ error: "Database error." }, { status: 500 });
  }
}
