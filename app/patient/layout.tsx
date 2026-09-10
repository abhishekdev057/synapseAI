import Link from "next/link";
import { Home } from "lucide-react";
import { LanguageSwitcher } from "@/components/patient/LanguageSwitcher";
import { resolvePatientLang } from "@/lib/patient-lang";

export const dynamic = "force-dynamic";

export default async function PatientLayout({
  children,
}: LayoutProps<"/patient">) {
  const { code } = await resolvePatientLang();

  return (
    <div className="patient-scope flex min-h-full flex-1 flex-col bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <span className="text-xl font-bold text-primary">Synapse</span>
          <div className="flex items-center gap-2">
            <LanguageSwitcher current={code} />
            <Link
              href="/patient"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-base font-medium"
            >
              <Home className="h-5 w-5" /> Home
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-6">{children}</main>
    </div>
  );
}
