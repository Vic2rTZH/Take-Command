"use client";

import { useState, type FormEvent } from "react";

export default function NewsletterForm() {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    setState("sending");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: String(form.get("email") || ""), website: String(form.get("website") || "") }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.message || "Something went wrong. Please try again.");
        setState("idle");
        return;
      }
      setState("done");
    } catch {
      setError("We could not reach the server. Check your connection and try again.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <p className="nl-done" role="status">
        You&apos;re on the list. The next issue will come to your inbox.
      </p>
    );
  }

  return (
    <form className="nl-form" onSubmit={onSubmit}>
      <label className="nl-label" htmlFor="nl-email">
        Your email address
      </label>
      <div className="nl-row">
        <input className="nl-field" id="nl-email" name="email" type="email" autoComplete="email" required maxLength={320} placeholder="you@example.com" />
        <button className="btn small" type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Subscribe"}
        </button>
      </div>
      <div className="hp" aria-hidden="true">
        <label htmlFor="nl-website">Leave this field empty</label>
        <input id="nl-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {error ? (
        <p className="nl-err" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
