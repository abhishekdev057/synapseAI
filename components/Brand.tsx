import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Synapse AI wordmark: brain-circuit logo + "SYNAPSE" (navy) / "AI" (green),
 * matching the product one-pager. `tagline` shows the "Play · Remember · Stay
 * Connected" line under the wordmark.
 */
export function Brand({
  href = "/",
  size = "md",
  tagline = false,
  className,
}: {
  href?: string | null;
  size?: "sm" | "md" | "lg";
  tagline?: boolean;
  className?: string;
}) {
  const h = size === "lg" ? 48 : size === "sm" ? 30 : 38;
  const w = Math.round(h * 1.076);
  const text =
    size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-xl";

  const inner = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/synapse-logo.png"
        alt="Synapse AI"
        width={w}
        height={h}
        priority
        className="shrink-0"
      />
      <span className="inline-flex flex-col leading-none">
        <span className={cn("font-extrabold tracking-tight", text)}>
          <span className="text-navy">SYNAPSE</span>{" "}
          <span className="text-primary">AI</span>
        </span>
        {tagline ? (
          <span className="mt-1 text-[0.68em] font-medium tracking-wide text-muted">
            Play · Remember · Stay Connected
          </span>
        ) : null}
      </span>
    </span>
  );

  if (href === null) return inner;
  return (
    <Link href={href} className="inline-flex">
      {inner}
    </Link>
  );
}
