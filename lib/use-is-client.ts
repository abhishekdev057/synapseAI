"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * `false` during SSR and the first client render, `true` afterwards. The
 * React-blessed way to branch on browser-only capabilities (speech APIs,
 * `navigator.deviceMemory`, …) without tripping a hydration mismatch — and
 * without a `setState`-in-effect.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
