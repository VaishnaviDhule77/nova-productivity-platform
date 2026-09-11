"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProjectSettings({ project }: {
  project: { id: string; name: string; description: string | null };
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name cannot be empty"); return; }
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
    });
    if (res.ok) { setEditing(false); setError(null); router.refresh(); }
    else setError("Could not save changes");
  }

  async function remove() {
    if (!confirm(`Delete "${project.name}" and all of its tasks? This cannot be undone.`)) return;
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    router.push("/dashboard");
    router.refresh();
  }

  if (editing) {
    return (
      <form onSubmit={save} className="surface animate-modal w-full max-w-xs space-y-3 p-5">
        <p className="meta">Project settings</p>
        <div>
          <label className="label">Name</label>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="field min-h-[64px] resize-none" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {error && (
          <p className="rounded-lg border border-[#FF7A6B]/30 bg-[#FF7A6B]/[0.07] px-3 py-1.5 text-xs font-medium text-[#FF7A6B]">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button type="submit" className="btn-primary flex-1">Save</button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => { setEditing(false); setName(project.name); setDescription(project.description ?? ""); }}
          >
            Cancel
          </button>
        </div>
        <button
          type="button"
          onClick={remove}
          className="f-mono w-full text-center text-[10px] uppercase tracking-wider text-[#FF7A6B]/70 transition-colors hover:text-[#FF7A6B]"
        >
          Delete project — permanent
        </button>
      </form>
    );
  }

  return (
    <button className="btn-ghost px-3.5 py-1.5 text-xs" onClick={() => setEditing(true)}>
      ⚙ Settings
    </button>
  );
}