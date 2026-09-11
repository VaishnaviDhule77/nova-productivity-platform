import { NextResponse } from "next/server";

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function readJson(req: Request): Promise<any | null> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}