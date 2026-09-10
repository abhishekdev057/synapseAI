"use client";

import { useEffect, useState } from "react";

/** Large live clock for the orientation home screen. */
export function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Client-only value: render null on the server, hydrate to the real time
    // after mount, then tick.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000 * 20);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return <div className="h-28" aria-hidden />;
  }

  const time = now.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const date = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const partOfDay =
    now.getHours() < 12
      ? "morning"
      : now.getHours() < 17
        ? "afternoon"
        : "evening";

  return (
    <div className="text-center">
      <div className="sy-pop-in text-[3.5rem] font-extrabold leading-none tracking-tight tabular-nums text-navy">
        {time}
      </div>
      <div className="mt-3 text-2xl font-medium">{date}</div>
      <div className="mt-1 text-lg text-muted">It is {partOfDay} now.</div>
    </div>
  );
}
