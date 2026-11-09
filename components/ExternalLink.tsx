import type { ReactNode } from "react";

export function ExternalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      {children} <span aria-hidden="true">↗</span>
      <span className="sr"> (opens IACCDB in a new tab)</span>
    </a>
  );
}
