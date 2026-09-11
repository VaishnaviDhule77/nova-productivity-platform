export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type Member = { id: string; name: string; email: string; role: string };

export type BoardTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | string | null;
  assignee: { id: string; name: string } | null;
};

export const STATUSES: { value: TaskStatus; label: string; dot: string }[] = [
  { value: "TODO", label: "To Do", dot: "bg-[#8B8B9E]" },
  { value: "IN_PROGRESS", label: "In Progress", dot: "bg-[#FFB454]" },
  { value: "DONE", label: "Done", dot: "bg-[#5BC98F]" },
];

export const PRIORITIES: { value: TaskPriority; label: string; classes: string }[] = [
  { value: "LOW", label: "Low", classes: "border-white/15 bg-white/[0.03] text-zinc-400" },
  { value: "MEDIUM", label: "Med", classes: "border-[#E9C88A]/30 bg-[#E9C88A]/[0.07] text-[#E9C88A]" },
  { value: "HIGH", label: "High", classes: "border-[#FF7A6B]/40 bg-[#FF7A6B]/[0.08] text-[#FF7A6B]" },
];

const AVATAR_COLORS = [
  "bg-[#FFB454] text-[#1A1207]",
  "bg-[#5BC98F] text-[#0B0B12]",
  "bg-[#8FA3C4] text-[#0B0B12]",
  "bg-[#FF7A6B] text-[#1A0E0C]",
  "bg-[#E9C88A] text-[#1A1207]",
  "bg-[#3A3A4C] text-[#EDEDF2]",
];

export function initials(name: string) {
  return (name.split(" ").filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase()) || "?";
}

export function avatarColor(name: string) {
  let sum = 0;
  for (const ch of name) sum += ch.charCodeAt(0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDue(date: Date | string | null): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function isOverdue(task: { dueDate: Date | string | null; status: string }) {
  if (!task.dueDate || task.status === "DONE") return false;
  return new Date(task.dueDate).getTime() < Date.now();
}

export function progress(tasks: { status: string }[]) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "DONE").length;
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}