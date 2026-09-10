import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { findAccount, upsertAccount } from "@/lib/server-accounts";
import { writeSession } from "@/lib/server-session";
import { hashPassword, normalizeEmail, type StoredAccount } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    password?: string;
    role?: StoredAccount["role"];
    id?: string;
    createdAt?: string;
  };

  const email = normalizeEmail(body.email ?? "");
  const name = (body.name ?? "").trim();
  const password = body.password ?? "";

  if (!name) return NextResponse.json({ ok: false, error: "Please add your name." }, { status: 400 });
  if (!email.includes("@")) return NextResponse.json({ ok: false, error: "Please use a valid email." }, { status: 400 });
  if (password.length < 8) {
    return NextResponse.json({ ok: false, error: "Use at least 8 characters." }, { status: 400 });
  }

  const existing = await findAccount(email);
  if (existing) {
    return NextResponse.json({ ok: false, error: "An account already exists for that email." }, { status: 409 });
  }

  const account: StoredAccount = {
    id: body.id || `user_${crypto.randomUUID()}`,
    name,
    email,
    passwordHash: await hashPassword(password),
    createdAt: body.createdAt || new Date().toISOString(),
    role: body.role || "owner",
  };

  await upsertAccount(account);
  await writeSession({ id: account.id, email: account.email, name: account.name });
  return NextResponse.json({
    ok: true,
    account,
    user: { id: account.id, name: account.name, email: account.email, role: account.role },
  });
}
