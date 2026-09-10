import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeCode } from "@/lib/invites";
import { withUniqueShareCodes } from "@/lib/share-codes";
import type { TreeSnapshot } from "@/lib/tree-snapshot";

const FILE = path.join(process.cwd(), "data", "family-trees.json");
const TMP = "/tmp/oft-family-trees.json";
const BLOB_PATH = "oft/family-trees.json";
const KV_KEY = "oft-family-trees";

const globalForTrees = globalThis as typeof globalThis & {
  __oftSnapshots?: TreeSnapshot[];
};

function asList(value: unknown): TreeSnapshot[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && typeof item === "object" && "tree" in item) as TreeSnapshot[];
}

function mergeSnapshots(groups: TreeSnapshot[][]) {
  const byId = new Map<string, TreeSnapshot>();
  for (const group of groups) {
    for (const item of group) {
      const id = item.tree?.id;
      if (!id) continue;
      const current = byId.get(id);
      if (!current || (item.updatedAt || "") >= (current.updatedAt || "")) {
        byId.set(id, item);
      }
    }
  }
  return [...byId.values()];
}

async function streamToText(stream: unknown) {
  if (!stream) return "";
  if (typeof (stream as { getReader?: unknown }).getReader === "function") {
    return new Response(stream as ReadableStream).text();
  }
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer | Uint8Array | string>) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function readFileStore() {
  for (const file of [FILE, TMP]) {
    try {
      const raw = await readFile(file, "utf8");
      const parsed = asList(JSON.parse(raw));
      if (parsed.length) return parsed;
    } catch {
      // try the next location
    }
  }
  return [];
}

async function writeFileStore(snapshots: TreeSnapshot[]) {
  const payload = JSON.stringify(snapshots);
  let wrote = false;
  await Promise.all(
    [FILE, TMP].map(async (file) => {
      try {
        await mkdir(path.dirname(file), { recursive: true });
        await writeFile(file, payload, "utf8");
        wrote = true;
      } catch {
        // Vercel’s app filesystem is read-only except /tmp
      }
    }),
  );
  return wrote;
}

async function readBlobStore() {
  try {
    const { get } = await import("@vercel/blob");
    const result = await get(BLOB_PATH, { access: "private", useCache: false });
    if (!result?.stream) return [];
    return asList(JSON.parse(await streamToText(result.stream)));
  } catch {
    return [];
  }
}

async function writeBlobStore(snapshots: TreeSnapshot[]) {
  const { put } = await import("@vercel/blob");
  await put(BLOB_PATH, JSON.stringify(snapshots), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
    contentType: "application/json",
  });
}

async function readKvStore() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return [];
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(["GET", KV_KEY]),
    });
    const payload = (await response.json()) as { result?: string | null };
    if (!payload.result) return [];
    return asList(JSON.parse(payload.result));
  } catch {
    return [];
  }
}

async function writeKvStore(snapshots: TreeSnapshot[]) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return false;
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(["SET", KV_KEY, JSON.stringify(snapshots)]),
  });
  return response.ok;
}

async function readSupabaseStore() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  try {
    const response = await fetch(`${url}/rest/v1/tree_snapshots?select=snapshot`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!response.ok) return [];
    const rows = (await response.json()) as { snapshot: TreeSnapshot }[];
    return rows.map((row) => row.snapshot).filter(Boolean);
  } catch {
    return [];
  }
}

async function writeSupabaseStore(snapshots: TreeSnapshot[]) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return false;
  const rows = snapshots.map((snapshot) => ({
    id: snapshot.tree.id,
    owner_email: snapshot.ownerEmail,
    invite_code: snapshot.tree.inviteCode,
    view_passcode: snapshot.tree.viewPasscode,
    edit_code: snapshot.tree.editCode,
    snapshot,
    updated_at: snapshot.updatedAt,
  }));
  const response = await fetch(`${url}/rest/v1/tree_snapshots?on_conflict=id`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  });
  return response.ok;
}

export async function readSnapshots(): Promise<TreeSnapshot[]> {
  const groups = await Promise.all([
    Promise.resolve(globalForTrees.__oftSnapshots ?? []),
    readFileStore(),
    readBlobStore(),
    readKvStore(),
    readSupabaseStore(),
  ]);
  const merged = mergeSnapshots(groups);
  globalForTrees.__oftSnapshots = merged;
  return merged;
}

export async function writeSnapshots(snapshots: TreeSnapshot[]) {
  globalForTrees.__oftSnapshots = snapshots;
  const fileOk = await writeFileStore(snapshots).catch(() => false);
  let blobOk = false;
  try {
    await writeBlobStore(snapshots);
    blobOk = true;
  } catch (error) {
    console.error("Blob archive write failed", error);
  }
  const kvOk = await writeKvStore(snapshots).catch(() => false);
  const supabaseOk = await writeSupabaseStore(snapshots).catch(() => false);
  const durable = blobOk || kvOk || supabaseOk;
  if (!durable && process.env.VERCEL) {
    throw new Error("The archive could not be saved on the server.");
  }
  if (!durable && !fileOk) {
    throw new Error("The archive could not be saved on the server.");
  }
  return snapshots;
}

function takenCodes(snapshots: TreeSnapshot[], exceptId?: string) {
  return snapshots.flatMap((item) =>
    item.tree.id === exceptId ? [] : [item.tree.inviteCode, item.tree.viewPasscode, item.tree.editCode],
  );
}

export async function upsertSnapshot(input: TreeSnapshot) {
  const current = await readSnapshots();
  const tree = withUniqueShareCodes(input.tree, takenCodes(current, input.tree.id));
  const snapshot: TreeSnapshot = {
    ...input,
    tree,
    ownerEmail: (input.ownerEmail || "").trim().toLowerCase(),
    updatedAt: new Date().toISOString(),
  };
  const next = [
    ...current.filter((item) => item.tree.id !== snapshot.tree.id && item.ownerEmail !== snapshot.ownerEmail),
    snapshot,
  ];
  await writeSnapshots(next);
  return snapshot;
}

export async function findSnapshotByOwner(email: string) {
  const snapshots = await readSnapshots();
  const normalized = email.trim().toLowerCase();
  return snapshots.find((item) => item.ownerEmail === normalized) ?? null;
}

export async function findSnapshotByInvite(code: string) {
  const snapshots = await readSnapshots();
  const normalized = normalizeCode(code);
  return snapshots.find((item) => normalizeCode(item.tree.inviteCode) === normalized) ?? null;
}

export async function findSnapshotByEditCode(code: string) {
  const snapshots = await readSnapshots();
  const normalized = normalizeCode(code);
  return snapshots.find((item) => normalizeCode(item.tree.editCode) === normalized) ?? null;
}
