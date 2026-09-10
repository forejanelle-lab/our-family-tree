import { cookies } from "next/headers";
import { normalizeEmail } from "@/lib/auth";

const COOKIE = "oft-session-v1";

export type Session = { id: string; email: string; name: string };

export async function readSession(): Promise<Session | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Session;
    if (!value?.email) return null;
    return { ...value, email: normalizeEmail(value.email) };
  } catch {
    return null;
  }
}

export async function writeSession(session: Session) {
  const jar = await cookies();
  jar.set(COOKIE, JSON.stringify({ ...session, email: normalizeEmail(session.email) }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
