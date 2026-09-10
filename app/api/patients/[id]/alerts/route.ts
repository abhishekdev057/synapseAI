import { NextResponse } from "next/server";
import { listAlerts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ alerts: await listAlerts(id) });
}
