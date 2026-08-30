import { NextResponse } from "next/server";
import { sessionCookie, sessionValue } from "../../../lib/auth";

export async function POST(request: Request) {
  const { password } = await request.json();
  if (!process.env.APP_PASSWORD || password !== process.env.APP_PASSWORD) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookie, sessionValue(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return response;
}
