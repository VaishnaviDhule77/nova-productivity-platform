"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { initials, avatarColor } from "@/lib/utils";
import type { Member } from "@/lib/utils";

export function MemberManager({ projectId, members, isOwner, ownerId }: {
  projectId: string;
  members: Member[];
  isOwner: boolean;
  ownerId: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/projects/${projectId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (res.ok) setEmail("");
    else setError(data.error ?? "Could not add member");
    setLoading(false);
    router.refresh();
  }

  async function remove(userId: string) {
    if (!confirm("Remove this member from the project?")) return;
    await fetch(`/api/projects/${projectId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    router.refresh();
  }

  return (
    <div className="surface p-5">
      <h2 className="meta">Crew — {String(members.length).padStart(2, "0")}</h2>

      <ul className="mt-3">
        {members.map((m) => (
          <li key={m.id} className="group flex items-center justify-between gap-2 border-b border-white/[0.05] py-3 last:border-0">
            <div className="flex min-w-0 items-center gap-3">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[9px] font-bold ${avatarColor(m.name)}`}>
                {initials(m.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-200">{m.name}</p>
                <p className="f-mono truncate text-[9px] uppercase tracking-wider text-zinc-600">{m.email}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={`tag ${m.role === "OWNER" ? "border-[#FFB454]/40 text-[#FFB454]" : "border-white/15 text-zinc-400"}`}>
                {m.role === "OWNER" ? "Owner" : "Member"}
              </span>
              {isOwner && m.id !== ownerId && (
                <button
                  onClick={() => remove(m.id)}
                  title="Remove member"
                  className="flex h-6 w-6 items-center justify-center rounded-md text-xs text-zinc-600 opacity-0 transition-colors hover:bg-[#FF7A6B] hover:text-[#1A0E0C] group-hover:opacity-100"
                >
                  ✕
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {isOwner && (
        <form onSubmit={invite} className="mt-4 border-t border-white/[0.06] pt-4">
          <label className="label">Add member</label>
          <div className="flex gap-2">
            <input type="email" required className="field" placeholder="teammate@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button type="submit" className="btn-primary shrink-0" disabled={loading}>Add</button>
          </div>
          {error && (
            <p className="mt-2 rounded-lg border border-[#FF7A6B]/30 bg-[#FF7A6B]/[0.07] px-3 py-1.5 text-xs font-medium text-[#FF7A6B]">
              {error}
            </p>
          )}
          <p className="f-mono mt-2 text-[9px] uppercase tracking-wider text-zinc-600">
            Teammates need a NOVA account first
          </p>
        </form>
      )}
    </div>
  );
}