import { NextResponse } from "next/server";
import { getDomainTrends } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trends = await getDomainTrends(id);
  return NextResponse.json({ trends });
}
