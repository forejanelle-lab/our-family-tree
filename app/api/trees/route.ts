import { NextResponse } from "next/server";
import { findSnapshotByOwner, upsertSnapshot } from "@/lib/server-snapshots";
import { readSession } from "@/lib/server-session";
import type { TreeSnapshot } from "@/lib/tree-snapshot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function compactPhotos(snapshot: TreeSnapshot): TreeSnapshot {
  const json = JSON.stringify(snapshot);
  if (json.length < 2_500_000) return snapshot;
  return {
    ...snapshot,
    people: snapshot.people.map((person) => ({
      ...person,
      profilePhotoUrl: person.profilePhotoUrl.startsWith("data:") ? "" : person.profilePhotoUrl,
    })),
    photos: snapshot.photos.map((photo) => ({
      ...photo,
      url: photo.url.startsWith("data:") ? "" : photo.url,
    })),
  };
}

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false, error: "Sign in to open your archive." }, { status: 401 });
  try {
    const snapshot = await findSnapshotByOwner(session.email);
    return NextResponse.json({ ok: true, snapshot });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "The archive could not be opened." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false, error: "Sign in to save your archive." }, { status: 401 });

  try {
    const body = (await request.json()) as Partial<TreeSnapshot>;
    if (!body.tree || !Array.isArray(body.people)) {
      return NextResponse.json({ ok: false, error: "That archive could not be saved." }, { status: 400 });
    }

    const existing = await findSnapshotByOwner(session.email);
    if ((body.people?.length || 0) === 0 && (existing?.people.length || 0) > 0) {
      return NextResponse.json({ ok: true, snapshot: existing });
    }

    const snapshot = await upsertSnapshot(
      compactPhotos({
        ownerEmail: session.email,
        tree: body.tree,
        people: body.people || [],
        relationships: body.relationships || [],
        photos: body.photos || [],
        stories: body.stories || [],
        events: body.events || [],
        sources: body.sources || [],
        activity: body.activity || [],
        userName: body.userName || session.name,
        updatedAt: new Date().toISOString(),
      }),
    );

    return NextResponse.json({ ok: true, snapshot });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "The archive could not be saved on the server. Try again in a moment." },
      { status: 500 },
    );
  }
}
