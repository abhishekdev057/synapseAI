"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";

export function AddContactForm({ patientId }: { patientId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [notes, setNotes] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !relationship) return;
    setBusy(true);
    try {
      await fetch(`/api/patients/${patientId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, relationship, notes: notes || undefined }),
      });
      setName("");
      setRelationship("");
      setNotes("");
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        + Add family member
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-2 rounded-xl border border-border bg-surface p-4">
      <input
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        placeholder="Relationship (e.g. Daughter)"
        value={relationship}
        onChange={(e) => setRelationship(e.target.value)}
      />
      <input
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        placeholder="Note (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>
          Save
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
