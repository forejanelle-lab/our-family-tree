import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { matchesViewPasscode } from "@/lib/invites";
import { findSnapshotByInvite } from "@/lib/server-snapshots";

export async function POST(request: Request) {
  const body = (await request.json()) as { inviteCode?: string; passcode?: string };
  const snapshot = await findSnapshotByInvite(body.inviteCode || "");
  if (!snapshot) {
    return NextResponse.json({ ok: false, error: "We couldn’t find a tree with that invite code." }, { status: 404 });
  }
  if (!matchesViewPasscode(snapshot.tree, body.passcode || "")) {
    return NextResponse.json({ ok: false, error: "That passcode doesn’t match this family archive." }, { status: 401 });
  }
  return NextResponse.json({ ok: true, snapshot });
}
