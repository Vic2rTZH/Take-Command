"use client";

import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

type Props = {
  formAction: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
  pendingText: string;
  className?: string;
  disabled?: boolean;
  formNoValidate?: boolean;
};

/** A submit button that shows progress while its form action runs, and locks the other buttons in the same form. */
export default function PendingButton({ formAction, children, pendingText, className = "adm-btn", disabled, formNoValidate }: Props) {
  const { pending } = useFormStatus();
  const [clicked, setClicked] = useState(false);

  const [wasPending, setWasPending] = useState(pending);
  // Reset only when an action finishes (pending goes from true to false), adjusting state during render as React recommends.
  if (wasPending !== pending) {
    setWasPending(pending);
    if (!pending) setClicked(false);
  }

  const busy = pending && clicked;
  return (
    <button
      className={className}
      type="submit"
      formAction={formAction}
      formNoValidate={formNoValidate}
      disabled={disabled || pending}
      aria-busy={busy}
      onClick={() => setClicked(true)}
    >
      {busy ? (
        <>
          <span className="spin" aria-hidden="true" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/** A status line shown while any action in the form is running. */
export function PendingNotice({ text }: { text: string }) {
  const { pending } = useFormStatus();
  if (!pending) return null;
  return (
    <p className="notice working" role="status" aria-live="polite">
      <span className="spin" aria-hidden="true" />
      {text}
    </p>
  );
}
