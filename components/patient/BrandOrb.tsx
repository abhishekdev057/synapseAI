"use client";

/**
 * The Synapse mark as a living illustration: a breathing green core, a faint
 * halo, and three coloured nodes drifting around it — the "connected synapses"
 * idea. Pure SVG + CSS, offline, and it holds still under reduced-motion.
 */
export function BrandOrb({ size = 72, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      <circle
        cx="50"
        cy="50"
        r="44"
        fill="var(--primary)"
        opacity="0.12"
        className="sy-orb-core"
        style={{ transformOrigin: "50px 50px", animation: "sy-breathe 4.5s ease-in-out infinite" }}
      />
      <circle
        cx="50"
        cy="50"
        r="26"
        fill="var(--primary)"
        className="sy-orb-core"
        style={{ transformOrigin: "50px 50px", animation: "sy-breathe 4.5s ease-in-out infinite" }}
      />
      <g
        className="sy-orb-spin"
        style={{ transformOrigin: "50px 50px", animation: "sy-spin 12s linear infinite" }}
      >
        <line x1="50" y1="50" x2="50" y2="14" stroke="var(--navy)" strokeWidth="2" opacity="0.25" />
        <line x1="50" y1="50" x2="81" y2="68" stroke="var(--mustard)" strokeWidth="2" opacity="0.25" />
        <line x1="50" y1="50" x2="19" y2="68" stroke="var(--info)" strokeWidth="2" opacity="0.25" />
        <circle cx="50" cy="14" r="7" fill="var(--navy)" />
        <circle cx="81" cy="68" r="6" fill="var(--mustard)" />
        <circle cx="19" cy="68" r="5" fill="var(--info)" />
      </g>
    </svg>
  );
}
