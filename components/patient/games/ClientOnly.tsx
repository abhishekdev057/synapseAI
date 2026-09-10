"use client";

import { useIsClient } from "@/lib/use-is-client";

/**
 * Renders `children` only from the second client render onward. The games build
 * their boards with `Math.random()`, so server HTML can never match the client;
 * skipping SSR for them removes the hydration mismatch entirely (and costs
 * nothing — a shuffled game board has no SEO or first-paint value).
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return <>{useIsClient() ? children : fallback}</>;
}
