"use server";

import { redirect } from "next/navigation";
import { authClient, authConfigured, isAdminEmail, requireAdmin } from "@/lib/auth";
import { db, FILES_BUCKET, PUBLIC_BUCKET, publicFileUrl } from "@/lib/supabase";
import type { Highlight } from "@/lib/types";

export async function signIn(formData: FormData) {
  if (!authConfigured) redirect("/admin/login?error=setup");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  // Same message for every failure, so the form does not reveal which emails are admins.
  if (!isAdminEmail(email)) redirect("/admin/login?error=invalid");
  const supabase = await authClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/admin/login?error=invalid");
  redirect("/admin");
}

export async function signOut() {
  if (authConfigured) {
    const supabase = await authClient();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function safeName(name: string): string {
  const cleaned = name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned.slice(-80) || "file";
}

/** Returns a one-time upload target so the browser can send the file straight to storage. */
export async function createUploadTarget(kind: "cover" | "file", filename: string) {
  await requireAdmin();
  const bucket = kind === "cover" ? PUBLIC_BUCKET : FILES_BUCKET;
  const path = `${kind === "cover" ? "covers" : "resources"}/${Date.now()}-${safeName(filename)}`;
  const { data, error } = await db().storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) return { ok: false as const, message: error?.message || "Could not prepare the upload." };
  return { ok: true as const, bucket, path: data.path, token: data.token, publicUrl: kind === "cover" ? publicFileUrl(data.path) : null };
}

function parseHighlights(raw: string): Highlight[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((line) => {
      const [title, ...rest] = line.split("|");
      return { title: title.trim().slice(0, 80), text: rest.join("|").trim().slice(0, 200) };
    })
    .filter((h) => h.title);
}

function toInt(v: FormDataEntryValue | null): number | null {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function saveResource(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const back = `/admin/resources/${id || "new"}`;
  const fail = (m: string): never => redirect(`${back}?error=${encodeURIComponent(m)}`);

  const title = String(formData.get("title") || "").trim();
  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  const status = String(formData.get("status") || "draft");
  const filePath = String(formData.get("file_path") || "").trim() || null;
  const coverUrl = String(formData.get("cover_url") || "").trim() || null;

  if (!title) fail("Add a title.");
  if (!SLUG_RE.test(slug)) fail("The web address can use lowercase letters, numbers and hyphens only.");
  if (!["draft", "coming_soon", "published"].includes(status)) fail("Choose a status.");
  if (status === "published" && !filePath) fail("Upload the PDF before publishing, or set the status to Coming soon.");

  const row = {
    title: title.slice(0, 160),
    slug,
    kind: String(formData.get("kind") || "Workbook").trim().slice(0, 40) || "Workbook",
    quote: String(formData.get("quote") || "").trim().slice(0, 300) || null,
    description: String(formData.get("description") || "").trim().slice(0, 1000),
    highlights: parseHighlights(String(formData.get("highlights") || "")),
    pages: toInt(formData.get("pages")),
    minutes: toInt(formData.get("minutes")),
    cover_url: coverUrl,
    file_path: filePath,
    status,
    sort: toInt(formData.get("sort")) ?? 100,
    updated_at: new Date().toISOString(),
  };

  const supabase = db();
  const { error } = id ? await supabase.from("tc_resources").update(row).eq("id", id) : await supabase.from("tc_resources").insert(row);
  if (error) fail(error.code === "23505" ? "Another resource already uses that web address." : error.message);
  redirect("/admin/resources?saved=1");
}

export async function deleteResource(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (String(formData.get("confirm") || "").trim().toUpperCase() !== "DELETE") {
    redirect(`/admin/resources/${id}?error=${encodeURIComponent("Type DELETE to confirm.")}`);
  }
  const { error } = await db().from("tc_resources").delete().eq("id", id);
  if (error) redirect(`/admin/resources/${id}?error=${encodeURIComponent(error.message)}`);
  redirect("/admin/resources?deleted=1");
}
