/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import TrackView from "@/components/TrackView";
import { listPublicResources } from "@/lib/resources";
import { resourceMeta } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Free resources",
  description: "Practical workbooks and worksheets from Take Command that you can print, fill in and act on.",
};

export default async function ResourcesPage() {
  const resources = await listPublicResources();
  return (
    <div className="page">
      <TrackView />
      <SiteHeader current="resources" />
      <main>
        <section className="wrap hub-head stack">
          <p className="eyebrow">Free resources</p>
          <h1 className="serif">
            Tools to help you <i>Take Command.</i>
          </h1>
          <p className="lede">Practical workbooks and worksheets you can print, fill in and act on. Each one is free. Tell me where to send it.</p>
        </section>
        <section className="wrap">
          <div className="hub-grid">
            {resources.map((r) => {
              const live = r.status === "published";
              return (
                <article className={`res${live ? " live" : ""}`} key={r.id}>
                  <div className="res-cover">
                    {r.cover_url ? (
                      <img src={r.cover_url} alt={`Cover of ${r.title}`} loading="lazy" />
                    ) : (
                      <div className="ph" aria-hidden="true">
                        <small>Take Command</small>
                        <span>{r.title}</span>
                      </div>
                    )}
                  </div>
                  <div className="res-body">
                    <div className="res-meta">{resourceMeta(r)}</div>
                    <h2 className="serif">{r.title}</h2>
                    <p>{r.description}</p>
                    {live ? (
                      <Link className="btn small" href={`/resources/${r.slug}`}>
                        Get it free
                      </Link>
                    ) : (
                      <span className="soon">Coming soon</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
