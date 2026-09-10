import Link from "next/link";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface p-5 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-3">
      <h2 className="text-lg font-semibold">{children}</h2>
      {hint ? <p className="text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {sub ? <div className="text-xs text-muted">{sub}</div> : null}
    </div>
  );
}

const statusColor = {
  green: "bg-status-green",
  amber: "bg-status-amber",
  red: "bg-status-red",
} as const;

export function StatusDot({
  status,
  className,
}: {
  status: "green" | "amber" | "red";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block h-3 w-3 rounded-full",
        statusColor[status],
        className,
      )}
      aria-label={status}
    />
  );
}

const badgeTone = {
  neutral: "bg-border text-foreground",
  primary: "bg-primary/10 text-primary",
  amber: "bg-status-amber/15 text-[color:var(--mustard)]",
  red: "bg-status-red/15 text-[color:var(--red)]",
  green: "bg-status-green/15 text-[color:var(--green)]",
} as const;

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: keyof typeof badgeTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeTone[tone],
      )}
    >
      {children}
    </span>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-50";
  const variants = {
    primary: "bg-primary text-primary-fg hover:opacity-90",
    secondary: "border border-border bg-surface hover:bg-background",
    ghost: "hover:bg-background",
  };
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

export function LinkButton({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  children: React.ReactNode;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition";
  const variants = {
    primary: "bg-primary text-primary-fg hover:opacity-90",
    secondary: "border border-border bg-surface hover:bg-background",
    ghost: "hover:bg-background",
  };
  return (
    <Link href={href} className={cn(base, variants[variant], className)}>
      {children}
    </Link>
  );
}
