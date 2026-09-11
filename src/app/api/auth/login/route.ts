import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { createSession, verifyPassword } from "@/lib/auth";
import { bad, readJson } from "@/lib/api";

export async function POST(req: Request) {
  await connectDB();
  const body = await readJson(req);
  if (!body) return bad("Invalid request body");

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!email || !password) return bad("Email and password are required");

  const user = await User.findOne({ email });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return bad("Invalid email or password", 401);
  }

  await createSession(String(user._id));
  return NextResponse.json({ user: { id: String(user._id), name: user.name, email: user.email } });
}