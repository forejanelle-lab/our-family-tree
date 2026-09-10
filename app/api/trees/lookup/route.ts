import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { findSnapshotByInvite } from "@/lib/server-snapshots";

export async function POST(request: Request) {
  const body = (await request.json()) as { inviteCode?: string };
  const snapshot = await findSnapshotByInvite(body.inviteCode || "");
  if (!snapshot) {
    return NextResponse.json({ ok: false, error: "We couldn’t find a tree with that invite code." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, name: snapshot.tree.name });
}
