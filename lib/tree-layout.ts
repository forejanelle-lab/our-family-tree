import {
  getChildren,
  getParents,
  getPartners,
  hasParents,
  isInLaw,
} from "./relationships";
import type { Person, Relationship } from "./types";

export const PERSON_NODE_WIDTH = 188;
export const PERSON_NODE_HEIGHT = 214;
export const COUPLE_GAP = 36;
export const UNIT_GAP = 64;
export const GENERATION_GAP = 128;
export const UNION_SIZE = 14;

export type LayoutNodeType = "person" | "union";

export interface LayoutNode {
  id: string;
  type: LayoutNodeType;
  personId?: string;
  x: number;
  y: number;
}

export interface LayoutEdge {
  id: string;
  source: string;
  target: string;
  type: "spouse" | "child";
}

export interface TreeLayout {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
}

function unique(ids: string[]) {
  return [...new Set(ids)];
}

function partnerIdsOf(id: string, relationships: Relationship[]) {
  return unique(getPartners(id, relationships).map((p) => p.id));
}

function childIdsOf(id: string, relationships: Relationship[]) {
  return unique(getChildren(id, relationships).map((c) => c.id));
}

function unionChildren(partnerIds: string[], relationships: Relationship[]) {
  const counts = new Map<string, number>();
  for (const pid of partnerIds) {
    for (const cid of childIdsOf(pid, relationships)) {
      counts.set(cid, (counts.get(cid) ?? 0) + 1);
    }
  }
  const shared = [...counts.entries()].filter(([, n]) => n >= Math.min(2, partnerIds.length)).map(([id]) => id);
  if (shared.length) return shared;
  return unique(partnerIds.flatMap((pid) => childIdsOf(pid, relationships)));
}

function extraPartners(personId: string, primaryPartner: string | undefined, relationships: Relationship[]) {
  return partnerIdsOf(personId, relationships).filter((id) => id !== primaryPartner);
}

