import Link from "next/link";
import TrendChart from "@/components/admin/TrendChart";
import { db, dbConfigured } from "@/lib/supabase";
import type { Overview, Totals } from "@/lib/types";

export const metadata = { title: "Overview" };

const RANGES = [7, 30, 90];
const VISITS = "#C98318";
const SIGNUPS = "#3987DB";

const nf = (n: number) => n.toLocaleString("en-GB");

function delta(now: number, before: number, days: number): string {
  if (before === 0) return now === 0 ? `No change from the previous ${days} days` : `New: none in the previous ${days} days`;
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) return `Level with the previous ${days} days`;
  return `${pct > 0 ? "▲ Up" : "▼ Down"} ${Math.abs(pct)}% on the previous ${days} days`;
}

function rate(t: Totals): string {
  return t.visitors > 0 ? `${((t.signups / t.visitors) * 100).toFixed(1)}%` : "–";
}

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: process.env.ANALYTICS_TZ || "Africa/Lusaka" });
}

export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const sp = await searchParams;
  const days = RANGES.includes(Number(sp.days)) ? Number(sp.days) : 30;

  if (!dbConfigured) {
    return (
      <>
        <h1>Overview</h1>
        <p className="notice" style={{ marginTop: 18 }}>
          The database is not connected yet. Add the Supabase keys to the environment variables and run the migrations in <code>supabase/migrations</code>.
        </p>
      </>
    );
  }

  const { data, error } = await db().rpc("tc_overview", { p_days: days, p_tz: process.env.ANALYTICS_TZ || "Africa/Lusaka" });
  if (error || !data) {
    return (
      <>
        <h1>Overview</h1>
        <p className="notice err" style={{ marginTop: 18 }}>
          The figures could not be loaded: {error?.message || "no data returned"}. Check that the migrations have been run.
        </p>
      </>
    );
  }
  const o = data as Overview;
  const t = o.totals;
  const p = o.previous;

  return (
    <>
      <div className="adm-top">
        <div>
          <h1>Overview</h1>
          <p className="adm-sub">Last {days} days, including today.</p>
        </div>
        <nav className="seg" aria-label="Date range">
          {RANGES.map((r) => (
            <Link key={r} href={`/admin?days=${r}`} aria-current={r === days ? "true" : undefined}>
              {r} days
            </Link>
          ))}
        </nav>
      </div>

      <div className="tiles">
        <div className="tile">
          <div className="k">Page visits</div>
          <div className="v">{nf(t.views)}</div>
          <div className="d">{delta(t.views, p.views, days)}</div>
        </div>
        <div className="tile">
          <div className="k">Visitors (unique per day)</div>
          <div className="v">{nf(t.visitors)}</div>
          <div className="d">{delta(t.visitors, p.visitors, days)}</div>
        </div>
        <div className="tile">
          <div className="k">Sign-ups</div>
          <div className="v">{nf(t.signups)}</div>
          <div className="d">{delta(t.signups, p.signups, days)}</div>
        </div>
        <div className="tile">
          <div className="k">Downloads</div>
          <div className="v">{nf(t.downloads)}</div>
          <div className="d">{delta(t.downloads, p.downloads, days)}</div>
        </div>
        <div className="tile">
          <div className="k">Sign-up rate</div>
          <div className="v">{rate(t)}</div>
          <div className="d">Sign-ups per visitor. Previous: {rate(p)}</div>
        </div>
      </div>

      <div className="grid2">
        <section className="panel">
          <h2>Page visits per day</h2>
          <p className="cap">Every page load on the public site.</p>
          <TrendChart data={o.daily.map((d) => ({ day: d.day, value: d.views }))} label="Page visits" color={VISITS} />
        </section>
        <section className="panel">
          <h2>Sign-ups per day</h2>
          <p className="cap">Each time someone asks for a resource.</p>
          <TrendChart data={o.daily.map((d) => ({ day: d.day, value: d.signups }))} label="Sign-ups" color={SIGNUPS} />
        </section>
      </div>

      <details className="tv">
        <summary>Show daily figures as a table</summary>
        <div className="panel tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Day</th>
                <th className="num">Visits</th>
                <th className="num">Visitors</th>
                <th className="num">Sign-ups</th>
                <th className="num">Downloads</th>
              </tr>
            </thead>
            <tbody>
              {[...o.daily].reverse().map((d) => (
                <tr key={d.day}>
                  <td>{d.day}</td>
                  <td className="num">{nf(d.views)}</td>
                  <td className="num">{nf(d.visitors)}</td>
                  <td className="num">{nf(d.signups)}</td>
                  <td className="num">{nf(d.downloads)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <div className="grid2">
        <section className="panel">
          <h2>By resource</h2>
          <p className="cap">Visits count the resource&apos;s own page, plus the home page for the featured resource.</p>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Resource</th>
                  <th className="num">Visits</th>
                  <th className="num">Sign-ups</th>
                  <th className="num">Downloads</th>
                </tr>
              </thead>
              <tbody>
                {o.by_resource.map((r) => (
                  <tr key={r.slug}>
                    <td>{r.title}</td>
                    <td className="num">{nf(r.views)}</td>
                    <td className="num">{nf(r.signups)}</td>
                    <td className="num">{nf(r.downloads)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel">
          <h2>Where visitors come from</h2>
          <p className="cap">The site that linked to yours. Direct means a typed address, an app or an email.</p>
          {o.referrers.length === 0 ? (
            <p className="empty">No visits in this period.</p>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th className="num">Visits</th>
                  </tr>
                </thead>
                <tbody>
                  {o.referrers.map((r) => (
                    <tr key={r.host}>
                      <td>{r.host}</td>
                      <td className="num">{nf(r.views)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="panel" style={{ marginTop: 14 }}>
        <div className="adm-top" style={{ marginBottom: 6 }}>
          <h2>Latest sign-ups</h2>
          <Link href="/admin/subscribers" style={{ color: "#f4b556" }}>
            All subscribers
          </Link>
        </div>
        {o.recent.length === 0 ? (
          <p className="empty">No sign-ups yet.</p>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Resource</th>
                  <th>Downloaded</th>
                  <th>Newsletter</th>
                </tr>
              </thead>
              <tbody>
                {o.recent.map((r, i) => (
                  <tr key={`${r.email}-${i}`}>
                    <td>{when(r.created_at)}</td>
                    <td>{r.email}</td>
                    <td>{r.name || "–"}</td>
                    <td>{r.resource}</td>
                    <td>{r.downloaded_at ? "Yes" : "Not yet"}</td>
                    <td>{r.newsletter ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
