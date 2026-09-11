"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PRIORITIES, STATUSES } from "@/lib/utils";
import type { BoardTask, Member } from "@/lib/utils";

export function TaskModal({ projectId, members, task, onClose }: {
  projectId: string;
  members: Member[];
  task: BoardTask | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [closing, setClosing] = useState(false);
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState(task?.status ?? "TODO");
  const [priority, setPriority] = useState(task?.priority ?? "MEDIUM");
  const [assigneeId, setAssigneeId] = useState(task?.assignee?.id ?? "");
  const [dueDate, setDueDate] = useState(toInputDate(task?.dueDate ?? null));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toInputDate(d: Date | string | null) {
    if (!d) return "";
    const date = new Date(d);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function close() {
    if (closing) return;
    setClosing(true);
    setTimeout(() => onClose(), 150);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    setLoading(true);
    setError(null);

    const res = await fetch(task ? `/api/tasks/${task.id}` : `/api/projects/${projectId}/tasks`, {
      method: task ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
    router.refresh();
    close();
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity duration-150 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
      onClick={close}
    >
      <div
        className={`${closing ? "animate-modal-out" : "animate-modal"} w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#12121C] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
          <span className="meta">{task ? `Edit — #${task.id.slice(-4)}` : "New slip"}</span>
          <button
            onClick={close}
            aria-label="Close"
            className="flex h-6 w-6 items-center justify-center rounded-md text-xs text-zinc-500 transition-colors hover:bg-[#FF7A6B] hover:text-[#1A0E0C]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-5">
          <div>
            <label className="label">Title</label>
            <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" autoFocus />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="field min-h-[72px] resize-none" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Status</label>
              <select className="field" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="field" value={priority} onChange={(e) => setPriority(e.target.value)}>
                {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Assignee</label>
              <select className="field" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                <option value="">Unassigned</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Due date</label>
              <input type="date" className="field" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-[#FF7A6B]/30 bg-[#FF7A6B]/[0.07] px-3 py-2 text-sm font-medium text-[#FF7A6B]">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-white/[0.06] pt-4">
            <button type="button" className="btn-ghost" onClick={close}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Saving…" : task ? "Save →" : "Create →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}