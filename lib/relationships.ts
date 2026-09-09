import { childLabel, displayName } from "./format";
import type { ConnectionChoice, Person, Relationship, RelationshipType } from "./types";

const PARENT_TYPES: RelationshipType[] = ["parent", "adoptive_parent", "step_parent"];

export function getParents(personId: string, relationships: Relationship[]) {
  return relationships
    .filter((r) => PARENT_TYPES.includes(r.relationshipType) && r.relatedPersonId === personId)
    .map((r) => ({ id: r.personId, type: r.relationshipType }));
}

export function getChildren(personId: string, relationships: Relationship[]) {
  return relationships
    .filter((r) => PARENT_TYPES.includes(r.relationshipType) && r.personId === personId)
    .map((r) => ({ id: r.relatedPersonId, type: r.relationshipType }));
}

export function getPartners(personId: string, relationships: Relationship[]) {
  return relationships
    .filter(
      (r) =>
        (r.relationshipType === "spouse" || r.relationshipType === "partner") &&
        (r.personId === personId || r.relatedPersonId === personId),
    )
    .map((r) => ({
      id: r.personId === personId ? r.relatedPersonId : r.personId,
      type: r.relationshipType,
    }));
}

export function getSiblings(personId: string, relationships: Relationship[]) {
  const parentIds = getParents(personId, relationships).map((p) => p.id);
  if (parentIds.length === 0) {
    return relationships
      .filter(
        (r) =>
          r.relationshipType === "sibling" &&
          (r.personId === personId || r.relatedPersonId === personId),
      )
      .map((r) => (r.personId === personId ? r.relatedPersonId : r.personId));
  }

  const siblingIds = new Set<string>();
  for (const parentId of parentIds) {
    for (const child of getChildren(parentId, relationships)) {
      if (child.id !== personId) siblingIds.add(child.id);
    }
  }
  return [...siblingIds];
}

export function getGrandparents(personId: string, relationships: Relationship[]) {
  const ids = new Set<string>();
  for (const parent of getParents(personId, relationships)) {
    for (const gp of getParents(parent.id, relationships)) ids.add(gp.id);
  }
  return [...ids];
}

export function getGrandchildren(personId: string, relationships: Relationship[]) {
  const ids = new Set<string>();
  for (const child of getChildren(personId, relationships)) {
    for (const gc of getChildren(child.id, relationships)) ids.add(gc.id);
  }
  return [...ids];
}

export function hasParents(personId: string, relationships: Relationship[]) {
  return getParents(personId, relationships).length > 0;
}

export function isInLaw(personId: string, relationships: Relationship[]) {
  if (hasParents(personId, relationships)) return false;
  return getPartners(personId, relationships).some((partner) =>
    hasParents(partner.id, relationships),
  );
}

export function sharedChildren(a: string, b: string, relationships: Relationship[]) {
  const aChildren = new Set(getChildren(a, relationships).map((c) => c.id));
  return getChildren(b, relationships)
    .map((c) => c.id)
    .filter((id) => aChildren.has(id));
}

export function directoryRelationship(person: Person, people: Person[], relationships: Relationship[]) {
  const parents = getParents(person.id, relationships)
    .map((p) => people.find((x) => x.id === p.id))
    .filter(Boolean) as Person[];

  if (parents.length) {
    const primary =
      parents.find((p) => p.gender === "male") ??
      parents.find((p) => p.gender === "female") ??
      parents[0];
    return `${childLabel(person.gender)} of ${displayName(primary)}`;
  }

  const partners = getPartners(person.id, relationships)
    .map((p) => people.find((x) => x.id === p.id))
    .filter(Boolean) as Person[];
  if (partners.length) {
    return `${partners[0] && person.gender === "female" ? "Wife" : person.gender === "male" ? "Husband" : "Partner"} of ${displayName(partners[0])}`;
  }

  return "Family member";
}

export function generationCount(people: Person[]) {
  if (people.length === 0) return 0;
  return Math.max(...people.map((p) => p.generation || 1));
}

export function computeGenerations(people: Person[], relationships: Relationship[]): Person[] {
  const ids = new Set(people.map((p) => p.id));
  const gen = new Map<string, number>();
  const visiting = new Set<string>();

  function walk(id: string): number {
    if (!ids.has(id)) return 1;
    if (gen.has(id)) return gen.get(id)!;
    if (visiting.has(id)) return 1;
    visiting.add(id);
    const parents = getParents(id, relationships);
    const value = parents.length ? Math.max(...parents.map((p) => walk(p.id))) + 1 : 1;
    visiting.delete(id);
    gen.set(id, value);
    return value;
  }

  for (const person of people) walk(person.id);

  // Spouses inherit the generation of their partner when they have no parents in the tree
  for (const person of people) {
    if (hasParents(person.id, relationships)) continue;
    const partners = getPartners(person.id, relationships);
    if (!partners.length) continue;
    const partnerGens = partners
      .map((p) => gen.get(p.id))
      .filter((n): n is number => typeof n === "number");
    if (partnerGens.length) gen.set(person.id, Math.max(...partnerGens));
  }

  return people.map((person) => ({
    ...person,
    generation: gen.get(person.id) ?? person.generation ?? 1,
  }));
}

export function relationshipExists(
  relationships: Relationship[],
  personId: string,
  relatedPersonId: string,
  type: RelationshipType,
) {
  return relationships.some(
    (r) =>
      r.relationshipType === type &&
      ((r.personId === personId && r.relatedPersonId === relatedPersonId) ||
        ((type === "spouse" || type === "partner" || type === "sibling") &&
          r.personId === relatedPersonId &&
          r.relatedPersonId === personId)),
  );
}

export function connectionAlreadyExists(
  relationships: Relationship[],
  existingPersonId: string,
  anchorId: string,
  connection: ConnectionChoice,
) {
  switch (connection) {
    case "parent":
      return relationshipExists(relationships, existingPersonId, anchorId, "parent");
    case "child":
      return relationshipExists(relationships, anchorId, existingPersonId, "parent");
    case "spouse":
    case "partner":
      return (
        relationshipExists(relationships, anchorId, existingPersonId, "spouse") ||
        relationshipExists(relationships, anchorId, existingPersonId, "partner")
      );
    case "sibling":
      return getSiblings(anchorId, relationships).includes(existingPersonId);
    case "grandparent":
      return getGrandparents(anchorId, relationships).includes(existingPersonId);
    case "grandchild":
      return getGrandchildren(anchorId, relationships).includes(existingPersonId);
    default:
      return false;
  }
}
