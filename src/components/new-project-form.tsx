"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const COLORS = ["#FFB454", "#5BC98F", "#8FA3C4", "#FF7A6B", "#E9C88A", "#EDEDF7"];

export function NewProjectForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // "N" and the palette action both open this form
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setOpen(true);
      }
    }
    const openForm = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("nova:new-project", openForm);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("nova:new-project", openForm);
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Give your project a name"); return; }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || null, color }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Could not create project"); return; }
    setName(""); setDescription(""); setColor(COLORS[0]); setOpen(false);
    router.refresh();
  }

  return (
    <div className="surface p-5">
      <h2 className="meta">New project — draft</h2>
      {!open ? (
        <button className="btn-primary mt-4 w-full" onClick={() => setOpen(true)}>
          ＋ Start a draft <span className="f-mono ml-1 rounded border border-[#1A1207]/25 px-1 text-[9px]">N</span>
        </button>
      ) : (
        <form onSubmit={onSubmit} className="animate-modal mt-4 space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="field" placeholder="e.g. Q3 Launch" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="field min-h-[64px] resize-none" placeholder="Optional…" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="label">Ink</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Pick color ${c}`}
                  className={`h-7 w-7 rounded-lg transition-all duration-200 ${
                    color === c
                      ? "scale-110 ring-2 ring-white/70 ring-offset-2 ring-offset-[#12121C]"
                      : "opacity-40 hover:opacity-90"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          {error && (
            <p className="rounded-lg border border-[#FF7A6B]/30 bg-[#FF7A6B]/[0.07] px-3 py-2 text-sm font-medium text-[#FF7A6B]">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? "Creating…" : "Create →"}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}