const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const URI = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/nova";

const User = mongoose.model("User", new mongoose.Schema(
  { name: String, email: String, passwordHash: String }, { timestamps: true }));
const Project = mongoose.model("Project", new mongoose.Schema(
  { name: String, description: String, color: String, ownerId: Object }, { timestamps: true }));
const Membership = mongoose.model("Membership", new mongoose.Schema(
  { userId: Object, projectId: Object, role: String }, { timestamps: true }));
const Task = mongoose.model("Task", new mongoose.Schema(
  { title: String, description: String, status: String, priority: String, dueDate: Date, assigneeId: Object, projectId: Object },
  { timestamps: true }));

async function main() {
  await mongoose.connect(URI);
  console.log("Connected — seeding…");

  await Promise.all([User.deleteMany(), Project.deleteMany(), Membership.deleteMany(), Task.deleteMany()]);

  const passwordHash = bcrypt.hashSync("password123", 10);
  const [alice, bob, carol] = await User.create([
    { name: "Alice Chen", email: "alice@nova.app", passwordHash },
    { name: "Bob Martinez", email: "bob@nova.app", passwordHash },
    { name: "Carol Okafor", email: "carol@nova.app", passwordHash },
  ]);

  const website = await Project.create({
    name: "Website Redesign",
    description: "Refresh the marketing site with the new brand system.",
    color: "#6366f1",
    ownerId: alice._id,
  });
  const app = await Project.create({
    name: "Mobile App v2",
    description: "Offline sync, notifications, and a new onboarding flow.",
    color: "#ec4899",
    ownerId: bob._id,
  });

  await Membership.insertMany([
    { userId: alice._id, projectId: website._id, role: "OWNER" },
    { userId: bob._id, projectId: website._id, role: "MEMBER" },
    { userId: carol._id, projectId: website._id, role: "MEMBER" },
    { userId: bob._id, projectId: app._id, role: "OWNER" },
    { userId: alice._id, projectId: app._id, role: "MEMBER" },
  ]);

  const day = 86400000;
  await Task.insertMany([
    { projectId: website._id, title: "Audit current site analytics", description: "Top pages, drop-off points, search terms.", status: "DONE", priority: "MEDIUM", assigneeId: alice._id },
    { projectId: website._id, title: "Define brand colors & typography", status: "DONE", priority: "HIGH", assigneeId: carol._id },
    { projectId: website._id, title: "Design homepage hero", status: "IN_PROGRESS", priority: "HIGH", assigneeId: carol._id, dueDate: new Date(Date.now() + 2 * day) },
    { projectId: website._id, title: "Build pricing page component", status: "TODO", priority: "MEDIUM", assigneeId: bob._id, dueDate: new Date(Date.now() + 5 * day) },
    { projectId: website._id, title: "Write CMS migration guide", status: "TODO", priority: "LOW", dueDate: new Date(Date.now() - day) },
    { projectId: app._id, title: "Set up CI pipeline", status: "DONE", priority: "HIGH", assigneeId: bob._id },
    { projectId: app._id, title: "Implement offline queue", status: "IN_PROGRESS", priority: "HIGH", assigneeId: alice._id, dueDate: new Date(Date.now() + 3 * day) },
    { projectId: app._id, title: "Push notification service", status: "TODO", priority: "MEDIUM", assigneeId: bob._id },
    { projectId: app._id, title: "Onboarding screens prototype", status: "TODO", priority: "MEDIUM", assigneeId: alice._id, dueDate: new Date(Date.now() + 7 * day) },
  ]);

  console.log("✓ Seeded. Log in with alice@nova.app / password123 (also bob@, carol@)");
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });