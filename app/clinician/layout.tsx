import Link from "next/link";

export default function ClinicianLayout({
  children,
}: LayoutProps<"/clinician">) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold text-primary">
            Synapse
          </Link>
          <span className="text-sm text-muted">Clinician dashboard</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
