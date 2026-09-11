import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Membership, Task, serializeTask } from "@/lib/models";
import { getSessionUser } from "@/lib/auth";
import { bad, readJson } from "@/lib/api";

type Params = { params: { id: string } };

const STATUSES = ["TODO", "IN_PROGRESS", "DONE"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

async function load(userId: string, taskId: string) {
  if (!mongoose.isValidObjectId(taskId)) return null;
  const task = await Task.findById(taskId);
  if (!task) return null;
  const membership = await Membership.findOne({ userId, projectId: task.projectId });
  if (!membership) return null;
  return task;
}

export async function PATCH(req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return bad("Unauthorized", 401);
  await connectDB();

  const existing = await load(user.id, params.id);
  if (!existing) return bad("Task not found", 404);

  const body = await readJson(req);
  if (!body) return bad("Invalid request body");

  const update: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) return bad("Title cannot be empty");
    update.title = title;
  }
  if (body.description !== undefined) update.description = String(body.description).trim() || null;
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return bad("Invalid status");
    update.status = body.status;
  }
  if (body.priority !== undefined) {
    if (!PRIORITIES.includes(body.priority)) return bad("Invalid priority");
    update.priority = body.priority;
  }
  if (body.dueDate !== undefined) {
    if (body.dueDate === null || body.dueDate === "") update.dueDate = null;
    else {
      const d = new Date(body.dueDate);
      if (isNaN(d.getTime())) return bad("Invalid due date");
      update.dueDate = d;
    }
  }
  if (body.assigneeId !== undefined) {
    if (!body.assigneeId) update.assigneeId = null;
    else {
      const valid = await Membership.findOne({ userId: String(body.assigneeId), projectId: existing.projectId });
      if (!valid) return bad("Assignee must be a project member");
      update.assigneeId = String(body.assigneeId);
    }
  }

  await Task.findByIdAndUpdate(params.id, update);
  const task = await Task.findById(params.id).populate({ path: "assigneeId", select: "name" });
  return NextResponse.json({ task: serializeTask(task) });
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return bad("Unauthorized", 401);
  await connectDB();

  const existing = await load(user.id, params.id);
  if (!existing) return bad("Task not found", 404);

  await Task.findByIdAndDelete(params.id);
  return NextResponse.json({ ok: true });
}