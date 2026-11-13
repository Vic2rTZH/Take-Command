import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { AboutSection, OfferSection } from "@/components/Sections";
import TrackView from "@/components/TrackView";
import { getPublishedResource } from "@/lib/resources";
import { resourceMeta } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getPublishedResource(slug);
  if (!resource) return { title: "Resource not found" };
  return { title: resource.title, description: resource.description || undefined };
}

export default async function ResourcePage({ params }: Props) {
  const { slug } = await params;
  const resource = await getPublishedResource(slug);
  if (!resource) notFound();
  return (
    <div className="page">
      <TrackView slug={resource.slug} />
      <SiteHeader cta={{ href: "#get", label: "Get it free" }} />
      <main>
        <section className="wrap res-hero stack">
          <p className="eyebrow">Free {resource.kind.toLowerCase()}</p>
          <h1 className="serif">{resource.title}</h1>
          <p className="lede">{resourceMeta(resource)}. Free, sent to your inbox.</p>
        </section>
        <OfferSection resource={resource} eyebrow="What you get" heading={`Inside the ${resource.kind.toLowerCase()}`} />
        <AboutSection />
      </main>
      <SiteFooter />
    </div>
  );
}
