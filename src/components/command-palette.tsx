"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PItem = { id: string; name: string };
type TItem = { id: string; title: string; projectId: string; projectName: string };
type Row = { key: string; label: string; sub: string; run: () => void };

export function CommandPalette({ projects, tasks }: { projects: PItem[]; tasks: TItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const rows = useMemo<Row[]>(() => {
    const actions: Row[] = [
      {
        key: "a-new", label: "Create new project", sub: "Action",
        run: () => { window.dispatchEvent(new Event("nova:new-project")); },
      },
    ];
    const ps: Row[] = projects.map((p) => ({
      key: `p-${p.id}`, label: p.name, sub: "Project",
      run: () => router.push(`/projects/${p.id}`),
    }));
    const ts: Row[] = tasks.map((t) => ({
      key: `t-${t.id}`, label: t.title, sub: `Slip · ${t.projectName}`,
      run: () => {
        try { localStorage.setItem("novaJumpTask", t.id); } catch {}
        router.push(`/projects/${t.projectId}`);
      },
    }));
    const s = q.trim().toLowerCase();
    const f = (r: Row[]) => (s ? r.filter((x) => x.label.toLowerCase().includes(s) || x.sub.toLowerCase().includes(s)) : r);
    return [...f(actions), ...f(ps), ...f(ts)];
  }, [q, projects, tasks, router]);

  useEffect(() => { setSel(0); }, [q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "/" && !typing && !open) {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function choose(r: Row) {
    setOpen(false);
    r.run();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-[#12121C] px-4 py-3 text-left text-sm text-zinc-500 transition-colors duration-200 hover:border-[#FFB454]/30 hover:text-zinc-300"
      >
        <span className="f-mono text-[10px] font-semibold tracking-wider text-[#FFB454]">⌘K</span>
        <span className="truncate">Search projects & slips…</span>
        <span className="f-mono ml-auto text-[10px] text-zinc-600">/</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center bg-black/60 p-4 pt-[16vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="animate-modal w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#12121C] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3.5">
              <span className="text-sm text-[#FFB454]">✦</span>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, rows.length - 1)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
                  if (e.key === "Enter" && rows[sel]) choose(rows[sel]);
                }}
                placeholder="Type to search — projects, slips, actions…"
                className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-600 outline-none"
              />
              <span className="f-mono rounded border border-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-zinc-600">
                esc
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto p-2">
              {rows.length === 0 ? (
                <p className="f-mono px-3 py-8 text-center text-[11px] uppercase tracking-wider text-zinc-600">
                  Nothing found — try another word
                </p>
              ) : (
                rows.map((r, i) => (
                  <button
                    key={r.key}
                    onClick={() => choose(r)}
                    onMouseEnter={() => setSel(i)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-100 ${
                      i === sel ? "bg-[#FFB454] text-[#1A1207]" : "text-zinc-200"
                    }`}
                  >
                    <span className="truncate text-sm font-medium">{r.label}</span>
                    <span className={`f-mono ml-auto shrink-0 text-[9px] uppercase tracking-wider ${i === sel ? "text-[#1A1207]/60" : "text-zinc-600"}`}>
                      {r.sub}
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="f-mono flex items-center gap-4 border-t border-white/[0.06] px-4 py-2.5 text-[9px] uppercase tracking-wider text-zinc-600">
              <span>↑↓ move</span>
              <span>↵ open</span>
              <span>esc close</span>
              <span className="ml-auto">{rows.length} result{rows.length === 1 ? "" : "s"}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}