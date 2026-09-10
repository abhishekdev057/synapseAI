import { NextResponse } from "next/server";
import { z } from "zod";
import { getRecentSessions, recordSession } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = new URL(req.url).searchParams.get("game") ?? undefined;
  const rows = await getRecentSessions(id, game, 30);
  return NextResponse.json({ sessions: rows });
}

const RecordBody = z.object({
  gameKey: z.string().min(1),
  domain: z.enum([
    "memory",
    "attention",
    "routine_recall",
    "pattern_recognition",
    "engagement",
    "language",
  ]),
  difficulty: z.number().int().min(1).max(10),
  accuracy: z.number().min(0).max(1),
  reactionTimeMs: z.number().int().positive().optional(),
  hintsUsed: z.number().int().min(0).optional(),
  roundsCompleted: z.number().int().min(0).optional(),
  completed: z.boolean().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = RecordBody.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const result = await recordSession({ patientId: id, ...parsed.data });
  return NextResponse.json(result, { status: 201 });
}
