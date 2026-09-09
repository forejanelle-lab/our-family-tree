import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { findAccount, upsertAccount } from "@/lib/server-accounts";
import { firstNameFrom, hashPassword, normalizeEmail, type StoredAccount } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string; name?: string };
  const email = normalizeEmail(body.email ?? "");
  const password = body.password ?? "";

  if (!email.includes("@") || password.length < 8) {
    return NextResponse.json({ ok: false, error: "Check your email and password." }, { status: 400 });
  }

  let account = await findAccount(email);
  if (!account) {
    const created: StoredAccount = {
      id: `user_${crypto.randomUUID()}`,
      name: (body.name ?? "").trim() || firstNameFrom(email.split("@")[0] || "Family"),
      email,
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString(),
      role: "owner",
    };
    await upsertAccount(created);
    account = created;
  } else if (account.passwordHash !== (await hashPassword(password))) {
    return NextResponse.json({ ok: false, error: "That password doesn’t match." }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    account,
    user: { id: account.id, name: account.name, email: account.email, role: account.role },
  });
}
