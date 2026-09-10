import Link from "next/link";
import { StatusDot } from "@/components/ui";
import { listPatientsWithStatus } from "@/lib/queries";

export const dynamic = "force-dynamic";

const STATUS_LABEL = {
  red: "Needs attention",
  amber: "Watch",
  green: "Stable",
} as const;

export default async function ClinicianList() {
  const patients = await listPatientsWithStatus();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Patients</h1>
        <p className="text-sm text-muted">
          {patients.length} patients · sorted by priority. Traffic light combines
          open alerts and cognitive-decline detection.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Patient</th>
              <th className="px-4 py-3 font-medium">Region</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Alerts</th>
              <th className="px-4 py-3 font-medium">Games 7d</th>
              <th className="px-4 py-3 font-medium">Flagged area</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id} className="border-t border-border hover:bg-surface">
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <StatusDot status={p.status} />
                    <span className="text-xs text-muted">
                      {STATUS_LABEL[p.status]}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/clinician/${p.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {p.name}
                  </Link>
                  <div className="text-xs text-muted">
                    {p.ageYears ? `${p.ageYears} yrs` : ""}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{p.region ?? "—"}</td>
                <td className="px-4 py-3">{p.cognitiveStage}</td>
                <td className="px-4 py-3">
                  {p.openAlerts}
                  {p.criticalAlerts > 0 ? (
                    <span className="ml-1 text-xs text-[color:var(--red)]">
                      ({p.criticalAlerts} critical)
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3">{p.sessionsLast7d}</td>
                <td className="px-4 py-3 text-muted">
                  {p.worstDomain ? p.worstDomain.label : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
