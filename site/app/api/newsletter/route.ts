import { NextResponse } from "next/server";
import { db, dbConfigured } from "@/lib/supabase";
import { syncContact } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function fail(message: string, status: number) {
  return NextResponse.json({ ok: false, message }, { status });
}

/** Newsletter-only sign-up: records the person as opted in. No workbook is sent. */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request.", 400);
  }
  if (typeof body.website === "string" && body.website.trim() !== "") return NextResponse.json({ ok: true });

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 320) return fail("Please enter a valid email address.", 400);
  if (!dbConfigured) return fail("Sign-up is not switched on yet. Please try again later.", 503);

  const supabase = db();
  const { data: existing, error: sErr } = await supabase.from("tc_subscribers").select("id, name, newsletter").eq("email", email).maybeSingle();
  if (sErr) return fail("Something went wrong. Please try again.", 500);

  if (existing) {
    if (!existing.newsletter) {
      const { error } = await supabase.from("tc_subscribers").update({ newsletter: true }).eq("id", existing.id);
      if (error) return fail("Something went wrong. Please try again.", 500);
    }
  } else {
    const { error } = await supabase.from("tc_subscribers").insert({ email, newsletter: true });
    if (error) return fail("Something went wrong. Please try again.", 500);
  }

  await syncContact(email, existing?.name ?? null, true);
  return NextResponse.json({ ok: true });
}
