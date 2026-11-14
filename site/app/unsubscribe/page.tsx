import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { db, dbConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function confirmUnsubscribe(formData: FormData) {
  "use server";
  const token = String(formData.get("t") || "");
  if (!dbConfigured || !UUID_RE.test(token)) redirect("/unsubscribe?done=0");
  const { data } = await db().from("tc_subscribers").update({ newsletter: false }).eq("unsub_token", token).select("id");
  redirect(`/unsubscribe?done=${data && data.length ? 1 : 0}`);
}

// The link only shows a button; email security scanners open links automatically, so a click alone must not unsubscribe anyone.
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ t?: string; done?: string }> }) {
  const { t, done } = await searchParams;
  const valid = Boolean(t && UUID_RE.test(t));
  const title = done === "1" ? "You're unsubscribed." : done === "0" || (!done && !valid) ? "That link didn't work." : "Unsubscribe from The Take Command Brief?";
  return (
    <div className="page">
      <SiteHeader />
      <main className="wrap hub-head stack" style={{ minHeight: "40vh" }}>
        <p className="eyebrow">The Take Command Brief</p>
        <h1 className="serif">{title}</h1>
        {done === "1" ? (
          <p className="lede">You won&apos;t receive the newsletter any more. Any free resources you asked for are still yours.</p>
        ) : done === "0" || !valid ? (
          <p className="lede">The unsubscribe link may be incomplete. Reply to any newsletter email and you will be removed by hand.</p>
        ) : (
          <form action={confirmUnsubscribe} className="stack" style={{ gap: 18, alignItems: "flex-start" }}>
            <input type="hidden" name="t" value={t} />
            <p className="lede">You will stop receiving the newsletter. You can sign up again at any time.</p>
            <button className="btn small" type="submit">
              Unsubscribe
            </button>
          </form>
        )}
        {done || !valid ? (
          <Link className="btn small ghost" href="/" style={{ alignSelf: "flex-start" }}>
            Back to Take Command
          </Link>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
