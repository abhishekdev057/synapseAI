import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { patients } from "@/db/schema";
import { listPatientsWithStatus } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await listPatientsWithStatus();
  return NextResponse.json({ patients: rows });
}

const CreatePatient = z.object({
  name: z.string().min(1),
  ageYears: z.number().int().positive().optional(),
  sex: z.string().optional(),
  language: z.string().default("as"),
  region: z.string().optional(),
  cognitiveStage: z.enum(["mild", "moderate", "severe"]).default("mild"),
  primaryClinicianId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  const parsed = CreatePatient.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [row] = await db.insert(patients).values(parsed.data).returning();
  return NextResponse.json({ patient: row }, { status: 201 });
}