export function layoutFamilyTree(
  people: Person[],
  relationships: Relationship[],
  options?: { maxGeneration?: number },
): TreeLayout {
  const byId = new Map(people.map((p) => [p.id, p]));
  const visible = new Set(people.map((p) => p.id));
  const maxGen = options?.maxGeneration ?? Infinity;

  const placedPeople = new Set<string>();
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];

  function personVisible(id: string) {
    const person = byId.get(id);
    if (!person || !visible.has(id)) return false;
    return (person.generation || 1) <= maxGen;
  }

  function primaryPartner(id: string) {
    const partners = partnerIdsOf(id, relationships).filter(personVisible);
    if (!partners.length) return undefined;
    const blood = partners.find((pid) => hasParents(pid, relationships) || !isInLaw(pid, relationships));
    return blood ?? partners[0];
  }

  function orderCouple(bloodId: string, partners: string[]) {
    const person = byId.get(bloodId);
    const others = partners.filter((id) => id !== bloodId && personVisible(id));
    const all = [bloodId, ...others];
    if (others.length === 1 && person && !hasParents(bloodId, relationships) && !isInLaw(bloodId, relationships)) {
      const [a, b] = all;
      const pa = byId.get(a);
      const pb = byId.get(b);
      if (pa?.gender === "male") return [a, b];
      if (pb?.gender === "male") return [b, a];
    }
    return all;
  }

  function unitPartners(bloodId: string) {
    const partner = primaryPartner(bloodId);
    return orderCouple(bloodId, partner ? [bloodId, partner] : [bloodId]);
  }

  function childUnits(partners: string[]): string[] {
    const children = unionChildren(partners, relationships).filter(personVisible);
    return children.sort((a, b) => {
      const pa = byId.get(a);
      const pb = byId.get(b);
      return (pa?.birthDate || "").localeCompare(pb?.birthDate || "");
    });
  }

  function subtreeWidth(bloodId: string): number {
    if (!personVisible(bloodId)) return 0;
    const partners = unitPartners(bloodId);
    const coupleWidth =
      partners.length * PERSON_NODE_WIDTH + Math.max(0, partners.length - 1) * COUPLE_GAP;
    const extras = extraPartners(bloodId, partners.find((id) => id !== bloodId), relationships).filter(personVisible);
    const extraWidth = extras.length * (PERSON_NODE_WIDTH + UNIT_GAP);
    const children = childUnits(partners);
    const childrenWidth = children.reduce((sum, cid, index) => {
      const w = subtreeWidth(cid);
      return sum + w + (index > 0 && w > 0 ? UNIT_GAP : 0);
    }, 0);
    return Math.max(coupleWidth + extraWidth, childrenWidth, PERSON_NODE_WIDTH);
  }

  function place(bloodId: string, originX: number, originY: number) {
    if (!personVisible(bloodId) || placedPeople.has(bloodId)) return;
    const partners = unitPartners(bloodId);
    const width = subtreeWidth(bloodId);
    const extras = extraPartners(bloodId, partners.find((id) => id !== bloodId), relationships).filter(
      (id) => personVisible(id) && !placedPeople.has(id),
    );
    const coupleWidth = partners.length * PERSON_NODE_WIDTH + Math.max(0, partners.length - 1) * COUPLE_GAP;
    const extraWidth = extras.length * (PERSON_NODE_WIDTH + COUPLE_GAP);
    const topWidth = coupleWidth + extraWidth;
    let x = originX + Math.max(0, (width - topWidth) / 2);

    const partnerPositions: { id: string; x: number }[] = [];
    for (const pid of partners) {
      if (placedPeople.has(pid)) continue;
      nodes.push({ id: `person-${pid}`, type: "person", personId: pid, x, y: originY });
      placedPeople.add(pid);
      partnerPositions.push({ id: pid, x });
      x += PERSON_NODE_WIDTH + COUPLE_GAP;
    }
    for (const pid of extras) {
      nodes.push({ id: `person-${pid}`, type: "person", personId: pid, x, y: originY });
      placedPeople.add(pid);
      partnerPositions.push({ id: pid, x });
      x += PERSON_NODE_WIDTH + COUPLE_GAP;
    }

    if (partnerPositions.length >= 2) {
      for (let i = 0; i < partnerPositions.length - 1; i += 1) {
        const a = partnerPositions[i];
        const b = partnerPositions[i + 1];
        edges.push({
          id: `spouse-${a.id}-${b.id}`,
          source: `person-${a.id}`,
          target: `person-${b.id}`,
          type: "spouse",
        });
      }
    }

    const children = childUnits(partners);
    if (!children.length) return;

    const leftmost = partnerPositions[0];
    const rightmost = partnerPositions[partnerPositions.length - 1];
    const unionX =
      ((leftmost?.x ?? originX) + (rightmost?.x ?? originX) + PERSON_NODE_WIDTH) / 2 - UNION_SIZE / 2;
    const unionY = originY + PERSON_NODE_HEIGHT + 18;
    const unionId = `union-${partners.join("-")}`;
    nodes.push({ id: unionId, type: "union", x: unionX, y: unionY });

    for (const pid of partners) {
      edges.push({
        id: `to-union-${pid}`,
        source: `person-${pid}`,
        target: unionId,
        type: "child",
      });
    }

    const childY = originY + PERSON_NODE_HEIGHT + GENERATION_GAP;
    let childX = originX;
    for (const childId of children) {
      const w = subtreeWidth(childId);
      place(childId, childX, childY);
      edges.push({
        id: `child-${unionId}-${childId}`,
        source: unionId,
        target: `person-${childId}`,
        type: "child",
      });
      childX += w + UNIT_GAP;
    }
  }

  const roots = people
    .filter((p) => personVisible(p.id) && !hasParents(p.id, relationships) && !isInLaw(p.id, relationships))
    .sort((a, b) => a.birthDate.localeCompare(b.birthDate));

  const rootBlood: string[] = [];
  const seenRoot = new Set<string>();
  for (const root of roots) {
    if (seenRoot.has(root.id)) continue;
    const partners = unitPartners(root.id);
    partners.forEach((id) => seenRoot.add(id));
    rootBlood.push(root.id);
  }

  let cursorX = 80;
  const originY = 80;
  for (const id of rootBlood) {
    const w = subtreeWidth(id);
    place(id, cursorX, originY);
    cursorX += w + UNIT_GAP * 1.5;
  }

  // Place anyone the layout missed (disconnected people)
  const missing = people.filter((p) => personVisible(p.id) && !placedPeople.has(p.id));
  let missX = 80;
  const missY =
    nodes.reduce((max, n) => Math.max(max, n.y), originY) + PERSON_NODE_HEIGHT + GENERATION_GAP;
  for (const person of missing) {
    nodes.push({
      id: `person-${person.id}`,
      type: "person",
      personId: person.id,
      x: missX,
      y: missY,
    });
    missX += PERSON_NODE_WIDTH + UNIT_GAP;
  }

  const width = nodes.reduce((max, n) => Math.max(max, n.x), 0) + PERSON_NODE_WIDTH + 80;
  const height = nodes.reduce((max, n) => Math.max(max, n.y), 0) + PERSON_NODE_HEIGHT + 80;

  return { nodes, edges, width, height };
}
