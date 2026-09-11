import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { createSession, hashPassword } from "@/lib/auth";
import { bad, readJson } from "@/lib/api";

export async function POST(req: Request) {
  await connectDB();
  const body = await readJson(req);
  if (!body) return bad("Invalid request body");

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!name || !email || !password) return bad("Name, email and password are required");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("Please enter a valid email address");
  if (password.length < 6) return bad("Password must be at least 6 characters");

  const existing = await User.findOne({ email });
  if (existing) return bad("An account with this email already exists", 409);

  const user = await User.create({ name, email, passwordHash: hashPassword(password) });
  await createSession(String(user._id));

  return NextResponse.json({ user: { id: String(user._id), name: user.name, email: user.email } }, { status: 201 });
}