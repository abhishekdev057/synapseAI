import { NextResponse } from "next/server";
import { getTodayReminders } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ occurrences: await getTodayReminders(id) });
}
