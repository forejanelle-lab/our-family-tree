import type { TreeSnapshot } from "@/lib/tree-snapshot";
import type { TreeStateSlice } from "@/lib/tree-sync-types";
import { useTreeStore } from "@/store/use-tree-store";

export function currentTreeSlice(): TreeStateSlice | null {
  const state = useTreeStore.getState();
  const tree = state.trees.find((item) => item.id === state.activeTreeId) ?? state.trees[0];
  if (!tree) return null;
  return {
    tree,
    people: state.people,
    relationships: state.relationships,
    photos: state.photos,
    stories: state.stories,
    events: state.events,
    sources: state.sources,
    activity: state.activity,
    userName: state.userName,
  };
}

export type { TreeStateSlice } from "@/lib/tree-sync-types";

async function readJson<T extends { ok: boolean; error?: string }>(response: Response, fallback: string): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return { ok: false, error: fallback } as T;
  }
}

export async function lookupTreeOnServer(inviteCode: string) {
  const response = await fetch("/api/trees/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inviteCode }),
  });
  return readJson<{ ok: true; name: string } | { ok: false; error: string }>(
    response,
    "We couldn’t find a tree with that invite code.",
  );
}

export async function viewTreeOnServer(inviteCode: string, passcode: string) {
  const response = await fetch("/api/trees/view", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inviteCode, passcode }),
  });
  return readJson<{ ok: true; snapshot: TreeSnapshot } | { ok: false; error: string }>(
    response,
    "We couldn’t open that family archive.",
  );
}

export async function loadMyTreeOnServer() {
  const response = await fetch("/api/trees", { method: "GET" });
  return readJson<{ ok: true; snapshot: TreeSnapshot | null } | { ok: false; error: string }>(
    response,
    "Sign in to open your archive.",
  );
}

export async function joinTreeOnServer(editCode: string) {
  const response = await fetch("/api/trees/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ editCode }),
  });
  return readJson<{ ok: true; snapshot: TreeSnapshot } | { ok: false; error: string }>(
    response,
    "That family join code isn’t valid.",
  );
}

export function applySavedShareCodes(snapshot: TreeSnapshot) {
  const state = useTreeStore.getState();
  const tree = state.trees.find((item) => item.id === snapshot.tree.id) ?? state.trees[0];
  if (
    tree &&
    tree.inviteCode === snapshot.tree.inviteCode &&
    tree.viewPasscode === snapshot.tree.viewPasscode &&
    tree.editCode === snapshot.tree.editCode
  ) {
    return;
  }
  state.updateTree({
    inviteCode: snapshot.tree.inviteCode,
    viewPasscode: snapshot.tree.viewPasscode,
    editCode: snapshot.tree.editCode,
  });
}

export async function saveMyTreeOnServer(slice: TreeStateSlice, ownerEmail: string) {
  const response = await fetch("/api/trees", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...slice, ownerEmail }),
  });
  return readJson<{ ok: true; snapshot: TreeSnapshot } | { ok: false; error: string }>(
    response,
    "The archive could not be saved on the server.",
  );
}
