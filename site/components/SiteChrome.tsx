/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import NewsletterForm from "./NewsletterForm";

export function SiteHeader({ current, cta }: { current?: "home" | "resources"; cta?: { href: string; label: string } }) {
  return (
    <header className="wrap site-header">
      <Link href="/" className="brand" aria-label="Victor Simz, Take Command: home">
        <img className="logo" src="/brand/vs-logo.png" alt="" width={60} height={60} />
        <img className="sig" src="/brand/signature.png" alt="Victor Simz" width={170} height={84} />
      </Link>
      <nav className="site-nav" aria-label="Main">
        <Link className="navlink" href="/" aria-current={current === "home" ? "page" : undefined}>
          Home
        </Link>
        <Link className="navlink" href="/resources" aria-current={current === "resources" ? "page" : undefined}>
          Free resources
        </Link>
        {cta ? (
          <a className="btn small" href={cta.href}>
            {cta.label}
          </a>
        ) : null}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap nl">
        <div className="nl-text">
          <p className="eyebrow">Newsletter</p>
          <h2 className="serif">The Take Command Brief</h2>
          <p>One page with a few action points, once or twice a month. Unsubscribe any time.</p>
        </div>
        <NewsletterForm />
      </div>
      <div className="wrap foot-base">
        <span className="mark">
          <img src="/brand/vs-logo.png" alt="" width={36} height={36} />© {new Date().getFullYear()} Victor Simz. All rights reserved.
        </span>
        <span>Facebook · Instagram · X: @vsimz1</span>
      </div>
    </footer>
  );
}
