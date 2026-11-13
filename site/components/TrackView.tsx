"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Sends one anonymous page-view per page load. No cookies. */
export default function TrackView({ slug }: { slug?: string }) {
  const pathname = usePathname();
  useEffect(() => {
    const payload = JSON.stringify({ path: pathname, slug: slug ?? null, referrer: document.referrer || null });
    try {
      const blob = new Blob([payload], { type: "application/json" });
      if (!navigator.sendBeacon || !navigator.sendBeacon("/api/track", blob)) {
        fetch("/api/track", { method: "POST", body: payload, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
      }
    } catch {
      // Tracking must never break the page.
    }
  }, [pathname, slug]);
  return null;
}
