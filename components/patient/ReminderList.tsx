"use client";

import { useState } from "react";
import { Check, Clock3 } from "lucide-react";
import { SpeakButton } from "@/components/patient/SpeakButton";
import { fmt, type Dict } from "@/lib/i18n";
import { fmtTime } from "@/lib/utils";

interface Occurrence {
  reminderId: string;
  kind: string;
  title: string;
  description: string | null;
  medicinePhotoUrl: string | null;
  time: string;
  scheduledFor: string;
  status: string;
}

const KIND_EMOJI: Record<string, string> = {
  medicine: "💊",
  hydration: "💧",
  activity: "🚶",
  appointment: "🏥",
};

export function ReminderList({
  patientId,
  speechTag,
  dict: t,
  initial,
}: {
  patientId: string;
  speechTag: string;
  dict: Dict;
  initial: Occurrence[];
}) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function log(o: Occurrence, status: "done" | "snoozed") {
    setBusy(o.reminderId + o.time);
    try {
      await fetch(`/api/reminders/${o.reminderId}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          status,
          scheduledFor: o.scheduledFor,
        }),
      });
      setItems((prev) =>
        prev.map((x) =>
          x.reminderId === o.reminderId && x.time === o.time
            ? { ...x, status }
            : x,
        ),
      );
    } finally {
      setBusy(null);
    }
  }

  if (items.length === 0) {
    return <p className="text-xl text-muted">{t.noRemindersToday}</p>;
  }

  return (
    <ul className="space-y-4">
      {items.map((o) => {
        const key = o.reminderId + o.time;
        const done = o.status === "done";
        return (
          <li
            key={key}
            className={`rounded-2xl border p-5 ${
              done ? "border-status-green/40 bg-status-green/5" : "border-border bg-surface"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="text-4xl" aria-hidden>
                  {KIND_EMOJI[o.kind] ?? "🔔"}
                </span>
                <div>
                  <p className="text-2xl font-semibold">{o.title}</p>
                  <p className="text-lg text-muted">
                    {fmt(t.atTime, { time: fmtTime(o.scheduledFor) })}
                  </p>
                  {o.description ? (
                    <p className="mt-1 text-base text-muted">{o.description}</p>
                  ) : null}
                </div>
              </div>
              <SpeakButton
                text={`${o.title}. ${o.description ?? ""}`}
                lang={speechTag}
                label={t.hear}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm"
              />
            </div>

            {done ? (
              <p className="mt-4 inline-flex items-center gap-2 text-lg font-semibold text-status-green">
                <Check className="h-6 w-6" /> {t.done}
              </p>
            ) : (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => log(o, "done")}
                  disabled={busy === key}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-5 text-xl font-semibold text-primary-fg disabled:opacity-50"
                >
                  <Check className="h-7 w-7" /> {t.done}
                </button>
                <button
                  onClick={() => log(o, "snoozed")}
                  disabled={busy === key}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-5 text-lg font-medium disabled:opacity-50"
                >
                  <Clock3 className="h-6 w-6" /> {t.later}
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
