import { Schema, model, models } from "mongoose";

// Shared toJSON: exposes `id` (string) instead of `_id`, hides internals,
// and strips passwordHash so it can never leak into a JSON response.
const toJSON = {
  transform(_doc: unknown, ret: Record<string, unknown>) {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  },
};

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true, toJSON }
);

const projectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: null },
    color: { type: String, default: "#6366f1" },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, toJSON }
);

const membershipSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    role: { type: String, enum: ["OWNER", "MEMBER"], default: "MEMBER" },
  },
  { timestamps: true, toJSON }
);
membershipSchema.index({ userId: 1, projectId: 1 }, { unique: true });
membershipSchema.index({ projectId: 1 });

const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: null },
    status: { type: String, enum: ["TODO", "IN_PROGRESS", "DONE"], default: "TODO" },
    priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
    dueDate: { type: Date, default: null },
    assigneeId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
  },
  { timestamps: true, toJSON }
);
taskSchema.index({ projectId: 1 });
taskSchema.index({ assigneeId: 1 });

export const User = models.User ?? model("User", userSchema);
export const Project = models.Project ?? model("Project", projectSchema);
export const Membership = models.Membership ?? model("Membership", membershipSchema);
export const Task = models.Task ?? model("Task", taskSchema);

export function serializeTask(t: any) {
  const a = t.assigneeId;
  return {
    id: String(t._id),
    title: t.title,
    description: t.description ?? null,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate ?? null,
    assignee: a && typeof a === "object" && a._id ? { id: String(a._id), name: a.name } : null,
  };
}

export function populatedUser(v: unknown): { id: string; name: string; email: string } {
  const u = v as { _id: unknown; name: string; email: string };
  return { id: String(u._id), name: u.name, email: u.email };
}