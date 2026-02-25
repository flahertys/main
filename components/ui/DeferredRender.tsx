"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface DeferredRenderProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function DeferredRender({
  children,
  fallback = null,
  rootMargin = "320px",
  triggerOnce = true,
}: DeferredRenderProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = hostRef.current;
    if (!node || (triggerOnce && isVisible)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (triggerOnce) {
              observer.disconnect();
            }
            break;
          }
        }
      },
      { rootMargin },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [isVisible, rootMargin, triggerOnce]);

  return <div ref={hostRef}>{isVisible ? children : fallback}</div>;
}
