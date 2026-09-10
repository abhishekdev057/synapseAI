import { NextResponse } from "next/server";
import { z } from "zod";
import { updateAlert } from "@/lib/queries";

export const dynamic = "force-dynamic";

const PatchBody = z.object({
  status: z.enum(["open", "acknowledged", "resolved"]),
  by: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = PatchBody.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const row = await updateAlert(id, parsed.data.status, parsed.data.by);
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ alert: row });
}
