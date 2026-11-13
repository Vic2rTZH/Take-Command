import "server-only";
import { Resend } from "resend";
import { SITE_NAME, SITE_URL, TAGLINE } from "./site";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM;

export const emailConfigured = Boolean(apiKey && from);

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

type Delivery = { to: string; name: string | null; title: string; kind: string; downloadUrl: string; newsletter: boolean };

export async function sendResourceEmail(d: Delivery): Promise<{ ok: boolean; error?: string }> {
  if (!apiKey || !from) return { ok: false, error: "Email is not configured" };
  const resend = new Resend(apiKey);
  const first = d.name?.trim().split(/\s+/)[0];
  const greeting = first ? `Hello ${escapeHtml(first)},` : "Hello,";
  const title = escapeHtml(d.title);
  const html = `<!doctype html><html><body style="margin:0;background:#f3f5f8;font-family:Arial,Helvetica,sans-serif;color:#0b1320">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f8;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden">
<tr><td style="background:#0b1320;padding:22px 28px;border-bottom:4px solid #ea9a23"><span style="color:#ea9a23;font-size:12px;font-weight:bold;letter-spacing:3px">TAKE COMMAND</span></td></tr>
<tr><td style="padding:28px">
<p style="margin:0 0 14px;font-size:16px;line-height:1.6">${greeting}</p>
<p style="margin:0 0 20px;font-size:16px;line-height:1.6">Here is your copy of <strong>${title}</strong>.</p>
<p style="margin:0 0 24px"><a href="${d.downloadUrl}" style="display:inline-block;background:#ea9a23;color:#0b1320;font-weight:bold;font-size:15px;text-decoration:none;padding:14px 26px;border-radius:6px">Download the ${escapeHtml(d.kind.toLowerCase())}</a></p>
<p style="margin:0 0 14px;font-size:16px;line-height:1.6">Take Command is about thinking clearly, leading well and living with intention. Print the ${escapeHtml(d.kind.toLowerCase())}, set aside quiet time and answer honestly.</p>
<p style="margin:0 0 14px;font-size:16px;line-height:1.6">If it raises a question, reply to this email. I read every reply.</p>
<p style="margin:0;font-size:16px;line-height:1.6">Victor Simz</p>
</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid #e1e5eb;font-size:12px;line-height:1.5;color:#4a5362">${escapeHtml(TAGLINE)}<br>You received this because you asked for this resource at <a href="${SITE_URL}" style="color:#4a5362">${SITE_URL.replace(/^https?:\/\//, "")}</a>.${d.newsletter ? " You also chose to receive the Take Command newsletter; every issue has an unsubscribe link." : ""}</td></tr>
</table></td></tr></table></body></html>`;
  const text = `${first ? `Hello ${first},` : "Hello,"}\n\nHere is your copy of ${d.title}:\n${d.downloadUrl}\n\nIf it raises a question, reply to this email.\n\nVictor Simz\n${TAGLINE}`;

  const { error } = await resend.emails.send({
    from,
    to: d.to,
    subject: `Your copy of ${d.title}`,
    html,
    text,
    replyTo: process.env.EMAIL_REPLY_TO || undefined,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Adds the person to Resend contacts so newsletters can be sent as Broadcasts. Failures are non-fatal. */
export async function syncContact(email: string, name: string | null, newsletter: boolean): Promise<void> {
  if (!apiKey) return;
  try {
    const resend = new Resend(apiKey);
    const [firstName, ...rest] = (name || "").trim().split(/\s+/);
    const { error } = await resend.contacts.create({
      email,
      firstName: firstName || undefined,
      lastName: rest.join(" ") || undefined,
      unsubscribed: !newsletter,
    });
    if (error) console.warn("Resend contact not created:", error.message);
  } catch (e) {
    console.warn("Resend contact sync failed", e);
  }
}

export { SITE_NAME };
