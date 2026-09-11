type FeedEvent = {
  id: string;
  kind: "task" | "join" | "draft";
  title?: string;
  name?: string;
  project: string;
  at: Date;
  today: boolean;
};

export function ActivityFeed({ events }: { events: FeedEvent[] }) {
  return (
    <div className="surface p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="meta">Signals</h2>
        <span className="f-mono text-[9px] uppercase tracking-widest text-zinc-600">
          latest {events.length}
        </span>
      </div>

      {events.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-zinc-500">
          Quiet skies. Draft a project and the first signal appears here.
        </p>
      ) : (
        <ol className="relative mt-5">
          <span aria-hidden className="absolute bottom-2 left-[4px] top-2 w-px bg-white/[0.08]" />
          {events.map((e) => (
            <li key={e.id} className="relative pb-5 pl-7 last:pb-0">
              <span
                aria-hidden
                className={`absolute left-0 top-[6px] h-[9px] w-[9px] rounded-full ${
                  e.today ? "pulse-soft bg-[#FFB454]" : "border border-white/20"
                }`}
              />
              <p className="f-mono text-[9px] uppercase tracking-[0.18em] text-zinc-600">{whenLabel(e.at)}</p>
              <p className="mt-1 text-sm leading-snug text-zinc-300">{phrase(e)}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function whenLabel(at: Date) {
  const d = new Date(at);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return `Today · ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function phrase(e: FeedEvent) {
  if (e.kind === "task") {
    return <>“{e.title}” created <span className="text-zinc-500">· {e.project}</span></>;
  }
  if (e.kind === "join") {
    return <>{e.name} joined the crew <span className="text-zinc-500">· {e.project}</span></>;
  }
  return <>Project “{e.project}” drafted</>;
}