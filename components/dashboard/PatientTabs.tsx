import Link from "next/link";
import { cn } from "@/lib/utils";

/** Patient switcher for the dashboards (no auth in the scaffold). */
export function PatientTabs({
  base,
  patients,
  activeId,
}: {
  base: string;
  patients: { id: string; name: string; region: string | null }[];
  activeId: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {patients.map((p) => (
        <Link
          key={p.id}
          href={`${base}?p=${p.id}`}
          className={cn(
            "rounded-xl border px-3 py-2 text-sm",
            p.id === activeId
              ? "border-primary bg-primary/10 font-medium text-primary"
              : "border-border bg-surface text-muted",
          )}
        >
          {p.name}
          {p.region ? <span className="ml-1 text-xs opacity-70">· {p.region}</span> : null}
        </Link>
      ))}
    </div>
  );
}
