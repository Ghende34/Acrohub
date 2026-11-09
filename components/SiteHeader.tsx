"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Contests", match: (path: string) => path === "/" || path.startsWith("/contests") },
  { href: "/pilots", label: "Pilots", match: (path: string) => path.startsWith("/pilots") },
  { href: "/judges", label: "Judges", match: (path: string) => path.startsWith("/judges") },
  { href: "/stats", label: "Stats", match: (path: string) => path.startsWith("/stats") },
  { href: "/leaders", label: "Regions", match: (path: string) => path.startsWith("/leaders") },
  { href: "/watch", label: "Watch", match: (path: string) => path.startsWith("/watch") },
];

export function SiteHeader() {
  const path = usePathname();
  return (
    <header className="site-header">
      <a className="skip" href="#content">
        Skip to content
      </a>
      <div className="wrap header-inner">
        <Link href="/" className="brand">
          <Mark />
          <span>
            Acro<span className="accent">hub</span>
          </span>
        </Link>
        <nav aria-label="Primary">
          <div className="nav">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} aria-current={link.match(path) ? "page" : undefined}>
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}

function Mark() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M5 23h22" stroke="#E31C23" strokeWidth="2" />
      <path d="M8 23 L16 7 L24 23" fill="none" stroke="#f4f6fb" strokeWidth="1.7" />
      <path d="M12 17.5h8" stroke="#E31C23" strokeWidth="1.7" />
    </svg>
  );
}
