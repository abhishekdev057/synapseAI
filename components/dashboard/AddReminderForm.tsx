"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";

const KINDS = ["medicine", "hydration", "activity", "appointment"] as const;

export function AddReminderForm({ patientId }: { patientId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState<(typeof KINDS)[number]>("medicine");
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("08:00");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !/^\d{2}:\d{2}$/.test(time)) return;
    setBusy(true);
    try {
      await fetch(`/api/patients/${patientId}/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, title, timesOfDay: [time], daysOfWeek: [] }),
      });
      setTitle("");
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        + Add reminder
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-2 rounded-xl border border-border bg-surface p-4">
      <select
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        value={kind}
        onChange={(e) => setKind(e.target.value as (typeof KINDS)[number])}
      >
        {KINDS.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>
      <input
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        placeholder="Title (e.g. White tablet)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        type="time"
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        value={time}
        onChange={(e) => setTime(e.target.value)}
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>
          Save
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
