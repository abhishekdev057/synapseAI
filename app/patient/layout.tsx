import { LanguageSwitcher } from "@/components/patient/LanguageSwitcher";
import { PatientBottomNav } from "@/components/patient/BottomNav";
import { Brand } from "@/components/Brand";
import { resolvePatientLang } from "@/lib/patient-lang";

export const dynamic = "force-dynamic";

export default async function PatientLayout({
  children,
}: LayoutProps<"/patient">) {
  const { code } = await resolvePatientLang();

  return (
    <div className="patient-scope flex min-h-full flex-1 flex-col bg-background">
      <header className="border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <Brand href="/patient" size="sm" />
          <LanguageSwitcher current={code} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-6">{children}</main>
      <PatientBottomNav />
    </div>
  );
}
