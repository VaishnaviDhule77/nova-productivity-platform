import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Membership, Task, serializeTask } from "@/lib/models";
import { getSessionUser } from "@/lib/auth";
import { bad, readJson } from "@/lib/api";

type Params = { params: { id: string } };

const STATUSES = ["TODO", "IN_PROGRESS", "DONE"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

async function requireMember(userId: string, projectId: string) {
  if (!mongoose.isValidObjectId(projectId)) return false;
  return Boolean(await Membership.findOne({ userId, projectId }));
}

export async function GET(_req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return bad("Unauthorized", 401);
  await connectDB();

  if (!(await requireMember(user.id, params.id))) return bad("Project not found", 404);

  const tasks = await Task.find({ projectId: params.id })
    .populate({ path: "assigneeId", select: "name" })
    .sort({ createdAt: -1 });
  return NextResponse.json({ tasks: tasks.map(serializeTask) });
}

export async function POST(req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return bad("Unauthorized", 401);
  await connectDB();

  if (!(await requireMember(user.id, params.id))) return bad("Project not found", 404);

  const body = await readJson(req);
  if (!body) return bad("Invalid request body");

  const title = String(body.title ?? "").trim();
  if (!title) return bad("Task title is required");
  if (title.length > 120) return bad("Task title must be 120 characters or fewer");

  const status = STATUSES.includes(body.status) ? body.status : "TODO";
  const priority = PRIORITIES.includes(body.priority) ? body.priority : "MEDIUM";

  let dueDate: Date | null = null;
  if (body.dueDate) {
    dueDate = new Date(body.dueDate);
    if (isNaN(dueDate.getTime())) return bad("Invalid due date");
  }

  let assigneeId: string | null = null;
  if (body.assigneeId) {
    const valid = await Membership.findOne({ userId: String(body.assigneeId), projectId: params.id });
    if (!valid) return bad("Assignee must be a project member");
    assigneeId = String(body.assigneeId);
  }

  const created = await Task.create({
    title,
    description: body.description ? String(body.description).trim() : null,
    status,
    priority,
    dueDate,
    assigneeId,
    projectId: params.id,
  });

  const task = await Task.findById(created._id).populate({ path: "assigneeId", select: "name" });
  return NextResponse.json({ task: serializeTask(task) }, { status: 201 });
}