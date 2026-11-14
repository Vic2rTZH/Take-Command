import Link from "next/link";
import { notFound } from "next/navigation";
import { db, dbConfigured } from "@/lib/supabase";
import { aiConfigured } from "@/lib/ai";
import { BRIEF_COLUMNS, briefProblems, renderBrief, type Brief } from "@/lib/brief";
import { SITE_URL } from "@/lib/site";
import { aiDraft, broadcastIssue, deleteIssue, saveIssue, sendTest } from "../actions";

export const metadata = { title: "Newsletter issue" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> };

export default async function IssuePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  if (!dbConfigured || !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = db();
  const { data } = await supabase.from("tc_newsletters").select(BRIEF_COLUMNS).eq("id", id).maybeSingle();
  if (!data) notFound();
  const b = data as Brief;
  const ideas = [0, 1, 2].map((i) => b.ideas[i] ?? "");
  const qs = [0, 1].map((i) => b.questions[i] ?? "");
  const draft = b.status === "draft";
  const { count } = await supabase.from("tc_subscribers").select("id", { count: "exact", head: true }).eq("newsletter", true);
  const subs = count ?? 0;
  const problems = briefProblems({ ...b, ideas, questions: qs });
  const { html } = renderBrief({ ...b, ideas, questions: qs }, `${SITE_URL}/unsubscribe`);

  return (
    <>
      <div className="adm-top">
        <div>
          <h1>
            Issue {b.issue_no ?? ""}
            {b.subject ? `: ${b.subject}` : ""}
          </h1>
          <p className="adm-sub">
            <Link href="/admin/newsletter" style={{ color: "#f4b556" }}>
              Back to all issues
            </Link>
          </p>
        </div>
      </div>

      {sp.error ? (
        <p className="notice err" role="alert">
          {sp.error}
        </p>
      ) : null}
      {sp.saved ? <p className="notice">Saved.</p> : null}
      {sp.drafted ? <p className="notice">Draft written. Read it carefully and edit anything before sending.</p> : null}
      {sp.tested ? <p className="notice">Test email sent to you.</p> : null}
      {sp.sent ? (
        <p className="notice">
          Sent to {sp.sent} subscribers.{sp.failed ? ` ${sp.failed} could not be sent; check Resend for details.` : ""}
        </p>
      ) : null}

      {draft ? (
        <form className="form" style={{ maxWidth: "none" }}>
          <input type="hidden" name="id" value={b.id} />
          <div className="grid2" style={{ marginTop: 0, alignItems: "start" }}>
            <div className="stack" style={{ gap: 14 }}>
              <section className="panel stack" style={{ gap: 12 }}>
                <h2>AI assist</h2>
                {aiConfigured ? (
                  <>
                    <label htmlFor="notes" style={{ margin: 0 }}>
                      Topic, notes or changes you want
                    </label>
                    <textarea id="notes" name="notes" placeholder="e.g. Why most people plan their careers but not their lives. Or: make idea 2 shorter and sharper." />
                    <p className="hint" style={{ margin: 0 }}>
                      If the issue already has text, the AI revises it. It never sends anything.
                    </p>
                    <div className="actions">
                      <button className="adm-btn" type="submit" formAction={aiDraft}>
                        Write with AI
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="notice" style={{ margin: 0 }}>
                    AI drafting is off. Add <code>ANTHROPIC_API_KEY</code> in Vercel, then redeploy. You can still write issues by hand.
                  </p>
                )}
              </section>

              <section className="panel stack" style={{ gap: 14 }}>
                <h2>The issue</h2>
                <div>
                  <label htmlFor="subject">Subject line</label>
                  <input id="subject" name="subject" type="text" maxLength={150} defaultValue={b.subject} />
                </div>
                <div>
                  <label htmlFor="bluf">BLUF: bottom line up front</label>
                  <textarea id="bluf" name="bluf" maxLength={600} defaultValue={b.bluf} style={{ minHeight: 80 }} />
                </div>
                {ideas.map((t, i) => (
                  <div key={`i${i}`}>
                    <label htmlFor={`idea${i + 1}`}>Idea {i + 1}</label>
                    <textarea id={`idea${i + 1}`} name={`idea${i + 1}`} maxLength={800} defaultValue={t} style={{ minHeight: 80 }} />
                  </div>
                ))}
                {qs.map((t, i) => (
                  <div key={`q${i}`}>
                    <label htmlFor={`q${i + 1}`}>Question {i + 1}</label>
                    <input id={`q${i + 1}`} name={`q${i + 1}`} type="text" maxLength={400} defaultValue={t} />
                  </div>
                ))}
                <div>
                  <label htmlFor="action">The 1 action</label>
                  <textarea id="action" name="action" maxLength={600} defaultValue={b.action} style={{ minHeight: 80 }} />
                </div>
                <div className="actions">
                  <button className="adm-btn" type="submit" formAction={saveIssue}>
                    Save
                  </button>
                  <button className="adm-btn quiet" type="submit" formAction={sendTest}>
                    Save and send me a test
                  </button>
                </div>
              </section>

              <section className="panel stack" style={{ gap: 12 }}>
                <h2>Send to subscribers</h2>
                {problems.length ? (
                  <p className="hint" style={{ margin: 0 }}>
                    Before sending: {problems.join(" ")} Then save.
                  </p>
                ) : null}
                <input type="hidden" name="expected" value={subs} />
                <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontWeight: 500, margin: 0, minHeight: 44 }}>
                  <input type="checkbox" name="confirm" style={{ width: 20, height: 20, marginTop: 2 }} />
                  <span>
                    I have checked the test email. Send this issue to {subs.toLocaleString("en-GB")} {subs === 1 ? "subscriber" : "subscribers"} now. This cannot be undone.
                  </span>
                </label>
                <div className="actions">
                  <button className="adm-btn" type="submit" formAction={broadcastIssue} disabled={problems.length > 0 || subs === 0}>
                    Send to {subs.toLocaleString("en-GB")} {subs === 1 ? "subscriber" : "subscribers"}
                  </button>
                  <button className="adm-btn quiet" type="submit" formAction={deleteIssue} formNoValidate>
                    Delete draft
                  </button>
                </div>
                <p className="hint" style={{ margin: 0 }}>
                  The send button uses the last saved version. Save first if you have made changes.
                </p>
              </section>
            </div>

            <section className="panel">
              <h2>Preview</h2>
              <p className="cap">The last saved version, as subscribers will see it.</p>
              <iframe title="Email preview" srcDoc={html} sandbox="" style={{ width: "100%", height: 1100, border: "none", borderRadius: 6, background: "#f3f5f8" }} />
            </section>
          </div>
        </form>
      ) : (
        <section className="panel">
          <p className="cap">
            {b.status === "sent"
              ? `Sent to ${b.recipients ?? 0} subscribers on ${b.sent_at ? new Date(b.sent_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : ""}.`
              : "This issue is being sent."}
          </p>
          <iframe title="Email preview" srcDoc={html} sandbox="" style={{ width: "100%", maxWidth: 680, height: 1100, border: "none", borderRadius: 6, background: "#f3f5f8" }} />
        </section>
      )}
    </>
  );
}
