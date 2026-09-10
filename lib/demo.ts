import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { patients } from "@/db/schema";

/**
 * The scaffold has no auth yet. These helpers resolve "which patient" for the
 * demo: an explicit ?p=<id> wins, otherwise the first patient by name.
 */
export async function resolvePatientId(searchParams?: {
  p?: string | string[];
}): Promise<string | null> {
  const explicit = Array.isArray(searchParams?.p)
    ? searchParams?.p[0]
    : searchParams?.p;
  if (explicit) return explicit;
  const [first] = await db
    .select({ id: patients.id })
    .from(patients)
    .orderBy(asc(patients.name))
    .limit(1);
  return first?.id ?? null;
}

export async function allPatientsBrief() {
  return db
    .select({ id: patients.id, name: patients.name, region: patients.region })
    .from(patients)
    .orderBy(asc(patients.name));
}
