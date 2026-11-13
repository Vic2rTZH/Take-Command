import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { db, dbConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function cell(v: unknown): string {
  let s = v === null || v === undefined ? "" : String(v);
  // Stop spreadsheet apps treating a value as a formula.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await currentAdmin())) return new NextResponse("Not signed in", { status: 401 });
  if (!dbConfigured) return new NextResponse("Database not connected", { status: 503 });

  const supabase = db();
  const lines = [["email", "name", "newsletter", "joined"].join(",")];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await supabase
      .from("tc_subscribers")
      .select("email, name, newsletter, created_at")
      .order("created_at", { ascending: true })
      .range(from, from + size - 1);
    if (error) return new NextResponse(error.message, { status: 500 });
    for (const s of data ?? []) lines.push([cell(s.email), cell(s.name), s.newsletter ? "yes" : "no", cell(s.created_at)].join(","));
    if (!data || data.length < size) break;
  }
  return new NextResponse(lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="take-command-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
