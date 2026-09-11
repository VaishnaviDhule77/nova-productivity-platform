import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Project, Membership, Task } from "@/lib/models";
import { NewProjectForm } from "@/components/new-project-form";
import { CommandPalette } from "@/components/command-palette";
import { ConstellationMap } from "@/components/constellation-map";
import { ActivityFeed } from "@/components/activity-feed";
import { CountUp } from "@/components/count-up";
import { Magnetic } from "@/components/magnetic";
import { progress } from "@/lib/utils";

export default async function DashboardBody({
  user,
}: {
  user: { id: string; name: string; email: string };
}) {
  await connectDB();

  const memberships = await Membership.find({ userId: user.id }).sort({ createdAt: -1 });
  const projectIds = memberships.map((m) => m.projectId);

  const projects = projectIds.length ? await Project.find({ _id: { $in: projectIds } }) : [];
  const tasks = projectIds.length
    ? await Task.find({ projectId: { $in: projectIds } }).select("projectId status dueDate title priority assigneeId createdAt")
    : [];
  const memberRows = projectIds.length
    ? await Membership.find({ projectId: { $in: projectIds } }).populate({ path: "userId", select: "name" })
    : [];

  const crew = new Map<string, { id: string; name: string }>();
  const membersBy = new Map<string, { id: string; name: string }[]>();
  for (const m of memberRows) {
    const u = m.userId as unknown as { _id: string; name: string };
    const pid = String(m.projectId);
    if (!crew.has(String(u._id))) crew.set(String(u._id), { id: String(u._id), name: u.name });
    if (!membersBy.has(pid)) membersBy.set(pid, []);
    if (!membersBy.get(pid)!.some((x) => x.id === String(u._id))) {
      membersBy.get(pid)!.push({ id: String(u._id), name: u.name });
    }
  }

  const memberTasks: Record<string, number> = {};
  for (const t of tasks) {
    const a = (t as unknown as { assigneeId?: string | null }).assigneeId;
    if (a) memberTasks[String(a)] = (memberTasks[String(a)] ?? 0) + 1;
  }

  const projectById = new Map(projects.map((p) => [String(p._id), p]));

  const projectList = memberships
    .map((m) => {
      const p = projectById.get(String(m.projectId));
      if (!p) return null;
      const key = String(p._id);
      const pTasks = tasks
        .filter((t) => String(t.projectId) === key)
        .map((t) => ({
          id: String(t._id),
          title: t.title,
          status: t.status,
          priority: t.priority,
          overdue: Boolean(
            (t as unknown as { dueDate?: Date | null }).dueDate &&
            t.status !== "DONE" &&
            new Date((t as unknown as { dueDate: Date }).dueDate).getTime() < Date.now()
          ),
        }));
      return {
        id: key,
        name: p.name,
        description: p.description ?? null,
        color: p.color,
        role: m.role,
        tasks: pTasks,
        members: membersBy.get(key) ?? [],
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const allTasks = projectList.flatMap((p) => p.tasks);
  const { done, total, pct } = progress(allTasks);
  const overdue = allTasks.filter((t) => t.overdue).length;

  const projName = new Map(projectList.map((p) => [p.id, p.name]));
  const paletteTasks = tasks.slice(0, 60).map((t) => ({
    id: String(t._id),
    title: t.title,
    projectId: String(t.projectId),
    projectName: projName.get(String(t.projectId)) ?? "Project",
  }));

  const today = new Date();
  const isToday = (d: Date) => new Date(d).toDateString() === today.toDateString();
  const feed = [
    ...tasks.map((t) => ({
      id: `${t._id}-c`, kind: "task" as const, title: t.title,
      project: projName.get(String(t.projectId)) ?? "", at: t.createdAt, today: isToday(t.createdAt),
    })),
    ...memberRows.map((m) => ({
      id: `${m.id}-${m.projectId}-j`, kind: "join" as const,
      name: (m.userId as unknown as { name: string }).name,
      project: projName.get(String(m.projectId)) ?? "", at: m.createdAt, today: isToday(m.createdAt),
    })),
    ...projects.map((p) => ({
      id: `${p._id}-d`, kind: "draft" as const, project: p.name,
      at: p.createdAt, today: isToday(p.createdAt),
    })),
  ]
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, 7);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateStr = today
    .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    .toUpperCase();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid items-end gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <p className="meta"><span className="mr-2 text-[#FFB454]">✦</span>Workspace · {dateStr}</p>
          <h1 className="f-display mt-3 text-[clamp(2.2rem,5vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.02em]">
            {greeting}, <span className="text-[#FFB454]">{user.name.split(" ")[0]}</span>.
          </h1>
        </div>
        <div className="lg:col-span-4">
          <Magnetic className="w-full" strength={0.12}>
            <CommandPalette
              projects={projectList.map((p) => ({ id: p.id, name: p.name }))}
              tasks={paletteTasks}
            />
          </Magnetic>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-y-8 border-y border-white/[0.06] py-7 sm:grid-cols-4 sm:divide-x sm:divide-white/[0.06]">
        <Stat label="Projects" value={projectList.length} />
        <Stat label="Slips" value={total} />
        <Stat label="Complete" value={pct} suffix="%" tone="good" />
        <Stat label="Overdue" value={overdue} tone={overdue > 0 ? "bad" : undefined} />
      </div>

      <section className="mt-10">
        <ConstellationMap projects={projectList} memberTasks={memberTasks} />
      </section>

      <div className="mt-12 grid items-start gap-8 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-4" id="draft">
          {overdue > 0 && (
            <div className="flex gap-3 rounded-xl border border-[#FFB454]/30 bg-[#FFB454]/[0.05] p-4">
              <span className="f-mono pt-0.5 text-xs font-semibold text-[#FFB454]">!</span>
              <div>
                <p className="f-mono text-[10px] uppercase tracking-[0.18em] text-[#FFB454]">Signal</p>
                <p className="mt-1 text-sm leading-snug text-zinc-300">
                  {overdue} slip{overdue > 1 ? "s" : ""} overdue — visible on the map and timeline.
                </p>
              </div>
            </div>
          )}
          <NewProjectForm />
          <ActivityFeed events={feed} />
        </aside>

        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="meta">Project index — {String(projectList.length).padStart(2, "0")}</h2>
            <span className="f-mono text-[9px] uppercase tracking-widest text-zinc-600">Sorted · recent</span>
          </div>

          {projectList.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-white/[0.12] p-12 text-center">
              <svg viewBox="0 0 96 96" className="mx-auto h-20 w-20 opacity-70" aria-hidden>
                <circle cx="48" cy="48" r="36" fill="none" stroke="rgba(255,255,255,0.15)" strokeDasharray="3 6" />
                <circle cx="48" cy="48" r="20" fill="none" stroke="rgba(255,255,255,0.12)" strokeDasharray="3 6" />
                <circle cx="48" cy="48" r="6" fill="#FFB454" />
                <circle cx="80" cy="30" r="2" fill="rgba(255,255,255,0.4)" />
                <circle cx="16" cy="62" r="1.6" fill="rgba(255,255,255,0.3)" />
              </svg>
              <p className="f-display mt-5 text-xl font-semibold">The sky is empty.</p>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
                Draft your first project — it becomes a hub with room for slips and crew.
              </p>
              <a href="#draft" className="btn-primary mt-6 inline-flex">Draft a project →</a>
            </div>
          ) : (
            <div className="mt-2 border-t border-white/[0.06]">
              {projectList.map((p, i) => (
                <div key={p.id} className="animate-rise" style={{ animationDelay: `${Math.min(i * 70, 420)}ms` }}>
                  <ProjectRow index={i} project={p} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value, suffix, tone }: { label: string; value: number; suffix?: string; tone?: "good" | "bad" }) {
  return (
    <div className="px-4 sm:px-7 sm:first:pl-0">
      <p className="meta">{label}</p>
      <p className={`f-display mt-2 text-4xl font-semibold leading-none ${
        tone === "bad" ? "text-[#FF7A6B]" : tone === "good" ? "text-[#5BC98F]" : ""
      }`}>
        <CountUp to={value} suffix={suffix ?? ""} />
      </p>
    </div>
  );
}

function ProjectRow({
  index,
  project,
}: {
  index: number;
  project: {
    id: string; name: string; description: string | null; color: string; role: string;
    tasks: { status: string; overdue: boolean }[];
    members: { id: string; name: string }[];
  };
}) {
  const { done, total, pct } = progress(project.tasks);
  const overdue = project.tasks.filter((t) => t.overdue).length;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 border-b border-white/[0.06] py-5 transition-colors duration-200 hover:bg-white/[0.025]"
    >
      <span className="f-display text-2xl font-semibold text-white/[0.15] transition-colors duration-200 group-hover:text-[#FFB454]">
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 shrink-0 rotate-45" style={{ backgroundColor: project.color }} />
          <h3 className="f-display truncate text-xl font-semibold">{project.name}</h3>
          {project.role === "OWNER" && (
            <span className="tag shrink-0 border-[#FFB454]/40 text-[#FFB454]">Owner</span>
          )}
        </div>
        <div className="mt-2.5 flex items-center gap-3">
          <div className="h-[3px] w-40 max-w-full rounded-full bg-white/[0.08]">
            <div
              className="h-full rounded-full bg-[#FFB454] transition-[width] duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="f-mono shrink-0 text-[10px] uppercase tracking-wider text-zinc-500">
            {done}/{total} · {pct}%
          </span>
          {overdue > 0 && (
            <span className="f-mono shrink-0 text-[10px] uppercase tracking-wider text-[#FF7A6B]">
              {overdue} od
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex -space-x-1.5">
          {project.members.slice(0, 4).map((m) => (
            <span
              key={m.id}
              title={m.name}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-[#0B0B12] bg-[#2A2A3A] text-[8px] font-bold text-zinc-200"
            >
              {m.name.split(" ").filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
            </span>
          ))}
        </div>
        <span className="f-mono text-sm text-white/20 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#FFB454]">
          →
        </span>
      </div>
    </Link>
  );
}