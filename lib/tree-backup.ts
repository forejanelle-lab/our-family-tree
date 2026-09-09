import type { ActivityItem, FamilyEvent, FamilyTreeRecord, Person, Photo, Relationship, Source, Story } from "@/lib/types";

export const TREE_BACKUP_KEY = "our-family-tree-backup-v1";

export type TreeBackup = {
  trees: FamilyTreeRecord[];
  activeTreeId: string;
  people: Person[];
  relationships: Relationship[];
  photos: Photo[];
  stories: Story[];
  events: FamilyEvent[];
  sources: Source[];
  activity: ActivityItem[];
  selectedPersonId: string | null;
  userName: string;
};

export function snapshotFromTreeState(state: TreeBackup): TreeBackup {
  return {
    trees: state.trees,
    activeTreeId: state.activeTreeId,
    people: state.people,
    relationships: state.relationships,
    photos: state.photos,
    stories: state.stories,
    events: state.events,
    sources: state.sources,
    activity: state.activity,
    selectedPersonId: state.selectedPersonId,
    userName: state.userName,
  };
}

export function writeTreeBackup(state: TreeBackup) {
  if (typeof window === "undefined") return;
  if (!state.people.length) return;
  window.localStorage.setItem(TREE_BACKUP_KEY, JSON.stringify(snapshotFromTreeState(state)));
}

export function readTreeBackup(): TreeBackup | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TREE_BACKUP_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as TreeBackup;
    if (!Array.isArray(saved.people) || saved.people.length === 0) return null;
    return saved;
  } catch {
    return null;
  }
}

export function clearTreeBackup() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TREE_BACKUP_KEY);
}
