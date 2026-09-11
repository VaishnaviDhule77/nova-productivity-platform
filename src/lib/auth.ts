import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { connectDB } from "./db";
import { User } from "./models";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret-change-me");
const COOKIE = "nova_session";

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compareSync(password, hash);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export function destroySession() {
  cookies().delete(COOKIE);
}

export async function getSessionUser() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    await connectDB();
    const user = await User.findById(payload.sub as string).select("name email");
    if (!user) return null;
    return { id: String(user._id), name: user.name, email: user.email };
  } catch {
    return null;
  }
}