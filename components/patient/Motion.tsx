"use client";

import { cn } from "@/lib/utils";

/**
 * Small, self-contained SVG/CSS animations for the patient app's quieter
 * moments. Pure CSS keyframes (declared in globals.css) so they cost nothing,
 * work offline, and go still under `prefers-reduced-motion`.
 */

/** Animated tick that draws itself inside a filled circle. */
export function CheckDraw({
  size = 72,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      className={cn("sy-pop-in", className)}
      aria-hidden
    >
      <circle cx="36" cy="36" r="34" fill="var(--primary)" />
      <path
        d="M22 37.5 L32 47 L51 26"
        fill="none"
        stroke="#fff"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 60,
          strokeDashoffset: 60,
          animation: "sy-check 0.5s 0.15s cubic-bezier(0.65,0,0.45,1) forwards",
        }}
      />
    </svg>
  );
}

/** Concentric rings pulsing outward — the "I'm listening" state. */
export function PulseRings({
  size = 96,
  color = "var(--primary)",
  className,
  children,
}: {
  size?: number;
  color?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute inset-0 rounded-full"
          style={{
            border: `3px solid ${color}`,
            animation: `sy-ring 1.8s ${i * 0.6}s cubic-bezier(0.22,1,0.36,1) infinite`,
          }}
        />
      ))}
      <span
        className="relative inline-flex items-center justify-center rounded-full"
        style={{ width: "58%", height: "58%", background: color, color: "#fff" }}
      >
        {children}
      </span>
    </span>
  );
}

/** Equaliser bars — the speaking indicator. */
export function Waveform({
  bars = 4,
  className,
  color = "currentColor",
}: {
  bars?: number;
  className?: string;
  color?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-[3px]", className)}
      aria-hidden
    >
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          style={{
            width: 3,
            height: 16,
            borderRadius: 9999,
            background: color,
            transformOrigin: "center",
            animation: `sy-bar 0.9s ${i * 0.12}s ease-in-out infinite`,
          }}
        />
      ))}
    </span>
  );
}

/** Three dots bouncing — inline loading. */
export function LoadingDots({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-end gap-1.5", className)} aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2.5 w-2.5 rounded-full bg-primary"
          style={{ animation: `sy-bar 0.7s ${i * 0.12}s ease-in-out infinite` }}
        />
      ))}
    </span>
  );
}

/** A short burst of sparks — layered over a celebration. */
export function SparkBurst({ className }: { className?: string }) {
  const specs = [
    { a: -90, d: 78, s: 10, c: "var(--mustard)" },
    { a: -30, d: 92, s: 8, c: "var(--info)" },
    { a: 25, d: 74, s: 9, c: "var(--navy)" },
    { a: 90, d: 88, s: 7, c: "var(--mustard)" },
    { a: 150, d: 80, s: 8, c: "var(--info)" },
    { a: -150, d: 70, s: 6, c: "var(--primary)" },
  ];
  return (
    <span
      className={cn("pointer-events-none absolute inset-0", className)}
      aria-hidden
    >
      {specs.map((sp, i) => {
        const rad = (sp.a * Math.PI) / 180;
        return (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: sp.s,
              height: sp.s,
              background: sp.c,
              // @ts-expect-error custom props for the keyframe
              "--tx": `${Math.cos(rad) * sp.d}px`,
              "--ty": `${Math.sin(rad) * sp.d}px`,
              animation: `sy-spark 0.9s ${0.05 * i}s cubic-bezier(0.22,1,0.36,1) forwards`,
              translate: "-50% -50%",
            }}
          />
        );
      })}
    </span>
  );
}
