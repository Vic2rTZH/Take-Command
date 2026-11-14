import Link from "next/link";
import { db, dbConfigured } from "@/lib/supabase";
import { BRIEF_COLUMNS, type Brief } from "@/lib/brief";
import { createIssue } from "./actions";

export const metadata = { title: "Newsletter" };

function day(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "–";
}

export default async function NewsletterList({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (!dbConfigured) return <h1>Newsletter</h1>;
  const supabase = db();
  const [{ data }, { count }] = await Promise.all([
    supabase.from("tc_newsletters").select(BRIEF_COLUMNS).order("created_at", { ascending: false }),
    supabase.from("tc_subscribers").select("id", { count: "exact", head: true }).eq("newsletter", true),
  ]);
  const issues = (data ?? []) as Brief[];
  return (
    <>
      <div className="adm-top">
        <div>
          <h1>The Take Command Brief</h1>
          <p className="adm-sub">{(count ?? 0).toLocaleString("en-GB")} newsletter subscribers. Format: BLUF, 3 ideas, 2 questions, 1 action.</p>
        </div>
        <form action={createIssue}>
          <button className="adm-btn" type="submit">
            New issue
          </button>
        </form>
      </div>
      {error ? <p className="notice err">{error}</p> : null}
      <div className="panel tbl-wrap">
        {issues.length === 0 ? (
          <p className="empty">No issues yet. Start your first one.</p>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Issue</th>
                <th>Subject</th>
                <th>Status</th>
                <th className="num">Sent to</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {issues.map((b) => (
                <tr key={b.id}>
                  <td>{b.issue_no ?? "–"}</td>
                  <td>{b.subject || <span style={{ color: "#b4bdca" }}>Untitled</span>}</td>
                  <td>
                    <span className={`pill${b.status === "sent" ? " on" : ""}`}>{b.status === "sent" ? "Sent" : b.status === "sending" ? "Sending" : "Draft"}</span>
                  </td>
                  <td className="num">{b.recipients ?? "–"}</td>
                  <td>{day(b.sent_at ?? b.updated_at)}</td>
                  <td>
                    <Link href={`/admin/newsletter/${b.id}`}>{b.status === "draft" ? "Edit" : "View"}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
