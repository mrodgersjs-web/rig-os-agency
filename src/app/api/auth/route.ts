import { NextResponse } from "next/server";
import { createUser, createSession, authenticate, getSession, destroySession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/auth — login or register
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rl = rateLimit(`auth:${ip}`, 10); // 10 auth attempts per minute
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limited. Try again in a minute." }, { status: 429 });
  }

  const body = await req.json();
  const { action, email, password, name } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  try {
    if (action === "register") {
      const existing = await import("@/lib/auth").then(m => m.getUserByEmail(email));
      if (existing) {
        return NextResponse.json({ error: "Email already registered" }, { status: 409 });
      }
      const user = createUser(email, name || email.split("@")[0], password);
      const token = createSession(user.id, ip, req.headers.get("user-agent") || "");

      const { password_hash, ...safeUser } = user as typeof user & { password_hash?: string };
      return NextResponse.json({ user: safeUser, token });
    }

    if (action === "login") {
      const user = authenticate(email, password);
      if (!user) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }
      const token = createSession(user.id, ip, req.headers.get("user-agent") || "");
      return NextResponse.json({ user, token });
    }

    return NextResponse.json({ error: "Unknown action. Use 'login' or 'register'." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }
}

// GET /api/auth — check current session
export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ authenticated: false });
  }

  const user = getSession(token);
  if (!user) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({ authenticated: true, user });
}

// DELETE /api/auth — logout
export async function DELETE(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (token) {
    destroySession(token);
  }
  return NextResponse.json({ ok: true });
}
