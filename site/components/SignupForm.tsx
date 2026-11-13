"use client";

import { useState, type FormEvent } from "react";

type Props = { slug: string; title: string; meta: string };

export default function SignupForm({ slug, title, meta }: Props) {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    setError(null);
    setState("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          email,
          name: String(form.get("name") || ""),
          newsletter: form.get("newsletter") === "on",
          website: String(form.get("website") || ""),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.message || "Something went wrong. Please try again.");
        setState("idle");
        return;
      }
      setSentTo(email);
      setState("done");
    } catch {
      setError("We could not reach the server. Check your connection and try again.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="signup" role="status">
        <h3 className="serif">Check your inbox</h3>
        <p className="done">
          {title} is on its way to <strong>{sentTo}</strong>. If it has not arrived in a few minutes, look in your spam or promotions folder.
        </p>
      </div>
    );
  }

  return (
    <form className="signup" onSubmit={onSubmit} noValidate={false}>
      <div>
        <h3 className="serif">Get your free copy</h3>
        <p className="meta">{meta}</p>
      </div>
      <div>
        <label className="lbl" htmlFor={`name-${slug}`}>
          Your name
        </label>
        <input className="field" id={`name-${slug}`} name="name" type="text" autoComplete="name" maxLength={120} />
      </div>
      <div>
        <label className="lbl" htmlFor={`email-${slug}`}>
          Your email address
        </label>
        <input className="field" id={`email-${slug}`} name="email" type="email" autoComplete="email" required maxLength={320} />
      </div>
      <div className="hp" aria-hidden="true">
        <label htmlFor={`website-${slug}`}>Leave this field empty</label>
        <input id={`website-${slug}`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="consent">
        <input type="checkbox" name="newsletter" />
        <span>Also send me The Take Command Brief, a short newsletter once or twice a month. Unsubscribe any time.</span>
      </label>
      {error ? (
        <p className="note err" role="alert">
          {error}
        </p>
      ) : null}
      <button className="btn" type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Send it to me"}
      </button>
    </form>
  );
}
