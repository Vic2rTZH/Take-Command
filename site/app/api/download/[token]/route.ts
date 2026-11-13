import { NextResponse } from "next/server";
import { db, dbConfigured, FILES_BUCKET } from "@/lib/supabase";
import { SITE_URL } from "@/lib/site";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!dbConfigured || !UUID_RE.test(token)) return NextResponse.redirect(`${SITE_URL}/resources`);

  const supabase = db();
  const { data: filePath, error } = await supabase.rpc("tc_record_download", { p_token: token });
  if (error || !filePath) return NextResponse.redirect(`${SITE_URL}/resources`);

  const { data: signed, error: signErr } = await supabase.storage.from(FILES_BUCKET).createSignedUrl(String(filePath), 300, { download: true });
  if (signErr || !signed) return new NextResponse("This file is not available right now. Please try again later.", { status: 503 });

  return NextResponse.redirect(signed.signedUrl);
}
