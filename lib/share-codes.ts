import { isPlaceholderShareCode } from "@/lib/tree-snapshot";
import type { FamilyTreeRecord } from "@/lib/types";

const INVITES = ["MAPLE", "CEDAR", "OLIVE", "WILLOW", "LAUREL", "ROWAN", "ALDER", "HAZEL", "ASPEN", "BIRCH", "HOLLY", "MYRTLE"];
const PASSES = ["RIVER", "STONE", "MOSS", "AMBER", "HONEY", "QUIET", "NORTH", "DAWN", "GROVE", "MEADOW"];
const JOINS = ["OAK", "PINE", "ELM", "FIG", "IVY", "FERN"];

function pick(list: string[]) {
  return list[Math.floor(Math.random() * list.length)] || list[0];
}

function digits() {
  return String(Math.floor(10 + Math.random() * 90));
}

export function generateShareCodes(taken: Set<string>) {
  let invite = `${pick(INVITES)}${digits()}`;
  let guard = 0;
  while (taken.has(invite) || isPlaceholderShareCode(invite)) {
    invite = `${pick(INVITES)}${digits()}${guard > 8 ? String(Date.now()).slice(-2) : ""}`;
    guard += 1;
    if (guard > 20) break;
  }
  let pass = pick(PASSES);
  guard = 0;
  while (taken.has(pass) || isPlaceholderShareCode(pass)) {
    pass = `${pick(PASSES)}${digits()}`;
    guard += 1;
    if (guard > 20) break;
  }
  let edit = `${pick(JOINS)}-${new Date().getFullYear()}`;
  guard = 0;
  while (taken.has(edit) || isPlaceholderShareCode(edit)) {
    edit = `${pick(JOINS)}-${digits()}${new Date().getFullYear().toString().slice(-2)}`;
    guard += 1;
    if (guard > 20) break;
  }
  return { inviteCode: invite, viewPasscode: pass, editCode: edit };
}

export function withUniqueShareCodes(tree: FamilyTreeRecord, taken: string[] = []): FamilyTreeRecord {
  const used = new Set(taken.map((code) => code.toUpperCase()));
  const needsNew =
    isPlaceholderShareCode(tree.inviteCode) ||
    isPlaceholderShareCode(tree.viewPasscode) ||
    isPlaceholderShareCode(tree.editCode) ||
    used.has(tree.inviteCode.toUpperCase());
  if (!needsNew) return tree;
  const codes = generateShareCodes(used);
  return { ...tree, ...codes };
}
