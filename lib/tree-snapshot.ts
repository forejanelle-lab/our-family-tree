import type {
  ActivityItem,
  FamilyEvent,
  FamilyTreeRecord,
  Person,
  Photo,
  Relationship,
  Source,
  Story,
} from "@/lib/types";

export interface TreeSnapshot {
  ownerEmail: string;
  tree: FamilyTreeRecord;
  people: Person[];
  relationships: Relationship[];
  photos: Photo[];
  stories: Story[];
  events: FamilyEvent[];
  sources: Source[];
  activity: ActivityItem[];
  userName: string;
  updatedAt: string;
}

export function isPlaceholderShareCode(code: string) {
  return ["FAMILY", "PEACE", "ROOT-JOIN", "WILLIAMS", "ROSE", "APONTE", "HOME", "FORE-2026", "OAK-1935"].includes(
    (code || "").trim().toUpperCase(),
  );
}
