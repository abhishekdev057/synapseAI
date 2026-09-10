import { NextResponse } from "next/server";
import { recommendDifficulty } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = new URL(req.url).searchParams.get("game") ?? "memory_lane";
  const decision = await recommendDifficulty(id, game);
  return NextResponse.json({ game, ...decision });
}
