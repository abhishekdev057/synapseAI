"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";

interface ApkInfo {
  sizeBytes: number;
  builtAt: string;
  versionName?: string;
}

/**
 * "Get the Android app" card. Links to the APK that the Android Gradle build
 * drops into /public/downloads on every `assembleDebug`.
 */
export function ApkDownload({ compact = false }: { compact?: boolean }) {
  const [info, setInfo] = useState<ApkInfo | null>(null);

  useEffect(() => {
    fetch("/downloads/apk-info.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setInfo)
      .catch(() => {});
  }, []);

  const mb = info ? (info.sizeBytes / 1_048_576).toFixed(1) : null;
  const built = info
    ? new Date(info.builtAt).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <div
      className={`rounded-2xl border border-border bg-surface p-5 ${
        compact ? "" : "sm:flex sm:items-center sm:gap-5"
      }`}
    >
      <div className="flex flex-1 items-start gap-4">
        <Smartphone className="h-8 w-8 shrink-0 text-primary" strokeWidth={1.75} />
        <div>
          <p className="font-semibold">Android patient app</p>
          <p className="text-sm text-muted">
            Install on a phone or tablet.
            {mb ? ` ${mb} MB` : ""}
            {info?.versionName ? ` · v${info.versionName}` : ""}
          </p>
          {built ? (
            <p className="text-xs text-muted">Build attached {built}</p>
          ) : null}
          <p className="mt-1 text-xs text-muted">
            On the device, allow &ldquo;Install unknown apps&rdquo; for your
            browser when prompted.
          </p>
        </div>
      </div>
      <a
        href="/downloads/synapse-patient.apk"
        download
        className={`mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-fg hover:opacity-90 sm:mt-0 ${
          compact ? "w-full" : ""
        }`}
      >
        <Download className="h-5 w-5" />
        Download APK
      </a>
    </div>
  );
}
