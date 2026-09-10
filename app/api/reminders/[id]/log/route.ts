import { NextResponse } from "next/server";
import { z } from "zod";
import { logReminder } from "@/lib/queries";

export const dynamic = "force-dynamic";

const LogBody = z.object({
  patientId: z.string().uuid(),
  status: z.enum(["done", "missed", "snoozed"]),
  scheduledFor: z.string().datetime(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = LogBody.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const row = await logReminder(
    id,
    parsed.data.patientId,
    parsed.data.status,
    new Date(parsed.data.scheduledFor),
  );
  return NextResponse.json({ log: row }, { status: 201 });
}
