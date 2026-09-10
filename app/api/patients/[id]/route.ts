import { NextResponse } from "next/server";
import { getPatient } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ patient });
}
