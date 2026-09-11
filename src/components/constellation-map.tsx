"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Gauge } from "./gauge";

type MapTask = { id: string; title: string; status: string; priority: string; overdue: boolean };
type MapMember = { id: string; name: string };
export type MapProject = {
  id: string; name: string; color: string; role: string;
  tasks: MapTask[]; members: MapMember[];
};

const STATUS_COLOR: Record<string, string> = {
  TODO: "#8B8B9E",
  IN_PROGRESS: "#FFB454",
  DONE: "#5BC98F",
};

const W = 1000, H = 660, CX = 500, CY = 330;

export function ConstellationMap({ projects, memberTasks }: {
  projects: MapProject[];
  memberTasks: Record<string, number>;
}) {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null); // "p:<id>" | "m:<id>"
  const [tip, setTip] = useState<{ x: number; y: number; label: string; sub: string } | null>(null);

  const layout = useMemo(() => {
    const n = projects.length;
    const R = n <= 1 ? 0 : Math.min(250, 190 + n * 18);
    const hubs = projects.map((p, i) => {
      const a = (-90 + (i * 360) / Math.max(n, 1)) * (Math.PI / 180);
      return { ...p, x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) };
    });

    const nodes = hubs.flatMap((h, hi) =>
      h.tasks.map((t, ti) => {
        const count = Math.max(h.tasks.length, 1);
        const a = hi * 0.9 + (ti / count) * Math.PI * 2;
        const r = 44 + (ti % 3) * 13;
        return { ...t, projectId: h.id, x: h.x + r * Math.cos(a), y: h.y + r * Math.sin(a) };
      })
    );

    const memberMap = new Map<string, MapMember & { projectIds: string[] }>();
    for (const p of projects) {
      for (const m of p.members) {
        const cur = memberMap.get(m.id) ?? { ...m, projectIds: [] };
        if (!cur.projectIds.includes(p.id)) cur.projectIds.push(p.id);
        memberMap.set(m.id, cur);
      }
    }
   const members = Array.from(memberMap.values());
    const mr = members.length ? Math.min(290, 185 + members.length * 14) : 0;
    const memberNodes = members.map((m, i) => {
      const a = ((i * 360) / Math.max(members.length, 1) + 28) * (Math.PI / 180);
      return { ...m, x: CX + mr * Math.cos(a), y: CY + mr * Math.sin(a) };
    });

    return { hubs, nodes, memberNodes };
  }, [projects]);

  const hoverProject = hover?.startsWith("p:")
    ? projects.find((p) => p.id === hover.slice(2)) ?? null
    : null;
  const hoverMember = hover?.startsWith("m:")
    ? layout.memberNodes.find((m) => m.id === hover.slice(2)) ?? null
    : null;

  function projectAlpha(id: string) {
    if (!hover) return 1;
    if (hoverProject) return hoverProject.id === id ? 1 : 0.12;
    if (hoverMember) return hoverMember.projectIds.includes(id) ? 1 : 0.12;
    return 1;
  }

  function openProject(id: string) {
    router.push(`/projects/${id}`);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_270px]">
      <div className="starmap relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0E0E16]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
          <span className="f-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            constellation — {projects.length} hub{projects.length === 1 ? "" : "s"}
          </span>
          <span className="f-mono hidden text-[9px] uppercase tracking-widest text-zinc-600 sm:block">
            hover = inspect · click = open
          </span>
        </div>

        {projects.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 p-8 text-center">
            <svg viewBox="0 0 120 120" className="h-28 w-28 opacity-60" aria-hidden>
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.15)" strokeDasharray="3 5" />
              <circle cx="60" cy="60" r="32" fill="none" stroke="rgba(255,255,255,0.12)" strokeDasharray="3 5" />
              <circle cx="60" cy="60" r="8" fill="#FFB454" />
            </svg>
            <p className="f-display text-2xl font-semibold">Empty sky, ready for a hub.</p>
            <a href="#draft" className="btn-primary">Draft your first project →</a>
          </div>
        ) : (
          <div className="relative">
            <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Map of your projects, tasks and team">
              {layout.nodes.map((t) => {
                const hub = layout.hubs.find((h) => h.id === t.projectId)!;
                return (
                  <line
                    key={`s-${t.id}`}
                    x1={hub.x} y1={hub.y} x2={t.x} y2={t.y}
                    stroke="#EDEDF7" strokeOpacity={projectAlpha(t.projectId) * 0.07}
                  />
                );
              })}

              {layout.memberNodes.flatMap((m) =>
                m.projectIds.map((pid) => {
                  const hub = layout.hubs.find((h) => h.id === pid);
                  if (!hub) return null;
                  const active = hoverMember?.id === m.id;
                  return (
                    <line
                      key={`${m.id}-${pid}`}
                      x1={m.x} y1={m.y} x2={hub.x} y2={hub.y}
                      stroke={active ? "#FFB454" : "#EDEDF7"}
                      strokeOpacity={active ? 0.6 : 0.08}
                      strokeWidth={active ? 1.5 : 1}
                      className="transition-all duration-200"
                    />
                  );
                })
              )}

              <circle cx={CX} cy={CY} r="20" fill="none" stroke="#FFB454" strokeOpacity="0.25" strokeDasharray="2 4" />
              <text x={CX} y={CY + 6} textAnchor="middle" fontSize="16" fill="#FFB454">✦</text>

              {layout.nodes.map((t) => {
                const alpha = projectAlpha(t.projectId);
                const c = STATUS_COLOR[t.status] ?? "#8B8B9E";
                const r = t.priority === "HIGH" ? 5.5 : 4;
                return (
                  <circle
                    key={t.id}
                    cx={t.x} cy={t.y} r={r}
                    fill={c}
                    stroke={t.overdue ? "#FF7A6B" : "none"}
                    strokeWidth="1.5"
                    opacity={alpha}
                    className="cursor-help transition-opacity duration-200"
                    onMouseEnter={() => {
                      setHover(`p:${t.projectId}`);
                      setTip({ x: t.x, y: t.y, label: t.title, sub: `${t.status.replace("_", " ")}${t.overdue ? " · OVERDUE" : ""}` });
                    }}
                    onMouseLeave={() => { setHover(null); setTip(null); }}
                  />
                );
              })}

              {layout.hubs.map((h) => {
                const alpha = projectAlpha(h.id);
                const hr = 22 + Math.min(h.tasks.length, 10);
                const doneCount = h.tasks.filter((t) => t.status === "DONE").length;
                return (
                  <g
                    key={h.id}
                    opacity={alpha}
                    className="cursor-pointer transition-opacity duration-200"
                    onMouseEnter={() => setHover(`p:${h.id}`)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => openProject(h.id)}
                    onKeyDown={(e) => { if (e.key === "Enter") openProject(h.id); }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open project ${h.name}`}
                  >
                    <circle cx={h.x} cy={h.y} r={hr} fill={h.color} opacity="0.14" className="transition-all duration-200" />
                    <circle cx={h.x} cy={h.y} r={hr} fill="none" stroke={h.color} strokeWidth="1.5" />
                    <circle cx={h.x} cy={h.y} r={Math.max(4, (hr * doneCount) / Math.max(h.tasks.length, 1))} fill={h.color} className="transition-all duration-500" />
                    <text x={h.x} y={h.y + hr + 18} textAnchor="middle" fontSize="10" letterSpacing="2" fill="#EDEDF7" fillOpacity="0.5" className="f-mono">
                      {h.name.toUpperCase().slice(0, 18)}
                    </text>
                  </g>
                );
              })}

              {layout.memberNodes.map((m) => {
                const active = hoverMember?.id === m.id;
                const dim = hoverProject
                  ? (hoverProject.members.some((x) => x.id === m.id) ? 1 : 0.12)
                  : hoverMember ? (active ? 1 : 0.12) : 0.85;
                return (
                  <g
                    key={m.id}
                    opacity={dim}
                    className="cursor-pointer transition-opacity duration-200"
                    onMouseEnter={() => setHover(`m:${m.id}`)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => openProject(m.projectIds[0])}
                  >
                    <circle cx={m.x} cy={m.y} r="13" fill="#12121C" stroke={active ? "#FFB454" : "#EDEDF7"} strokeOpacity={active ? 0.9 : 0.25} />
                    <text x={m.x} y={m.y + 3.5} textAnchor="middle" fontSize="9" fill="#EDEDF7" fillOpacity="0.85" className="f-mono">
                      {m.name.split(" ").filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                    </text>
                    {active && (
                      <text x={m.x} y={m.y - 20} textAnchor="middle" fontSize="9" letterSpacing="1.5" fill="#FFB454" className="f-mono">
                        {m.name.toUpperCase()}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {tip && (
              <div
                className="f-mono pointer-events-none absolute z-10 max-w-[220px] rounded-lg border border-white/10 bg-[#171724] px-2.5 py-1.5 text-[10px] leading-snug text-zinc-200 shadow-xl"
                style={{ left: `${(tip.x / W) * 100}%`, top: `${(tip.y / H) * 100}%`, transform: "translate(-50%, -135%)" }}
              >
                <p className="font-semibold">{tip.label}</p>
                <p className="text-zinc-500">{tip.sub}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <aside className="surface flex flex-col p-5">
        {hoverProject ? (
          <>
            <p className="meta">Dossier — project</p>
            <h3 className="f-display mt-2 text-2xl font-semibold leading-tight">{hoverProject.name}</h3>
            <div className="mt-4 flex items-center gap-5">
              <Gauge
                value={hoverProject.tasks.length
                  ? Math.round((hoverProject.tasks.filter((t) => t.status === "DONE").length / hoverProject.tasks.length) * 100)
                  : 0}
                size={92}
                caption="done"
              />
              <div className="f-mono flex-1 space-y-1.5 text-[10px] uppercase tracking-wider text-zinc-400">
                {(["TODO", "IN_PROGRESS", "DONE"] as const).map((s) => (
                  <div key={s} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_COLOR[s] }} />
                      {s.replace("_", " ")}
                    </span>
                    <span>{hoverProject.tasks.filter((t) => t.status === s).length}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-white/[0.06] pt-4">
              {hoverProject.members.slice(0, 6).map((m) => (
                <span
                  key={m.id}
                  title={m.name}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-[#171724] text-[9px] font-bold text-zinc-300 ring-1 ring-white/10"
                >
                  {m.name.split(" ").filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              ))}
              <span className="f-mono ml-1 text-[9px] uppercase tracking-wider text-zinc-600">
                crew {hoverProject.members.length}
              </span>
            </div>
            {hoverProject.tasks.some((t) => t.overdue) && (
              <p className="f-mono mt-3 text-[10px] uppercase tracking-wider text-[#FF7A6B]">
                ⚠ {hoverProject.tasks.filter((t) => t.overdue).length} overdue
              </p>
            )}
            <Link href={`/projects/${hoverProject.id}`} className="btn-primary mt-5 w-full">
              Open project →
            </Link>
          </>
        ) : hoverMember ? (
          <>
            <p className="meta">Dossier — crew</p>
            <h3 className="f-display mt-2 text-2xl font-semibold leading-tight">{hoverMember.name}</h3>
            <div className="f-mono mt-4 space-y-2 text-[10px] uppercase tracking-wider text-zinc-400">
              <p className="flex justify-between border-b border-white/[0.06] pb-2">
                <span>Projects</span><span>{hoverMember.projectIds.length}</span>
              </p>
              <p className="flex justify-between border-b border-white/[0.06] pb-2">
                <span>Assigned slips</span><span>{memberTasks[hoverMember.id] ?? 0}</span>
              </p>
            </div>
            <div className="mt-4 space-y-1.5 border-t border-white/[0.06] pt-4">
              {hoverMember.projectIds.map((pid) => {
                const p = projects.find((x) => x.id === pid);
                if (!p) return null;
                return (
                  <button
                    key={pid}
                    onClick={() => openProject(pid)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm text-zinc-300 transition-colors hover:bg-white/[0.05]"
                  >
                    <span className="h-2 w-2 rotate-45" style={{ backgroundColor: p.color }} />
                    <span className="truncate">{p.name}</span>
                    <span className="f-mono ml-auto text-[10px] text-zinc-600">{p.tasks.length}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <p className="meta">Dossier</p>
            <h3 className="f-display mt-2 text-2xl font-semibold leading-tight">Your cosmos.</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Hubs are projects — their fill grows as slips complete. Orbiting points are
              slips, colored by state. The outer ring is your crew.
            </p>
            <div className="f-mono mt-5 space-y-2 text-[10px] uppercase tracking-wider text-zinc-400">
              <p className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#8B8B9E]" /> To do</p>
              <p className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#FFB454]" /> In progress</p>
              <p className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#5BC98F]" /> Done</p>
              <p className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full border border-[#FF7A6B]" /> Overdue</p>
            </div>
            <p className="f-mono mt-auto pt-4 text-[10px] uppercase tracking-wider text-zinc-600">
              press ⌘K to jump anywhere
            </p>
          </>
        )}
      </aside>
    </div>
  );
}