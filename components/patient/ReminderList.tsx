"use client";

import { useState } from "react";
import { Check, Clock3 } from "lucide-react";
import { SpeakButton } from "@/components/patient/SpeakButton";
import { CheckDraw } from "@/components/patient/Motion";
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
    return (
      <div className="sy-card flex flex-col items-center gap-3 p-10 text-center">
        <CheckDraw size={64} />
        <p className="text-xl text-muted">{t.noRemindersToday}</p>
      </div>
    );
  }

  return (
    <ul className="sy-stagger space-y-4">
      {items.map((o) => {
        const key = o.reminderId + o.time;
        const done = o.status === "done";
        return (
          <li
            key={key}
            className={`sy-card p-5 transition ${
              done ? "border-status-green/40 bg-status-green/5" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span
                  className="sy-medallion flex h-14 w-14 shrink-0 items-center justify-center text-3xl"
                  aria-hidden
                >
                  {KIND_EMOJI[o.kind] ?? "🔔"}
                </span>
                <div>
                  <p className="text-2xl font-bold text-navy">{o.title}</p>
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
                iconOnly
                className="sy-press inline-flex shrink-0 items-center rounded-xl border border-border bg-surface px-3 py-2 text-muted"
              />
            </div>

            {done ? (
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-status-green/10 px-4 py-3">
                <CheckDraw size={36} />
                <span className="text-lg font-bold text-status-green">
                  {t.done}
                </span>
              </div>
            ) : (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => log(o, "done")}
                  disabled={busy === key}
                  className="sy-press flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-5 text-xl font-bold text-primary-fg shadow-[0_10px_28px_rgba(44,138,81,0.28)] disabled:opacity-50"
                >
                  <Check className="h-7 w-7" strokeWidth={3} /> {t.done}
                </button>
                <button
                  onClick={() => log(o, "snoozed")}
                  disabled={busy === key}
                  className="sy-press flex items-center justify-center gap-2 rounded-2xl border-2 border-border bg-surface px-5 py-5 text-lg font-semibold disabled:opacity-50"
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
