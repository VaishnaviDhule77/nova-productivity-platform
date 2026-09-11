import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Project, Membership, Task, populatedUser } from "@/lib/models";
import { getSessionUser } from "@/lib/auth";
import { bad, readJson } from "@/lib/api";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return bad("Unauthorized", 401);
  await connectDB();

  const memberships = await Membership.find({ userId: user.id }).sort({ createdAt: -1 });
  const projectIds = memberships.map((m) => m.projectId);

  const projects = projectIds.length ? await Project.find({ _id: { $in: projectIds } }) : [];
  const tasks = projectIds.length ? await Task.find({ projectId: { $in: projectIds } }).select("projectId status") : [];
  const memberRows = projectIds.length
    ? await Membership.find({ projectId: { $in: projectIds } }).populate({ path: "userId", select: "name email" })
    : [];

  const doneBy = new Map<string, number>();
  for (const t of tasks) {
    const key = String(t.projectId);
    doneBy.set(key, (doneBy.get(key) ?? 0) + (t.status === "DONE" ? 1 : 0));
  }
  const membersBy = new Map<string, { id: string; name: string; email: string }[]>();
  for (const m of memberRows) {
    const key = String(m.projectId);
    if (!membersBy.has(key)) membersBy.set(key, []);
    membersBy.get(key)!.push(populatedUser(m.userId));
  }

  const projectsOut = projects.map((p) => {
    const key = String(p._id);
    return {
      id: key,
      name: p.name,
      description: p.description ?? null,
      color: p.color,
      ownerId: String(p.ownerId),
      createdAt: p.createdAt,
      role: memberships.find((m) => String(m.projectId) === key)?.role ?? "MEMBER",
      members: membersBy.get(key) ?? [],
      completedCount: doneBy.get(key) ?? 0,
    };
  });

  return NextResponse.json({ projects: projectsOut });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return bad("Unauthorized", 401);
  await connectDB();

  const body = await readJson(req);
  if (!body) return bad("Invalid request body");

  const name = String(body.name ?? "").trim();
  if (!name) return bad("Project name is required");
  if (name.length > 80) return bad("Project name must be 80 characters or fewer");

  const project = await Project.create({
    name,
    description: body.description ? String(body.description).trim() : null,
    color: typeof body.color === "string" && /^#[0-9a-fA-F]{6}$/.test(body.color) ? body.color : "#6366f1",
    ownerId: user.id,
  });
  await Membership.create({ userId: user.id, projectId: project._id, role: "OWNER" });

  return NextResponse.json({ project }, { status: 201 });
}