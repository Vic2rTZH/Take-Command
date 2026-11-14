/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import "../admin.css";
import { signOut } from "../actions";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const email = await requireAdmin();
  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-brand">
          <img src="/brand/vs-logo.png" alt="" width={34} height={34} />
          Take Command
        </div>
        <nav className="adm-nav" aria-label="Admin">
          <Link href="/admin">Overview</Link>
          <Link href="/admin/resources">Resources</Link>
          <Link href="/admin/newsletter">Newsletter</Link>
          <Link href="/admin/subscribers">Subscribers</Link>
          <Link href="/" target="_blank">
            View site
          </Link>
        </nav>
        <div className="adm-foot">
          <span>{email}</span>
          <form action={signOut}>
            <button className="adm-btn quiet" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="adm-main">{children}</main>
    </div>
  );
}
