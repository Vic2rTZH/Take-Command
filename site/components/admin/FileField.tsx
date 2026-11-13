"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, type ChangeEvent } from "react";
import { createClient } from "@supabase/supabase-js";
import { createUploadTarget } from "@/app/admin/actions";

type Props = { kind: "cover" | "file"; name: string; label: string; hint: string; accept: string; initial: string | null };

/** Uploads straight from the browser to Supabase Storage, then stores the path (or public URL for covers) in a hidden field. */
export default function FileField({ kind, name, label, hint, accept, initial }: Props) {
  const [value, setValue] = useState(initial ?? "");
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    setMessage("Uploading…");
    try {
      const target = await createUploadTarget(kind, file.name);
      if (!target.ok) throw new Error(target.message);
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
      const { error } = await supabase.storage.from(target.bucket).uploadToSignedUrl(target.path, target.token, file, { contentType: file.type || undefined });
      if (error) throw new Error(error.message);
      setValue(kind === "cover" ? target.publicUrl! : target.path);
      setStatus("done");
      setMessage(`Uploaded ${file.name}. Save the resource to keep it.`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? `Upload failed: ${err.message}` : "Upload failed.");
    }
  }

  return (
    <div>
      <label htmlFor={`${name}-file`}>{label}</label>
      <div className="upl">
        <input type="hidden" name={name} value={value} />
        {kind === "cover" && value ? <img src={value} alt="Current cover" /> : null}
        <div className="cur">{value ? (kind === "cover" ? "Cover image set." : `Current file: ${value}`) : "Nothing uploaded yet."}</div>
        <input id={`${name}-file`} type="file" accept={accept} onChange={onChange} disabled={status === "uploading"} />
        {message ? (
          <div className="cur" role={status === "error" ? "alert" : "status"} style={status === "error" ? { color: "#f0a3a3" } : undefined}>
            {message}
          </div>
        ) : null}
      </div>
      <p className="hint">{hint}</p>
    </div>
  );
}
