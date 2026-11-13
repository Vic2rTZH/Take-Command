import type { Metadata } from "next";
import { redirect } from "next/navigation";
import "../admin.css";
import { signIn } from "../actions";
import { authConfigured, currentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (await currentAdmin()) redirect("/admin");
  return (
    <main className="login">
      <form className="box form" action={signIn}>
        <h1>Take Command admin</h1>
        {!authConfigured || error === "setup" ? (
          <p className="notice">
            Sign-in is not set up yet. Add the Supabase keys and <code>ADMIN_EMAILS</code> to the site&apos;s environment variables.
          </p>
        ) : null}
        {error === "invalid" ? (
          <p className="notice err" role="alert">
            That email or password is not right.
          </p>
        ) : null}
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="username" required />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        <button className="adm-btn" type="submit">
          Sign in
        </button>
      </form>
    </main>
  );
}
