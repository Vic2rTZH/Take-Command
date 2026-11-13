import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { db, dbConfigured } from "@/lib/supabase";

const BOT_RE = /bot|crawl|spider|slurp|preview|monitor|headless|lighthouse|facebookexternalhit|whatsapp/i;

export async function POST(request: Request) {
  if (!dbConfigured) return new NextResponse(null, { status: 204 });
  try {
    const body = await request.json();
    const path = String(body.path ?? "").slice(0, 200);
    if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api")) return new NextResponse(null, { status: 204 });

    const ua = request.headers.get("user-agent") || "";
    if (!ua || BOT_RE.test(ua)) return new NextResponse(null, { status: 204 });

    const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
    const day = new Date().toISOString().slice(0, 10);
    // Salted and rotated daily: counts unique visitors per day without storing IP addresses or cookies.
    const visitor = createHash("sha256")
      .update(`${day}|${ip}|${ua}|${process.env.ANALYTICS_SALT || "take-command"}`)
      .digest("hex")
      .slice(0, 32);

    let referrerHost: string | null = null;
    try {
      const ref = String(body.referrer ?? "");
      if (ref) {
        const host = new URL(ref).hostname.replace(/^www\./, "");
        const own = new URL(request.url).hostname.replace(/^www\./, "");
        if (host && host !== own) referrerHost = host.slice(0, 120);
      }
    } catch {
      referrerHost = null;
    }

    const slug = body.slug ? String(body.slug).slice(0, 120) : null;
    await db().from("tc_page_views").insert({ path, resource_slug: slug, referrer_host: referrerHost, visitor_hash: visitor });
  } catch (e) {
    console.warn("track failed", e);
  }
  return new NextResponse(null, { status: 204 });
}
