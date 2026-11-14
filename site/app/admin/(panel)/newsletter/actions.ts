"use server";

import { redirect } from "next/navigation";
import { Resend } from "resend";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { draftBrief, type BriefDraft } from "@/lib/ai";
import { BRIEF_COLUMNS, briefProblems, oneClickUrl, renderBrief, unsubscribeUrl, type Brief } from "@/lib/brief";
import { SITE_URL } from "@/lib/site";

function fields(formData: FormData) {
  const get = (k: string) => String(formData.get(k) || "").trim();
  return {
    subject: get("subject").slice(0, 150),
    bluf: get("bluf").slice(0, 600),
    ideas: [get("idea1"), get("idea2"), get("idea3")].map((x) => x.slice(0, 800)),
    questions: [get("q1"), get("q2")].map((x) => x.slice(0, 400)),
    action: get("action").slice(0, 600),
  };
}

export async function createIssue() {
  await requireAdmin();
  const supabase = db();
  const { data: last } = await supabase.from("tc_newsletters").select("issue_no").order("issue_no", { ascending: false, nullsFirst: false }).limit(1).maybeSingle();
  const issue_no = (last?.issue_no ?? 0) + 1;
  const { data, error } = await supabase.from("tc_newsletters").insert({ issue_no, ideas: ["", "", ""], questions: ["", ""] }).select("id").single();
  if (error || !data) redirect(`/admin/newsletter?error=${encodeURIComponent(error?.message || "Could not create the issue.")}`);
  redirect(`/admin/newsletter/${data.id}`);
}

async function loadDraft(id: string): Promise<Brief> {
  const { data } = await db().from("tc_newsletters").select(BRIEF_COLUMNS).eq("id", id).maybeSingle();
  if (!data) redirect("/admin/newsletter");
  const b = data as Brief;
  if (b.status !== "draft") redirect(`/admin/newsletter/${id}`);
  return b;
}

export async function saveIssue(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  await loadDraft(id);
  const { error } = await db().from("tc_newsletters").update({ ...fields(formData), updated_at: new Date().toISOString() }).eq("id", id).eq("status", "draft");
  if (error) redirect(`/admin/newsletter/${id}?error=${encodeURIComponent(error.message)}`);
  redirect(`/admin/newsletter/${id}?saved=1`);
}

export async function aiDraft(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  await loadDraft(id);
  const notes = String(formData.get("notes") || "").trim().slice(0, 4000);
  if (!notes) redirect(`/admin/newsletter/${id}?error=${encodeURIComponent("Write a topic or some notes for the AI first.")}`);
  const current: BriefDraft = fields(formData);
  // Keep any unsaved edits before drafting.
  await db().from("tc_newsletters").update({ ...current, updated_at: new Date().toISOString() }).eq("id", id).eq("status", "draft");
  const result = await draftBrief(notes, current);
  if (!result.ok) redirect(`/admin/newsletter/${id}?error=${encodeURIComponent(result.message)}`);
  await db().from("tc_newsletters").update({ ...result.draft, updated_at: new Date().toISOString() }).eq("id", id).eq("status", "draft");
  redirect(`/admin/newsletter/${id}?drafted=1`);
}

export async function sendTest(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") || "");
  await loadDraft(id);
  const f = fields(formData);
  await db().from("tc_newsletters").update({ ...f, updated_at: new Date().toISOString() }).eq("id", id).eq("status", "draft");
  const b = await loadDraft(id);
  const { html, text } = renderBrief(b, `${SITE_URL}/unsubscribe`);
  const from = process.env.EMAIL_FROM;
  if (!process.env.RESEND_API_KEY || !from) redirect(`/admin/newsletter/${id}?error=${encodeURIComponent("Email is not configured.")}`);
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: from!, to: admin, subject: `[Test] ${b.subject || "The Take Command Brief"}`, html, text });
  if (error) redirect(`/admin/newsletter/${id}?error=${encodeURIComponent(`Test email failed: ${error.message}`)}`);
  redirect(`/admin/newsletter/${id}?tested=1`);
}

export async function broadcastIssue(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const expected = Number(formData.get("expected") || 0);
  const back = (m: string): never => redirect(`/admin/newsletter/${id}?error=${encodeURIComponent(m)}`);
  if (formData.get("confirm") !== "on") back("Tick the box to confirm the send.");

  const b = await loadDraft(id);
  const problems = briefProblems(b);
  if (problems.length) back(`Save a complete issue first. ${problems.join(" ")}`);

  const from = process.env.EMAIL_FROM;
  const key = process.env.RESEND_API_KEY;
  if (!key || !from) back("Email is not configured.");

  const supabase = db();
  const { data: subs, error: sErr } = await supabase.from("tc_subscribers").select("email, unsub_token").eq("newsletter", true);
  if (sErr) back(sErr.message);
  const list = subs ?? [];
  if (list.length === 0) back("There are no newsletter subscribers yet.");
  if (list.length !== expected) back(`The subscriber count changed to ${list.length}. Check and confirm again.`);

  // Lock the issue so a double click cannot send it twice.
  const { data: locked } = await supabase.from("tc_newsletters").update({ status: "sending" }).eq("id", id).eq("status", "draft").select("id");
  if (!locked || locked.length === 0) redirect(`/admin/newsletter/${id}`);

  const resend = new Resend(key);
  let sent = 0;
  const failures: string[] = [];
  for (let i = 0; i < list.length; i += 100) {
    const chunk = list.slice(i, i + 100).map((s) => {
      const url = unsubscribeUrl(s.unsub_token);
      const { html, text } = renderBrief(b, url);
      return {
        from: from!,
        to: s.email,
        subject: b.subject,
        html,
        text,
        replyTo: process.env.EMAIL_REPLY_TO || undefined,
        headers: { "List-Unsubscribe": `<${oneClickUrl(s.unsub_token)}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      };
    });
    const { error } = await resend.batch.send(chunk);
    if (error) failures.push(error.message);
    else sent += chunk.length;
    if (i + 100 < list.length) await new Promise((r) => setTimeout(r, 600));
  }

  if (sent === 0) {
    await supabase.from("tc_newsletters").update({ status: "draft" }).eq("id", id);
    back(`Nothing was sent: ${failures[0] || "unknown error"}`);
  }
  await supabase.from("tc_newsletters").update({ status: "sent", recipients: sent, sent_at: new Date().toISOString() }).eq("id", id);
  redirect(`/admin/newsletter/${id}?sent=${sent}${failures.length ? `&failed=${list.length - sent}` : ""}`);
}

export async function deleteIssue(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  await db().from("tc_newsletters").delete().eq("id", id).eq("status", "draft");
  redirect("/admin/newsletter");
}
