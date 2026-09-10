"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

interface AlertT {
  id: string;
  kind: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  status: "open" | "acknowledged" | "resolved";
  createdAt: string | Date;
  acknowledgedBy: string | null;
}

const tone = { info: "green", warning: "amber", critical: "red" } as const;

export function AlertRow({ alert, by }: { alert: AlertT; by: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(alert.status);

  async function update(next: "acknowledged" | "resolved") {
    setBusy(true);
    try {
      await fetch(`/api/alerts/${alert.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, by }),
      });
      setStatus(next);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone={tone[alert.severity]}>{alert.severity}</Badge>
            <span className="font-medium">{alert.title}</span>
          </div>
          <p className="mt-1 text-sm text-muted">{alert.message}</p>
          <p className="mt-1 text-xs text-muted">
            {fmtDate(alert.createdAt)}
            {status !== "open" ? ` · ${status}` : ""}
            {alert.acknowledgedBy ? ` by ${alert.acknowledgedBy}` : ""}
          </p>
        </div>
        {status === "open" && (
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => update("acknowledged")}
              disabled={busy}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
            >
              Acknowledge
            </button>
            <button
              onClick={() => update("resolved")}
              disabled={busy}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-fg disabled:opacity-50"
            >
              Resolve
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
