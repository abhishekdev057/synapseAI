import { NextResponse } from "next/server";
import { z } from "zod";
import { addContact, listContacts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ contacts: await listContacts(id) });
}

const CreateContact = z.object({
  name: z.string().min(1),
  relationship: z.string().min(1),
  photoUrl: z.string().url().optional(),
  voiceClipUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = CreateContact.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const row = await addContact({ patientId: id, ...parsed.data });
  return NextResponse.json({ contact: row }, { status: 201 });
}
