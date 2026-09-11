import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Project, Membership, Task, User } from "@/lib/models";
import { getSessionUser } from "@/lib/auth";
import { bad, readJson } from "@/lib/api";

type Params = { params: { id: string } };

async function requireOwner(userId: string, projectId: string) {
  if (!mongoose.isValidObjectId(projectId)) return { error: "Project not found", status: 404 } as const;
  const membership = await Membership.findOne({ userId, projectId });
  if (!membership) return { error: "Project not found", status: 404 } as const;
  if (membership.role !== "OWNER") return { error: "Only the project owner can manage members", status: 403 } as const;
  return null;
}

export async function POST(req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return bad("Unauthorized", 401);
  await connectDB();

  const denied = await requireOwner(user.id, params.id);
  if (denied) return bad(denied.error, denied.status);

  const body = await readJson(req);
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!email) return bad("Email is required");

  const invitee = await User.findOne({ email });
  if (!invitee) return bad("No NOVA account with that email — ask them to sign up first", 404);

  const existing = await Membership.findOne({ userId: invitee._id, projectId: params.id });
  if (existing) return bad("That person is already a member", 409);

  const membership = await Membership.create({ userId: invitee._id, projectId: params.id, role: "MEMBER" });
  return NextResponse.json(
    { member: { id: String(invitee._id), name: invitee.name, email: invitee.email, role: membership.role } },
    { status: 201 }
  );
}

export async function DELETE(req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return bad("Unauthorized", 401);
  await connectDB();

  const denied = await requireOwner(user.id, params.id);
  if (denied) return bad(denied.error, denied.status);

  const body = await readJson(req);
  const userId = String(body?.userId ?? "");
  if (!userId) return bad("userId is required");

  const project = await Project.findById(params.id);
  if (!project) return bad("Project not found", 404);
  if (String(project.ownerId) === userId) return bad("The project owner cannot be removed");

  await Task.updateMany({ projectId: params.id, assigneeId: userId }, { assigneeId: null });
  await Membership.findOneAndDelete({ userId, projectId: params.id });
  return NextResponse.json({ ok: true });
}