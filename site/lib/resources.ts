import "server-only";
import { db, dbConfigured } from "./supabase";
import { SEED_RESOURCES } from "./seed";
import type { Resource } from "./types";

const COLUMNS = "id, slug, title, kind, quote, description, highlights, pages, minutes, cover_url, file_path, status, sort";

/** Published and coming-soon resources, in display order. */
export async function listPublicResources(): Promise<Resource[]> {
  if (!dbConfigured) return SEED_RESOURCES;
  const { data, error } = await db()
    .from("tc_resources")
    .select(COLUMNS)
    .in("status", ["published", "coming_soon"])
    .order("sort")
    .order("created_at");
  if (error) {
    console.error("listPublicResources failed", error.message);
    return SEED_RESOURCES;
  }
  return (data ?? []) as Resource[];
}

export async function getPublishedResource(slug: string): Promise<Resource | null> {
  const all = await listPublicResources();
  return all.find((r) => r.slug === slug && r.status === "published") ?? null;
}

/** The resource shown on the home page: the first published one. */
export async function getFeaturedResource(): Promise<Resource | null> {
  const all = await listPublicResources();
  return all.find((r) => r.status === "published") ?? null;
}

export async function listAllResources(): Promise<Resource[]> {
  const { data, error } = await db().from("tc_resources").select(COLUMNS).order("sort").order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as Resource[];
}

export async function getResourceById(id: string): Promise<Resource | null> {
  const { data, error } = await db().from("tc_resources").select(COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Resource) ?? null;
}
