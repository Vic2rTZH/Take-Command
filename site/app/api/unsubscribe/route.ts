import { NextResponse } from "next/server";
import { db, dbConfigured } from "@/lib/supabase";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** One-click unsubscribe from email clients (RFC 8058). */
export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("t") || "";
  if (dbConfigured && UUID_RE.test(token)) await db().from("tc_subscribers").update({ newsletter: false }).eq("unsub_token", token);
  return new NextResponse(null, { status: 204 });
}
