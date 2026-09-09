import { APONTE_TREE, WILLIAMS_TREE, EMPTY_TREE } from "@/lib/mock-data";
import type { FamilyTreeRecord } from "@/lib/types";

export function normalizeCode(code: string) {
  return (code || "").trim().toUpperCase().replace(/\s+/g, "");
}

export function knownTrees(): FamilyTreeRecord[] {
  return [APONTE_TREE, WILLIAMS_TREE, EMPTY_TREE];
}

export function findTreeByInviteCode(code: string, extra: FamilyTreeRecord[] = []) {
  const normalized = normalizeCode(code);
  return [...extra, ...knownTrees()].find((tree) => normalizeCode(tree.inviteCode) === normalized);
}

export function findTreeByEditCode(code: string, extra: FamilyTreeRecord[] = []) {
  const normalized = normalizeCode(code);
  return [...extra, ...knownTrees()].find((tree) => normalizeCode(tree.editCode) === normalized);
}

export function matchesViewPasscode(tree: FamilyTreeRecord, passcode: string) {
  return normalizeCode(tree.viewPasscode) === normalizeCode(passcode);
}
