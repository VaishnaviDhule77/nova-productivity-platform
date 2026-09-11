"use client";

import { useMemo, useState } from "react";

type RailTask = { id: string; title: string; status: string; dueDate: string | null; overdue: boolean };

const STATUS_COLOR: Record<string, string> = {
  TODO: "#8B8B9E",
  IN_PROGRESS: "#FFB454",
  DONE: "#5BC98F",
};

export function TimelineRail({ tasks }: { tasks: RailTask[] }) {
  const [tip, setTip] = useState<{ id: string; x: number; title: string; sub: string } | null>(null);

  const dated = useMemo(
    () => tasks.filter((t) => t.dueDate).sort((a, b) => +new Date(a.dueDate!) - +new Date(b.dueDate!)),
    [tasks]
  );

  if (dated.length === 0) {
    return (
      <div className="flex min-h-[72px] flex-col items-start justify-center gap-1.5">
        <p className="f-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Timeline</p>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500">
          No dates set — add due dates to slips and they plot themselves here.
        </p>
        <span className="mt-2 h-px w-full border-t border-dashed border-white/[0.12]" />
      </div>
    );
  }

  const times = dated.map((t) => +new Date(t.dueDate!));
  const min = Math.min(...times), max = Math.max(...times);
  const pad = Math.max(86400000, (max - min) * 0.06);
  const lo = min - pad, hi = max + pad;
  const now = Date.now();

  const x = (ms: number) => ((ms - lo) / (hi - lo)) * 92 + 4;

  const todayInRange = now >= lo && now <= hi;
  const gridlines = [0, 1, 2, 3, 4].map((i) => lo + ((hi - lo) * i) / 4);

  function jump(t: RailTask) {
    const el = document.getElementById(`task-${t.id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.remove("pulse-target");
    void el.offsetWidth;
    el.classList.add("pulse-target");
  }

  return (
    <div>
      <div className="f-mono flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-zinc-500">
        <span>Timeline — {dated.length} scheduled</span>
        <span className="hidden sm:block">click a diamond to locate its slip</span>
      </div>
      <div className="relative mt-3 h-16">
        {gridlines.map((g, i) => (
          <div key={i} className="absolute inset-y-0 w-px bg-white/[0.05]" style={{ left: `${x(g)}%` }}>
            <span className="f-mono absolute -top-0.5 left-1 text-[8px] uppercase tracking-wider text-zinc-600">
              {new Date(g).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        ))}

        <div className="absolute inset-x-0 bottom-5 h-px bg-white/[0.12]" />

        {todayInRange && (
          <div className="absolute bottom-3 z-10" style={{ left: `${x(now)}%` }}>
            <div className="pulse-soft h-9 w-[2px] rounded-full bg-[#FFB454]" />
            <span className="f-mono absolute left-1.5 top-0 whitespace-nowrap text-[8px] font-semibold uppercase tracking-[0.2em] text-[#FFB454]">
              today
            </span>
          </div>
        )}

        {dated.map((t) => {
          const c = STATUS_COLOR[t.status] ?? "#8B8B9E";
          return (
            <button
              key={t.id}
              onClick={() => jump(t)}
              onMouseEnter={() =>
                setTip({
                  id: t.id,
                  x: x(+new Date(t.dueDate!)),
                  title: t.title,
                  sub: `${new Date(t.dueDate!).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${t.status.replace("_", " ").toLowerCase()}${t.overdue ? " · overdue" : ""}`,
                })
              }
              onMouseLeave={() => setTip(null)}
              aria-label={`Locate ${t.title} on the board`}
              className="group absolute bottom-5 z-[5] -translate-x-1/2 p-1.5"
              style={{ left: `${x(+new Date(t.dueDate!))}%` }}
            >
              <span
                className={`block h-2.5 w-2.5 rotate-45 border transition-transform duration-200 group-hover:scale-150 ${
                  t.overdue ? "border-[#FF7A6B] bg-[#FF7A6B]" : "border-transparent"
                }`}
                style={t.overdue ? undefined : { backgroundColor: c }}
              />
              {t.overdue && (
                <span className="absolute -right-0.5 -top-0.5 h-1 w-1 rounded-full bg-[#FF7A6B]" />
              )}
            </button>
          );
        })}

        {tip && (
          <div
            className="f-mono pointer-events-none absolute bottom-full z-20 mb-2 max-w-[220px] -translate-x-1/2 rounded-lg border border-white/10 bg-[#171724] px-2.5 py-1.5 text-left text-[10px] leading-snug text-zinc-200 shadow-xl"
            style={{ left: `${Math.min(Math.max(tip.x, 12), 88)}%` }}
          >
            <p className="font-semibold">{tip.title}</p>
            <p className="text-zinc-500">{tip.sub}</p>
          </div>
        )}
      </div>
      {!todayInRange && (
        <p className="f-mono mt-1 text-[9px] uppercase tracking-wider text-zinc-600">
          today is outside this range
        </p>
      )}
    </div>
  );
}