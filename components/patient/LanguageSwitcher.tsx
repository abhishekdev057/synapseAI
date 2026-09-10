"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Languages } from "lucide-react";
import { LANGUAGES } from "@/lib/languages";
import { LANG_COOKIE } from "@/lib/i18n";

const ENTRIES = Object.entries(LANGUAGES);

function persistLang(code: string) {
  try {
    document.cookie = `${LANG_COOKIE}=${code}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    /* private mode / blocked cookies — the choice just won't persist */
  }
}

export function LanguageSwitcher({ current }: { current: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  function pick(code: string) {
    persistLang(code);
    setOpen(false);
    startTransition(() => router.refresh());
  }

  const label = LANGUAGES[current]?.nativeName ?? "Language";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-base font-medium"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Languages className="h-5 w-5" />
        {label}
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 z-20 mt-2 max-h-80 w-56 overflow-auto rounded-xl border border-border bg-surface py-1 shadow-lg"
        >
          {ENTRIES.map(([code, l]) => (
            <li key={code}>
              <button
                onClick={() => pick(code)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-base hover:bg-background"
                role="option"
                aria-selected={code === current}
              >
                <span>
                  {l.nativeName}
                  <span className="ml-2 text-sm text-muted">{l.name}</span>
                </span>
                {code === current ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
