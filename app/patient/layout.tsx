import Link from "next/link";
import { Home } from "lucide-react";

export default function PatientLayout({ children }: LayoutProps<"/patient">) {
  return (
    <div className="patient-scope flex min-h-full flex-1 flex-col bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-4">
          <span className="text-xl font-bold text-primary">Synapse</span>
          <Link
            href="/patient"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-base font-medium"
          >
            <Home className="h-5 w-5" /> Home
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-6">{children}</main>
    </div>
  );
}
