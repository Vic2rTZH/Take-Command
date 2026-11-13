import { db, dbConfigured } from "@/lib/supabase";

export const metadata = { title: "Subscribers" };

const PAGE = 200;

type Row = { id: string; email: string; name: string | null; newsletter: boolean; created_at: string; tc_requests: { created_at: string; downloaded_at: string | null; tc_resources: { title: string } | null }[] };

export default async function SubscribersPage() {
  if (!dbConfigured) {
    return (
      <>
        <h1>Subscribers</h1>
        <p className="notice" style={{ marginTop: 18 }}>
          The database is not connected yet.
        </p>
      </>
    );
  }
  const supabase = db();
  const [{ count: total }, { count: newsletter }, { data, error }] = await Promise.all([
    supabase.from("tc_subscribers").select("id", { count: "exact", head: true }),
    supabase.from("tc_subscribers").select("id", { count: "exact", head: true }).eq("newsletter", true),
    supabase
      .from("tc_subscribers")
      .select("id, email, name, newsletter, created_at, tc_requests(created_at, downloaded_at, tc_resources(title))")
      .order("created_at", { ascending: false })
      .limit(PAGE),
  ]);
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <div className="adm-top">
        <div>
          <h1>Subscribers</h1>
          <p className="adm-sub">
            {(total ?? 0).toLocaleString("en-GB")} people, {(newsletter ?? 0).toLocaleString("en-GB")} opted in to the newsletter.
          </p>
        </div>
        <a className="adm-btn quiet" href="/admin/subscribers/export">
          Download CSV
        </a>
      </div>
      {error ? <p className="notice err">Could not load subscribers: {error.message}</p> : null}
      <div className="panel tbl-wrap">
        {rows.length === 0 ? (
          <p className="empty">No subscribers yet.</p>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Joined</th>
                <th>Email</th>
                <th>Name</th>
                <th>Resources requested</th>
                <th>Downloaded</th>
                <th>Newsletter</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const titles = Array.from(new Set(s.tc_requests.map((q) => q.tc_resources?.title).filter(Boolean)));
                const downloaded = s.tc_requests.some((q) => q.downloaded_at);
                return (
                  <tr key={s.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{new Date(s.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td>{s.email}</td>
                    <td>{s.name || "–"}</td>
                    <td>{titles.join(", ") || "–"}</td>
                    <td>{downloaded ? "Yes" : "Not yet"}</td>
                    <td>{s.newsletter ? "Yes" : "No"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {(total ?? 0) > PAGE ? <p className="adm-sub">Showing the latest {PAGE}. Download the CSV for the full list.</p> : null}
    </>
  );
}
