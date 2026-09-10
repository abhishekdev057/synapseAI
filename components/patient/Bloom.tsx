"use client";

import { SparkBurst } from "@/components/patient/Motion";

/**
 * The celebration shown when a game round finishes — a green disc that blooms
 * open with a drawn tick, a ring of soft petals, and a short spark burst.
 * Pure SVG + CSS (keyframes in globals.css); collapses to a plain circle + tick
 * under `prefers-reduced-motion`. Fully offline, no dependency.
 */
export function Bloom({ size = 176 }: { size?: number }) {
  const petals = Array.from({ length: 8 }, (_, i) => i);
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* expanding ring */}
      <span
        className="sy-bloom-ring absolute rounded-full"
        style={{
          width: "58%",
          height: "58%",
          border: "4px solid var(--primary)",
          animation: "sy-ring 0.9s cubic-bezier(0.22,1,0.36,1) forwards",
        }}
      />

      {/* petal ring */}
      <span
        className="absolute inset-0"
        style={{ animation: "sy-spin 14s linear infinite" }}
      >
        {petals.map((i) => (
          <span
            key={i}
            className="sy-bloom-petal absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: "22%",
              height: "22%",
              background:
                i % 2 === 0 ? "var(--tint-peach)" : "var(--tint-cream)",
              transform: `rotate(${i * 45}deg) translateY(-${size * 0.34}px)`,
              transformOrigin: "center",
              animation: `sy-petal 0.5s ${0.12 + i * 0.04}s cubic-bezier(0.22,1,0.36,1) both`,
            }}
          />
        ))}
      </span>

      {/* core disc + tick */}
      <svg
        viewBox="0 0 100 100"
        className="relative"
        style={{ width: "62%", height: "62%" }}
      >
        <circle
          className="sy-bloom-core"
          cx="50"
          cy="50"
          r="46"
          fill="var(--primary)"
          style={{
            transformOrigin: "50px 50px",
            animation: "sy-scale-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
          }}
        />
        <path
          className="sy-bloom-check"
          d="M30 51 L44 65 L72 33"
          fill="none"
          stroke="#fff"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 80,
            strokeDashoffset: 80,
            animation: "sy-check 0.45s 0.35s cubic-bezier(0.65,0,0.45,1) forwards",
          }}
        />
      </svg>

      <SparkBurst className="sy-bloom-spark" />
    </span>
  );
}
