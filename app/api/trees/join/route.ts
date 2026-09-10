import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { findSnapshotByEditCode } from "@/lib/server-snapshots";

export async function POST(request: Request) {
  const body = (await request.json()) as { editCode?: string };
  const snapshot = await findSnapshotByEditCode(body.editCode || "");
  if (!snapshot) {
    return NextResponse.json({ ok: false, error: "That family join code isn’t valid." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, snapshot });
}
