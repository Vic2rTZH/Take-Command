/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { AboutSection, OfferSection, SeriesSection } from "@/components/Sections";
import TrackView from "@/components/TrackView";
import { getFeaturedResource } from "@/lib/resources";

export const dynamic = "force-dynamic";

export default async function Home() {
  const featured = await getFeaturedResource();
  const ctaHref = featured ? "#get" : "/resources";
  return (
    <div className="page">
      <TrackView slug={featured?.slug} />
      <SiteHeader current="home" cta={featured ? { href: "#get", label: "Get it free" } : undefined} />
      <main>
        <section className="wrap hero">
          <div className="hero-text stack">
            <p className="eyebrow">Victor Simz | Take Command</p>
            <h1 className="serif">
              Plan your life the way a general plans <i>a campaign.</i>
            </h1>
            <p className="lede">
              Life doesn&apos;t happen by accident. It takes clarity, discipline, deliberate decisions and action. Take Command brings the principles of
              military strategy and leadership to the life you&apos;re building.
            </p>
            <div className="hero-cta">
              {featured ? (
                <a className="btn" href={ctaHref}>
                  Get {featured.title.replace(/^The /, "the ")}
                </a>
              ) : (
                <Link className="btn" href={ctaHref}>
                  See free resources
                </Link>
              )}
              <span>Free. Sent to your inbox.</span>
            </div>
          </div>
          <div className="hero-photo">
            <img src="/brand/speaker.jpg" alt="Victor Simz speaking to a room, one hand raised" width={800} height={800} />
          </div>
        </section>
        {featured ? <OfferSection resource={featured} /> : null}
        <SeriesSection />
        <AboutSection />
        <section className="wrap closing">
          <h2 className="serif">
            Think clearer. Lead better.
            <br />
            <i>Take Command.</i>
          </h2>
          {featured ? (
            <a className="btn" href="#get">
              Get {featured.title.replace(/^The /, "the ")}
            </a>
          ) : null}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
