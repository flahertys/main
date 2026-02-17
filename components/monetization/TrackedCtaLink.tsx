"use client";

import { trackServiceConversion, type ServiceConversionId } from "@/lib/service-conversions";
import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";

interface TrackedCtaLinkProps {
  href: string;
  conversionId: ServiceConversionId;
  surface: string;
  children: ReactNode;
  className?: string;
  external?: boolean;
  rel?: string;
  target?: string;
  ariaLabel?: string;
  title?: string;
}

export function TrackedCtaLink({
  href,
  conversionId,
  surface,
  children,
  className,
  external = false,
  rel,
  target,
  ariaLabel,
  title,
}: TrackedCtaLinkProps) {
  const isExternal =
    external ||
    href.startsWith("http") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("sms:");
  const computedTarget = target ?? (href.startsWith("http") ? "_blank" : undefined);
  const computedRel =
    rel ?? (computedTarget === "_blank" ? "noopener noreferrer" : undefined);

  const handleClick = (_event: MouseEvent<HTMLAnchorElement>) => {
    trackServiceConversion(conversionId, surface);
  };

  if (isExternal) {
    return (
      <a
        href={href}
        className={className}
        target={computedTarget}
        rel={computedRel}
        onClick={handleClick}
        aria-label={ariaLabel}
        title={title}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={className}
      onClick={handleClick}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </Link>
  );
}
