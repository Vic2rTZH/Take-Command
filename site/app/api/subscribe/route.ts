import { NextResponse } from "next/server";
import { db, dbConfigured } from "@/lib/supabase";
import { emailConfigured, sendResourceEmail, syncContact } from "@/lib/email";
import { SITE_URL } from "@/lib/site";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function fail(message: string, status: number) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request.", 400);
  }

  // Honeypot: real people never fill this hidden field.
  if (typeof body.website === "string" && body.website.trim() !== "") return NextResponse.json({ ok: true });

  const email = String(body.email ?? "").trim().toLowerCase();
  const name = String(body.name ?? "").trim().slice(0, 120) || null;
  const slug = String(body.slug ?? "").trim();
  const newsletter = body.newsletter === true;

  if (!EMAIL_RE.test(email) || email.length > 320) return fail("Please enter a valid email address.", 400);
  if (!dbConfigured || !emailConfigured) return fail("Sign-up is not switched on yet. Please try again later.", 503);

  const supabase = db();
  const { data: resource, error: rErr } = await supabase
    .from("tc_resources")
    .select("id, title, kind, file_path, status")
    .eq("slug", slug)
    .maybeSingle();
  if (rErr) return fail("Something went wrong. Please try again.", 500);
  if (!resource || resource.status !== "published" || !resource.file_path) return fail("This resource is not available yet.", 404);

  const { data: existing, error: sErr } = await supabase
    .from("tc_subscribers")
    .select("id, name, newsletter")
    .eq("email", email)
    .maybeSingle();
  if (sErr) return fail("Something went wrong. Please try again.", 500);

  let subscriberId: string;
  if (existing) {
    subscriberId = existing.id;
    const patch: Record<string, unknown> = {};
    if (!existing.name && name) patch.name = name;
    if (newsletter && !existing.newsletter) patch.newsletter = true;
    if (Object.keys(patch).length) await supabase.from("tc_subscribers").update(patch).eq("id", subscriberId);
  } else {
    const { data: created, error: cErr } = await supabase
      .from("tc_subscribers")
      .insert({ email, name, newsletter })
      .select("id")
      .single();
    if (cErr || !created) return fail("Something went wrong. Please try again.", 500);
    subscriberId = created.id;
  }

  const { data: req, error: qErr } = await supabase
    .from("tc_requests")
    .insert({ resource_id: resource.id, subscriber_id: subscriberId })
    .select("token")
    .single();
  if (qErr || !req) return fail("Something went wrong. Please try again.", 500);

  const sent = await sendResourceEmail({
    to: email,
    name,
    title: resource.title,
    kind: resource.kind,
    downloadUrl: `${SITE_URL}/api/download/${req.token}`,
    newsletter,
  });
  if (!sent.ok) {
    console.error("Delivery email failed:", sent.error);
    return fail("We could not send the email. Please check the address and try again.", 502);
  }

  if (!existing || newsletter) await syncContact(email, name, newsletter || Boolean(existing?.newsletter));

  return NextResponse.json({ ok: true });
}
