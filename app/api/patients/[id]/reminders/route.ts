import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { reminders } from "@/db/schema";
import { listReminders } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ reminders: await listReminders(id) });
}

const CreateReminder = z.object({
  kind: z.enum(["medicine", "hydration", "activity", "appointment"]),
  title: z.string().min(1),
  description: z.string().optional(),
  timesOfDay: z.array(z.string().regex(/^\d{2}:\d{2}$/)).min(1),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),
  medicinePhotoUrl: z.string().url().optional(),
  active: z.boolean().default(true),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = CreateReminder.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [row] = await db
    .insert(reminders)
    .values({ patientId: id, ...parsed.data })
    .returning();
  return NextResponse.json({ reminder: row }, { status: 201 });
}
