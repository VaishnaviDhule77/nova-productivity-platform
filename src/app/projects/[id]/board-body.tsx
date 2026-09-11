import { connectDB } from "@/lib/db";
import { Membership, Task, serializeTask, populatedUser } from "@/lib/models";
import { MemberManager } from "@/components/member-manager";
import { TaskBoard } from "@/components/task-board";
import { TimelineRail } from "@/components/timeline-rail";
import { Gauge } from "@/components/gauge";
import { Delivered } from "@/components/delivered";
import { progress, isOverdue } from "@/lib/utils";

export default async function BoardBody({
  projectId,
  isOwner,
  ownerId,
}: {
  projectId: string;
  isOwner: boolean;
  ownerId: string;
}) {
  await connectDB();

  const memberRows = await Membership.find({ projectId }).populate({ path: "userId", select: "name email" });
  const taskDocs = await Task.find({ projectId })
    .populate({ path: "assigneeId", select: "name" })
    .sort({ createdAt: -1 });

  const members = memberRows.map((m) => ({ ...populatedUser(m.userId), role: m.role }));
  const tasks = taskDocs.map(serializeTask);

  const { done, total, pct } = progress(tasks);
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const overdue = tasks.filter((t) => isOverdue(t)).length;

  return (
    <>
      <div className="mt-10 hidden justify-end pr-2 sm:flex lg:pr-8">
        <div className="relative z-10 -mb-16">
          <Gauge value={pct} size={118} caption="complete" />
        </div>
      </div>

      <div className="surface p-5 sm:p-6">
        <TimelineRail
          tasks={tasks.map((t) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
            overdue: isOverdue(t),
          }))}
        />

        <div className="mt-5 flex flex-wrap items-center gap-x-10 gap-y-4 border-t border-white/[0.06] pt-5">
          <div className="min-w-[200px] flex-[2]">
            <div className="f-mono mb-2 flex justify-between text-[10px] uppercase tracking-wider text-zinc-500">
              <span>Completion</span>
              <span>{done}/{total} · {pct}%</span>
            </div>
            <div className="h-[5px] overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full bg-[#FFB454] transition-[width] duration-700 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <Datum label="In progress" value={inProgress} />
          <Datum label="Overdue" value={overdue} danger={overdue > 0} />
          <Datum label="Crew" value={members.length} />
          <Delivered pct={pct} />
          <div className="sm:hidden">
            <Gauge value={pct} size={72} />
          </div>
        </div>
      </div>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[280px_1fr]">
        <MemberManager projectId={projectId} members={members} isOwner={isOwner} ownerId={ownerId} />
        <TaskBoard projectId={projectId} tasks={tasks} members={members} />
      </div>
    </>
  );
}

function Datum({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div>
      <p className="f-mono text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`f-display mt-1 text-2xl font-semibold leading-none ${danger ? "text-[#FF7A6B]" : ""}`}>{value}</p>
    </div>
  );
}