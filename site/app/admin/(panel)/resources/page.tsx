import Link from "next/link";
import { dbConfigured } from "@/lib/supabase";
import { listAllResources } from "@/lib/resources";
import { resourceMeta } from "@/lib/format";

export const metadata = { title: "Resources" };

const STATUS: Record<string, string> = { draft: "Draft", coming_soon: "Coming soon", published: "Published" };

export default async function ResourcesAdmin({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  const sp = await searchParams;
  if (!dbConfigured) {
    return (
      <>
        <h1>Resources</h1>
        <p className="notice" style={{ marginTop: 18 }}>
          The database is not connected yet, so the site is showing its built-in starter content.
        </p>
      </>
    );
  }
  const resources = await listAllResources();
  return (
    <>
      <div className="adm-top">
        <div>
          <h1>Resources</h1>
          <p className="adm-sub">Published and Coming soon resources appear on the Free resources page, lowest order number first.</p>
        </div>
        <Link className="adm-btn" href="/admin/resources/new">
          Add a resource
        </Link>
      </div>
      {sp.saved ? <p className="notice">Saved.</p> : null}
      {sp.deleted ? <p className="notice">Resource deleted.</p> : null}
      <div className="panel tbl-wrap">
        {resources.length === 0 ? (
          <p className="empty">No resources yet. Add your first one.</p>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Title</th>
                <th>Details</th>
                <th>Status</th>
                <th>PDF</th>
                <th className="num">Order</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {resources.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.title}</strong>
                    <br />
                    <span style={{ color: "#b4bdca", fontSize: 13 }}>/resources/{r.slug}</span>
                  </td>
                  <td>{resourceMeta(r)}</td>
                  <td>
                    <span className={`pill${r.status === "published" ? " on" : ""}`}>{STATUS[r.status]}</span>
                  </td>
                  <td>{r.file_path ? "Uploaded" : "Missing"}</td>
                  <td className="num">{r.sort}</td>
                  <td>
                    <Link href={`/admin/resources/${r.id}`}>Edit</Link>
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
