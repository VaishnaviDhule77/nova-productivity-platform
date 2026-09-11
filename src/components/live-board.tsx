"use client";

import { useRef, useState } from "react";
import { Gauge } from "./gauge";

const COLS = [
  { label: "To do", color: "#8B8B9E" },
  { label: "Doing", color: "#FFB454" },
  { label: "Done", color: "#5BC98F" },
];

const INITIAL = [
  { id: "t1", title: "Draft landing copy", col: 0 },
  { id: "t2", title: "Wireframe hero", col: 0 },
  { id: "t3", title: "Design system pass", col: 1 },
  { id: "t4", title: "Team review", col: 1 },
  { id: "t5", title: "Audit analytics", col: 2 },
  { id: "t6", title: "Ship v0.1", col: 2 },
];

export function LiveBoard() {
  const [tasks, setTasks] = useState(INITIAL);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const justDragged = useRef(false);

  const done = tasks.filter((t) => t.col === 2).length;
  const pct = Math.round((done / tasks.length) * 100);

  function moveTo(id: string, col: number) {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, col } : t)));
  }

  return (
    <div className="surface relative p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
        <span className="f-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          nova / demo — live
        </span>
        <button
          onClick={() => setTasks(INITIAL)}
          className="f-mono text-[10px] uppercase tracking-widest text-zinc-500 transition-colors hover:text-[#FFB454]"
        >
          ↺ reset
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {COLS.map((col, ci) => (
          <div
            key={col.label}
            onDragOver={(e) => { e.preventDefault(); setDragOver(ci); }}
            onDragLeave={() => setDragOver((c) => (c === ci ? null : c))}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(null);
              if (dragId) moveTo(dragId, ci);
              setDragId(null);
              justDragged.current = true;
              setTimeout(() => (justDragged.current = false), 150);
            }}
            className={`min-h-[180px] rounded-xl border border-dashed p-2 transition-colors duration-200 sm:min-h-[210px] ${
              dragOver === ci ? "border-[#FFB454]/60 bg-[#FFB454]/[0.06]" : "border-white/[0.12]"
            }`}
          >
            <div className="flex items-center justify-between px-1 pb-2">
              <span className="f-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                {col.label}
              </span>
              <span key={tasks.filter((t) => t.col === ci).length} className="animate-pop f-mono text-[9px] text-zinc-500">
                {tasks.filter((t) => t.col === ci).length}
              </span>
            </div>
            <div className="space-y-2">
              {tasks.filter((t) => t.col === ci).map((t) => (
                <button
                  key={t.id}
                  draggable
                  onDragStart={() => setDragId(t.id)}
                  onClick={() => { if (!justDragged.current) moveTo(t.id, (t.col + 1) % 3); }}
                  className="glow-card w-full cursor-grab rounded-lg border border-white/[0.08] bg-[#171724] px-2.5 py-2 text-left text-[11px] font-medium leading-snug text-zinc-200 transition-transform duration-200 hover:-translate-y-0.5 active:cursor-grabbing active:rotate-1 sm:text-xs"
                  style={{ borderLeft: `3px solid ${COLS[t.col].color}` }}
                  onMouseMove={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
                    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
                  }}
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-5 border-t border-white/[0.06] pt-4">
        <Gauge value={pct} size={84} caption="done" />
        <div className="f-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-zinc-500">
          <p>{done}/{tasks.length} slips done · {pct}%</p>
          <p className="text-zinc-600">drag slips — or tap to advance</p>
        </div>
      </div>
    </div>
  );
}