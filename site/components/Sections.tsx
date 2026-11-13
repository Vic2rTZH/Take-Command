/* eslint-disable @next/next/no-img-element */
import SignupForm from "./SignupForm";
import { CONTACT_EMAIL, SERIES } from "@/lib/site";
import { resourceMeta } from "@/lib/format";
import type { Resource } from "@/lib/types";

const two = (n: number) => String(n).padStart(2, "0");

export function OfferSection({ resource, eyebrow = "Start here", heading }: { resource: Resource; eyebrow?: string; heading?: string }) {
  const meta = resourceMeta(resource);
  return (
    <section id="get" className="offer">
      <div className="wrap section">
        <div className="offer-text stack">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="serif">{heading ?? resource.title}</h2>
          {resource.quote ? <p className="quote">{resource.quote}</p> : null}
          {resource.description ? <p className="lede">{resource.description}</p> : null}
          {resource.highlights.length > 0 ? (
            <div className="cards">
              {resource.highlights.map((h, i) => (
                <div className="card" key={`${h.title}-${i}`}>
                  <div className="n">{two(i + 1)}</div>
                  <div className="t">{h.title}</div>
                  {h.text ? <div className="d">{h.text}</div> : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <SignupForm slug={resource.slug} title={resource.title} meta={meta} />
      </div>
    </section>
  );
}

export function SeriesSection() {
  return (
    <section className="wrap section">
      <div className="series-head stack">
        <p className="eyebrow">Explore Take Command</p>
        <h2 className="serif">Four series. One philosophy.</h2>
      </div>
      <div className="series">
        {SERIES.map((s, i) => (
          <div key={s.title}>
            <div className="n">{two(i + 1)}</div>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AboutSection() {
  return (
    <section className="about">
      <div className="wrap section">
        <img src="/brand/book.jpg" alt="The book Take Command: How to Plan Your Life Like a Military General" width={745} height={900} loading="lazy" />
        <div className="about-text stack">
          <p className="eyebrow">About Victor Simz</p>
          <h2 className="serif">Historian. Strategist. Leader.</h2>
          <p>
            Victor Simz is the author of <i>Take Command: How to Plan Your Life Like a Military General</i>. He draws on military strategy, leadership and
            practical experience to help people think clearly, lead well and live with intention.
          </p>
          <p>No empty motivation. Just ideas worth thinking about and actions worth taking.</p>
          <div className="orgs">
            <div className="k">For organisations</div>
            <p>
              Training, workshops and advisory in leadership, strategy, systems thinking and AI: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
