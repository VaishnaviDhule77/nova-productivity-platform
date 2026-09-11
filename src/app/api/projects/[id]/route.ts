import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Project, Membership, Task, User, serializeTask, populatedUser } from "@/lib/models";
import { getSessionUser } from "@/lib/auth";
import { bad, readJson } from "@/lib/api";

type Params = { params: { id: string } };

async function load(userId: string, projectId: string) {
  if (!mongoose.isValidObjectId(projectId)) return null;
  const membership = await Membership.findOne({ userId, projectId });
  if (!membership) return null;
  const project = await Project.findById(projectId);
  if (!project) return null;
  return { membership, project };
}

export async function GET(_req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return bad("Unauthorized", 401);
  await connectDB();

  const data = await load(user.id, params.id);
  if (!data) return bad("Project not found", 404);

  const owner = await User.findById(data.project.ownerId).select("name email");
  const memberRows = await Membership.find({ projectId: params.id }).populate({ path: "userId", select: "name email" });
  const tasks = await Task.find({ projectId: params.id })
    .populate({ path: "assigneeId", select: "name" })
    .sort({ createdAt: -1 });

  return NextResponse.json({
    project: {
      id: String(data.project._id),
      name: data.project.name,
      description: data.project.description ?? null,
      color: data.project.color,
      ownerId: String(data.project.ownerId),
      owner: owner ? populatedUser(owner) : null,
      members: memberRows.map((m) => ({ ...populatedUser(m.userId), role: m.role })),
      tasks: tasks.map(serializeTask),
    },
    role: data.membership.role,
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return bad("Unauthorized", 401);
  await connectDB();

  const data = await load(user.id, params.id);
  if (!data) return bad("Project not found", 404);
  if (data.membership.role !== "OWNER") return bad("Only the project owner can edit this project", 403);

  const body = await readJson(req);
  if (!body) return bad("Invalid request body");

  const update: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return bad("Project name cannot be empty");
    update.name = name;
  }
  if (body.description !== undefined) update.description = String(body.description).trim() || null;
  if (typeof body.color === "string" && /^#[0-9a-fA-F]{6}$/.test(body.color)) update.color = body.color;

  const project = await Project.findByIdAndUpdate(params.id, update, { new: true });
  return NextResponse.json({ project });
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return bad("Unauthorized", 401);
  await connectDB();

  const data = await load(user.id, params.id);
  if (!data) return bad("Project not found", 404);
  if (data.membership.role !== "OWNER") return bad("Only the project owner can delete this project", 403);

  await Task.deleteMany({ projectId: params.id });
  await Membership.deleteMany({ projectId: params.id });
  await Project.findByIdAndDelete(params.id);
  return NextResponse.json({ ok: true });
}