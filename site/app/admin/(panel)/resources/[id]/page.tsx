import Link from "next/link";
import { notFound } from "next/navigation";
import FileField from "@/components/admin/FileField";
import { deleteResource, saveResource } from "@/app/admin/actions";
import { dbConfigured } from "@/lib/supabase";
import { getResourceById } from "@/lib/resources";

export const metadata = { title: "Edit resource" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

export default async function EditResource({ params, searchParams }: Props) {
  const { id } = await params;
  const { error } = await searchParams;
  if (!dbConfigured) notFound();
  const isNew = id === "new";
  const r = isNew ? null : await getResourceById(id);
  if (!isNew && !r) notFound();

  const highlights = (r?.highlights ?? []).map((h) => (h.text ? `${h.title} | ${h.text}` : h.title)).join("\n");

  return (
    <>
      <div className="adm-top">
        <div>
          <h1>{isNew ? "Add a resource" : r!.title}</h1>
          <p className="adm-sub">
            <Link href="/admin/resources" style={{ color: "#f4b556" }}>
              Back to resources
            </Link>
          </p>
        </div>
      </div>
      {error ? (
        <p className="notice err" role="alert">
          {error}
        </p>
      ) : null}
      <form className="form panel" action={saveResource}>
        <input type="hidden" name="id" value={r?.id ?? ""} />
        <div className="row">
          <div>
            <label htmlFor="title">Title</label>
            <input id="title" name="title" type="text" required maxLength={160} defaultValue={r?.title ?? ""} />
          </div>
          <div>
            <label htmlFor="slug">Web address</label>
            <input id="slug" name="slug" type="text" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={r?.slug ?? ""} />
            <p className="hint">Lowercase words joined by hyphens, for example strategic-thinking-worksheet.</p>
          </div>
        </div>
        <div className="row">
          <div>
            <label htmlFor="kind">Type</label>
            <input id="kind" name="kind" type="text" list="kinds" defaultValue={r?.kind ?? "Workbook"} />
            <datalist id="kinds">
              <option value="Workbook" />
              <option value="Worksheet" />
              <option value="Guide" />
              <option value="Template" />
              <option value="Checklist" />
            </datalist>
          </div>
          <div>
            <label htmlFor="pages">Pages</label>
            <input id="pages" name="pages" type="number" min={1} defaultValue={r?.pages ?? ""} />
          </div>
          <div>
            <label htmlFor="minutes">Minutes to complete</label>
            <input id="minutes" name="minutes" type="number" min={1} defaultValue={r?.minutes ?? ""} />
          </div>
        </div>
        <div>
          <label htmlFor="quote">Quote or one-line hook</label>
          <input id="quote" name="quote" type="text" maxLength={300} defaultValue={r?.quote ?? ""} />
          <p className="hint">Optional. Shown in italics under the title.</p>
        </div>
        <div>
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" maxLength={1000} defaultValue={r?.description ?? ""} />
          <p className="hint">Two or three sentences: what the reader works through and what they leave with.</p>
        </div>
        <div>
          <label htmlFor="highlights">What&apos;s inside</label>
          <textarea id="highlights" name="highlights" defaultValue={highlights} />
          <p className="hint">One item per line, written as Title | Short description. Shown as numbered cards. Up to 12.</p>
        </div>
        <div className="row">
          <FileField kind="file" name="file_path" label="PDF file" accept="application/pdf" initial={r?.file_path ?? null} hint="Kept private. People receive it by email after signing up." />
          <FileField kind="cover" name="cover_url" label="Cover image" accept="image/png,image/jpeg,image/webp" initial={r?.cover_url ?? null} hint="A picture of the first page works well. PNG or JPG." />
        </div>
        <div className="row">
          <div>
            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={r?.status ?? "draft"}>
              <option value="draft">Draft: hidden from the site</option>
              <option value="coming_soon">Coming soon: listed, no sign-up</option>
              <option value="published">Published: listed with sign-up</option>
            </select>
          </div>
          <div>
            <label htmlFor="sort">Order</label>
            <input id="sort" name="sort" type="number" min={1} defaultValue={r?.sort ?? 100} />
            <p className="hint">Lower numbers appear first. The first published resource is featured on the home page.</p>
          </div>
        </div>
        <div className="actions">
          <button className="adm-btn" type="submit">
            {isNew ? "Add resource" : "Save changes"}
          </button>
          <Link className="adm-btn quiet" href="/admin/resources">
            Cancel
          </Link>
        </div>
      </form>

      {!isNew ? (
        <details className="tv">
          <summary>Delete this resource</summary>
          <form className="form panel" action={deleteResource}>
            <input type="hidden" name="id" value={r!.id} />
            <p style={{ margin: 0, lineHeight: 1.55 }}>
              This removes the resource and its sign-up and download history. Subscribers stay on your list. This cannot be undone.
            </p>
            <div>
              <label htmlFor="confirm">Type DELETE to confirm</label>
              <input id="confirm" name="confirm" type="text" autoComplete="off" style={{ maxWidth: 220 }} />
            </div>
            <div className="actions">
              <button className="adm-btn danger" type="submit">
                Delete resource
              </button>
            </div>
          </form>
        </details>
      ) : null}
    </>
  );
}
