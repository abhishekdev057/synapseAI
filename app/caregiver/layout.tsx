import { Brand } from "@/components/Brand";

export default function CaregiverLayout({
  children,
}: LayoutProps<"/caregiver">) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Brand size="sm" />
          <span className="text-sm font-medium text-muted">Family dashboard</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
