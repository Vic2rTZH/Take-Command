import type { Resource } from "./types";

export function resourceMeta(r: Pick<Resource, "kind" | "pages" | "minutes">): string {
  const parts = [r.kind];
  if (r.pages) parts.push(`${r.pages} ${r.pages === 1 ? "page" : "pages"}`);
  if (r.minutes) parts.push(`about ${r.minutes} minutes`);
  return parts.join(" · ");
}
