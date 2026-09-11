"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TaskModal } from "./task-modal";
import { PRIORITIES, STATUSES, initials, avatarColor, formatDue, isOverdue } from "@/lib/utils";
import type { BoardTask, Member } from "@/lib/utils";

const SPINE: Record<string, string> = { TODO: "#5A5A6E", IN_PROGRESS: "#FFB454", DONE: "#5BC98F" };

export function TaskBoard({ projectId, tasks, members }: {
  projectId: string;
  tasks: BoardTask[];
  members: Member[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BoardTask | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [justDropped, setJustDropped] = useState<string | null>(null);
  const [doneOverride, setDoneOverride] = useState<Record<string, boolean>>({});

  // "N" opens a new slip
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setEditing(null);
        setModalOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Jump-to-slip from the command palette
  useEffect(() => {
    let tid: string | null = null;
    try { tid = localStorage.getItem("novaJumpTask"); } catch { tid = null; }
    if (!tid) return;
    try { localStorage.removeItem("novaJumpTask"); } catch {}
    let attempts = 0;
    const tryScroll = () => {
      const el = document.getElementById(`task-${tid}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("pulse-target");
        setTimeout(() => el.classList.remove("pulse-target"), 2600);
      } else if (attempts++ < 24) {
        setTimeout(tryScroll, 150);
      }
    };
    tryScroll();
  }, [tasks]);

  // Clear optimistic overrides once the server state agrees
  useEffect(() => {
    setDoneOverride((prev) => {
      if (Object.keys(prev).length === 0) return prev;
      const next = { ...prev };
      let changed = false;
      for (const id of Object.keys(next)) {
        const t = tasks.find((x) => x.id === id);
        const want = next[id];
        if (!t || (want ? t.status === "DONE" : t.status !== "DONE")) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [tasks]);

  function isDone(t: BoardTask) {
    return doneOverride[t.id] ?? t.status === "DONE";
  }

  async function patchStatus(id: string, status: string) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function moveTask(id: string, status: string) {
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === status) return;
    setDoneOverride((o) => { const n = { ...o }; delete n[id]; return n; });
    setJustDropped(id);
    setTimeout(() => setJustDropped((d) => (d === id ? null : d)), 650);
    await patchStatus(id, status);
    router.refresh();
  }

  async function toggleDone(t: BoardTask) {
    const target = !isDone(t);
    setDoneOverride((o) => ({ ...o, [t.id]: target }));
    await patchStatus(t.id, target ? "DONE" : "TODO");
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="meta">Board — {tasks.length} slips</h2>
        <button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
          ＋ New task <span className="f-mono ml-1 rounded border border-[#1A1207]/25 px-1 text-[9px]">N</span>
        </button>
      </div>

      <div className="mt-4 grid gap-8 md:grid-cols-3 md:gap-0">
        {STATUSES.map((col) => {
          const items = tasks.filter((t) => t.status === col.value);
          return (
            <div
              key={col.value}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col.value); }}
              onDragLeave={() => setDragOver((c) => (c === col.value ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                if (dragId) moveTask(dragId, col.value);
                setDragId(null);
              }}
              className={`min-h-[220px] rounded-xl py-1 transition-colors duration-200 md:border-l md:border-white/[0.06] md:pl-6 md:first:border-l-0 md:first:pl-0 ${
                dragOver === col.value
                  ? "bg-[#FFB454]/[0.05] outline outline-1 outline-dashed outline-[#FFB454]/50 -outline-offset-4"
                  : ""
              }`}
            >
              <div className="flex items-baseline justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} />
                  <span className="f-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                    {col.label}
                  </span>
                </div>
                <span key={items.length} className="animate-pop f-display text-xl font-semibold leading-none text-white/30">
                  {items.length}
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                {items.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    done={isDone(task)}
                    dragging={dragId === task.id}
                    settled={justDropped === task.id}
                    onDragStart={setDragId}
                    onMove={moveTask}
                    onEdit={() => { setEditing(task); setModalOpen(true); }}
                    onToggle={toggleDone}
                  />
                ))}
                {items.length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/[0.1] py-8 text-center">
                    <svg viewBox="0 0 40 40" className="mx-auto h-8 w-8 opacity-30" aria-hidden>
                      <circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" strokeDasharray="3 5" />
                      <path d="M20 14v12M14 20h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <p className="f-mono mt-2 text-[9px] uppercase tracking-widest text-zinc-600">drop here</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <TaskModal projectId={projectId} members={members} task={editing} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}

function TaskCard({ task, done, dragging, settled, onDragStart, onMove, onEdit, onToggle }: {
  task: BoardTask;
  done: boolean;
  dragging: boolean;
  settled: boolean;
  onDragStart: (id: string) => void;
  onMove: (id: string, status: string) => void;
  onEdit: () => void;
  onToggle: (t: BoardTask) => void;
}) {
  const router = useRouter();
  const priority = PRIORITIES.find((p) => p.value === task.priority);
  const due = formatDue(task.dueDate);
  const overdue = isOverdue(task);
  const idx = STATUSES.findIndex((s) => s.value === task.status);

  async function remove() {
    if (!confirm(`Delete "${task.title}"?`)) return;
    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div
      id={`task-${task.id}`}
      draggable
      onDragStart={() => onDragStart(task.id)}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
      className={`glow-card group scroll-mt-28 cursor-grab rounded-xl border bg-[#12121C] p-3.5 transition-[transform,border-color,box-shadow,opacity] duration-200 active:cursor-grabbing ${
        done ? "border-white/[0.05] opacity-60" : "border-white/[0.08] hover:border-[#FFB454]/30"
      } ${
        dragging
          ? "rotate-[1.5deg] scale-[1.03] border-[#FFB454]/50 shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
          : "hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
      } ${settled ? "animate-settle" : ""}`}
      style={{ borderLeft: `3px solid ${SPINE[task.status] ?? "#5A5A6E"}` }}
    >
      <div className="flex items-start gap-2.5">
        <button
          onClick={() => onToggle(task)}
          aria-label={done ? "Mark as not done" : "Mark as done"}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
            done
              ? "border-[#5BC98F]/70 bg-[#5BC98F]/15"
              : "border-white/25 hover:border-[#FFB454] hover:bg-[#FFB454]/10"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden>
            <path
              d="M5 13l4 4L19 7"
              stroke="#5BC98F"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`check-path ${done ? "on" : ""}`}
            />
          </svg>
        </button>

        <div className="min-w-0 flex-1">
          <p className="f-mono text-[8px] tracking-[0.2em] text-white/20">#{task.id.slice(-4)}</p>
          <h3 className="relative mt-0.5 inline-block max-w-full text-sm font-medium leading-snug">
            <span className={`transition-colors duration-500 ${done ? "text-zinc-500" : ""}`}>{task.title}</span>
            <span
              aria-hidden
              className={`absolute left-0 top-1/2 h-px w-full origin-left bg-current transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                done ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </h3>
        </div>

        {priority && <span className={`tag shrink-0 ${priority.classes}`}>{priority.label}</span>}
      </div>

      {task.description && (
        <p className="mt-1.5 line-clamp-2 pl-[30px] text-xs leading-relaxed text-zinc-500">{task.description}</p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 pl-[30px]">
        <div className="flex items-center gap-2.5">
          {task.assignee && (
            <span className="flex items-center gap-1.5">
              <span className={`flex h-5 w-5 items-center justify-center rounded-md text-[8px] font-bold ${avatarColor(task.assignee.name)}`}>
                {initials(task.assignee.name)}
              </span>
              <span className="f-mono text-[10px] uppercase tracking-wider text-zinc-400">
                {task.assignee.name.split(" ")[0]}
              </span>
            </span>
          )}
          {due && (
            <span className={`f-mono text-[10px] uppercase tracking-wider ${overdue ? "font-semibold text-[#FF7A6B]" : "text-zinc-500"}`}>
              ↳ {due}
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100">
          <IconBtn label="Move left" disabled={idx <= 0} onClick={() => onMove(task.id, STATUSES[idx - 1].value)}>←</IconBtn>
          <IconBtn label="Move right" disabled={idx >= STATUSES.length - 1} onClick={() => onMove(task.id, STATUSES[idx + 1].value)}>→</IconBtn>
          <IconBtn label="Edit task" onClick={onEdit}>✎</IconBtn>
          <IconBtn label="Delete task" onClick={remove} danger>✕</IconBtn>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, disabled, label, danger }: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-6 w-6 items-center justify-center rounded-md text-[11px] text-zinc-500 transition-colors duration-150 disabled:opacity-25 ${
        danger ? "hover:bg-[#FF7A6B] hover:text-[#1A0E0C]" : "hover:bg-[#FFB454] hover:text-[#1A1207]"
      }`}
    >
      {children}
    </button>
  );
}