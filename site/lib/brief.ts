import "server-only";
import { SITE_URL, TAGLINE } from "./site";

export type Brief = {
  id: string;
  issue_no: number | null;
  subject: string;
  bluf: string;
  ideas: string[];
  questions: string[];
  action: string;
  status: "draft" | "sending" | "sent";
  recipients: number | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export const BRIEF_COLUMNS = "id, issue_no, subject, bluf, ideas, questions, action, status, recipients, sent_at, created_at, updated_at";

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Problems that must be fixed before an issue can be sent. */
export function briefProblems(b: Pick<Brief, "subject" | "bluf" | "ideas" | "questions" | "action">): string[] {
  const p: string[] = [];
  if (!b.subject.trim()) p.push("Add a subject line.");
  if (!b.bluf.trim()) p.push("Add the BLUF.");
  if (b.ideas.filter((x) => x.trim()).length !== 3) p.push("Fill in all three ideas.");
  if (b.questions.filter((x) => x.trim()).length !== 2) p.push("Fill in both questions.");
  if (!b.action.trim()) p.push("Add the action point.");
  return p;
}

const H = (label: string) =>
  `<p style="margin:26px 0 10px;font-size:12px;font-weight:bold;letter-spacing:2px;color:#a03434">${label}</p>`;

/** Renders an issue as an email. `unsubscribeUrl` is per recipient. */
export function renderBrief(b: Pick<Brief, "issue_no" | "subject" | "bluf" | "ideas" | "questions" | "action">, unsubscribeUrl: string) {
  const site = SITE_URL.replace(/^https?:\/\//, "");
  const no = b.issue_no ? `ISSUE ${b.issue_no}` : "";
  const ideas = b.ideas
    .map(
      (t, i) =>
        `<tr><td valign="top" style="width:34px;font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#ea9a23;line-height:1.3">${i + 1}</td><td style="font-size:16px;line-height:1.6;padding-bottom:12px">${esc(t)}</td></tr>`,
    )
    .join("");
  const qs = b.questions.map((t) => `<li style="margin:0 0 10px;font-size:16px;line-height:1.6">${esc(t)}</li>`).join("");

  const html = `<!doctype html><html><body style="margin:0;background:#f3f5f8;font-family:Arial,Helvetica,sans-serif;color:#0b1320">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f8;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden">
<tr><td style="background:#0b1320;padding:24px 28px;border-bottom:4px solid #ea9a23">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td valign="middle" style="width:68px;padding-right:16px"><img src="${SITE_URL}/brand/vs-logo.png" width="56" height="56" alt="Victor Simz" style="display:block;width:56px;height:56px;border-radius:50%;border:1px solid #3a4352"></td>
<td valign="middle">
<div style="color:#ea9a23;font-size:12px;font-weight:bold;letter-spacing:3px">THE TAKE COMMAND BRIEF${no ? ` · ${no}` : ""}</div>
<div style="color:#ffffff;font-family:Georgia,serif;font-size:24px;font-weight:bold;line-height:1.25;margin-top:6px">${esc(b.subject)}</div>
</td></tr></table>
</td></tr>
<tr><td style="padding:8px 28px 28px">
${H("BOTTOM LINE UP FRONT")}
<p style="margin:0;font-size:18px;line-height:1.55;font-weight:bold;border-left:4px solid #ea9a23;padding-left:14px">${esc(b.bluf)}</p>
${H("3 IDEAS")}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${ideas}</table>
${H("2 QUESTIONS")}
<ul style="margin:0;padding-left:20px">${qs}</ul>
${H("1 ACTION")}
<p style="margin:0;font-size:16px;line-height:1.6;background:#0d2821;color:#ffffff;padding:16px 18px;border-radius:6px">${esc(b.action)}</p>
<p style="margin:26px 0 0;font-size:16px;line-height:1.6">Victor Simz</p>
</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid #e1e5eb;font-size:12px;line-height:1.6;color:#4a5362">${esc(TAGLINE)}<br>
Free resources: <a href="${SITE_URL}/resources" style="color:#4a5362">${site}/resources</a><br>
You subscribed at ${site}. <a href="${unsubscribeUrl}" style="color:#4a5362">Unsubscribe</a></td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    `THE TAKE COMMAND BRIEF${no ? ` · ${no}` : ""}`,
    b.subject,
    "",
    "BOTTOM LINE UP FRONT",
    b.bluf,
    "",
    "3 IDEAS",
    ...b.ideas.map((t, i) => `${i + 1}. ${t}`),
    "",
    "2 QUESTIONS",
    ...b.questions.map((t) => `- ${t}`),
    "",
    "1 ACTION",
    b.action,
    "",
    "Victor Simz",
    TAGLINE,
    "",
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");

  return { html, text };
}

export function unsubscribeUrl(token: string): string {
  return `${SITE_URL}/unsubscribe?t=${token}`;
}

/** Endpoint mail apps call for one-click unsubscribe. */
export function oneClickUrl(token: string): string {
  return `${SITE_URL}/api/unsubscribe?t=${token}`;
}
