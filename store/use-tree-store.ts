import { create } from "zustand";
import { persist } from "zustand/middleware";
import { newId } from "@/lib/format";
import {
  APONTE_ACTIVITY,
  APONTE_EVENTS,
  APONTE_PEOPLE,
  APONTE_PHOTOS,
  APONTE_RELATIONSHIPS,
  APONTE_SOURCES,
  APONTE_STORIES,
  APONTE_TREE,
  EMPTY_TREE,
} from "@/lib/mock-data";
import {
  computeGenerations,
  getChildren,
  getParents,
  getPartners,
  relationshipExists,
  unlinkPeople,
  type UnlinkKind,
} from "@/lib/relationships";
import type {
  ActivityItem,
  ConnectionChoice,
  FamilyEvent,
  FamilyTreeRecord,
  Person,
  PersonDraft,
  Photo,
  Relationship,
  RelationshipType,
  ShareAccess,
  Source,
  Story,
} from "@/lib/types";
import { defaultPrivacy, emptyPersonDraft } from "@/lib/types";
import { clearTreeBackup } from "@/lib/tree-backup";

export type SaveState = "saved" | "saving" | "unsaved";
export type ProfileTab = "details" | "photos" | "stories" | "events";
export type AddPersonContext = {
  anchorId?: string;
  connection?: ConnectionChoice;
  mode?: "create" | "link";
} | null;

interface TreeState {
  hydrated: boolean;
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
  profileOpen: boolean;
  profileTab: ProfileTab;
  saveState: SaveState;
  addPersonOpen: boolean;
  addPersonContext: AddPersonContext;
  shareOpen: boolean;
  searchOpen: boolean;
  searchQuery: string;
  generationLimit: number;
  focusedPersonId: string | null;
  onboardingStep: "none" | "self" | "next";
  profileEditing: boolean;
  userName: string;
  setUserName: (name: string) => void;

  setHydrated: (value: boolean) => void;
  setActiveTreeId: (id: string) => void;
  selectPerson: (id: string | null, openProfile?: boolean) => void;
  setProfileTab: (tab: ProfileTab) => void;
  closeProfile: () => void;
  openAddPerson: (context?: AddPersonContext) => void;
  closeAddPerson: () => void;
  setShareOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setGenerationLimit: (limit: number) => void;
  setFocusedPersonId: (id: string | null) => void;
  markSaving: () => void;
  addPersonWithConnection: (draft: PersonDraft, context?: AddPersonContext) => string;
  linkExistingPerson: (existingPersonId: string, context: { anchorId: string; connection: ConnectionChoice }) => boolean;
  unlinkRelationship: (personId: string, relatedPersonId: string, kind: UnlinkKind) => void;
  updatePerson: (id: string, patch: Partial<Person>) => void;
  deletePerson: (id: string) => void;
  addPhoto: (photo: Omit<Photo, "id" | "familyTreeId" | "uploadedAt">) => void;
  updatePhoto: (id: string, patch: Partial<Photo>) => void;
  addStory: (story: Omit<Story, "id" | "familyTreeId" | "createdAt">) => void;
  updateStory: (id: string, patch: Partial<Story>) => void;
  updateTree: (patch: Partial<FamilyTreeRecord>) => void;
  setShareAccess: (access: ShareAccess) => void;
  createEmptyTree: () => void;
  loadWilliamsTree: () => void;
  loadAponteTree: () => void;
  startOnboardingSelf: (draft: PersonDraft) => string;
  finishOnboarding: () => void;
  setProfileEditing: (value: boolean) => void;
}

function touchSave(set: (partial: Partial<TreeState>) => void) {
  set({ saveState: "saving" });
  setTimeout(() => set({ saveState: "saved" }), 700);
}

function personFromDraft(draft: PersonDraft, treeId: string, generation = 1, branch = "Aponte"): Person {
  const timestamp = new Date().toISOString();
  return {
    id: newId("p"),
    familyTreeId: treeId,
    firstName: draft.firstName.trim(),
    middleName: draft.middleName.trim(),
    lastName: draft.lastName.trim(),
    preferredName: draft.preferredName.trim(),
    gender: draft.gender,
    birthDate: draft.birthDate,
    deathDate: draft.deathDate,
    birthPlace: draft.birthPlace.trim(),
    deathPlace: "",
    currentLocation: draft.currentLocation.trim(),
    occupation: draft.occupation.trim(),
    education: draft.education.trim(),
    biography: draft.biography.trim(),
    email: draft.email.trim(),
    phone: draft.phone.trim(),
    website: draft.website.trim(),
    socialLinks: [],
    profilePhotoUrl: draft.profilePhotoUrl,
    generation,
    branch,
    notes: "",
    privacy: defaultPrivacy(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function addRel(
  relationships: Relationship[],
  treeId: string,
  personId: string,
  relatedPersonId: string,
  type: RelationshipType,
): Relationship[] {
  if (personId === relatedPersonId) return relationships;
  if (relationshipExists(relationships, personId, relatedPersonId, type)) return relationships;
  return [
    ...relationships,
    {
      id: newId("r"),
      familyTreeId: treeId,
      personId,
      relatedPersonId,
      relationshipType: type,
      createdAt: new Date().toISOString(),
    },
  ];
}

function applyConnection(
  treeId: string,
  relationships: Relationship[],
  newPersonId: string,
  anchorId: string,
  connection: ConnectionChoice,
): Relationship[] {
  let next = relationships;
  const parentType: RelationshipType = "parent";

  switch (connection) {
    case "parent": {
      next = addRel(next, treeId, newPersonId, anchorId, parentType);
      const existingParents = getParents(anchorId, relationships);
      if (existingParents.length === 1) {
        next = addRel(next, treeId, existingParents[0].id, newPersonId, "spouse");
      }
      break;
    }
    case "child": {
      next = addRel(next, treeId, anchorId, newPersonId, parentType);
      const partners = getPartners(anchorId, relationships);
      for (const partner of partners) {
        next = addRel(next, treeId, partner.id, newPersonId, parentType);
      }
      break;
    }
    case "spouse":
      next = addRel(next, treeId, anchorId, newPersonId, "spouse");
      for (const child of getChildren(anchorId, relationships)) {
        next = addRel(next, treeId, newPersonId, child.id, parentType);
      }
      break;
    case "partner":
      next = addRel(next, treeId, anchorId, newPersonId, "partner");
      for (const child of getChildren(anchorId, relationships)) {
        next = addRel(next, treeId, newPersonId, child.id, parentType);
      }
      break;
    case "sibling": {
      const parents = getParents(anchorId, relationships);
      if (parents.length) {
        for (const parent of parents) {
          next = addRel(next, treeId, parent.id, newPersonId, parentType);
        }
      } else {
        next = addRel(next, treeId, anchorId, newPersonId, "sibling");
      }
      break;
    }
    case "grandparent": {
      const parents = getParents(anchorId, relationships);
      if (parents.length) {
        next = addRel(next, treeId, newPersonId, parents[0].id, parentType);
      } else {
        next = addRel(next, treeId, newPersonId, anchorId, parentType);
      }
      break;
    }
    case "grandchild": {
      const children = getChildren(anchorId, relationships);
      if (children.length) {
        next = addRel(next, treeId, children[0].id, newPersonId, parentType);
      } else {
        next = addRel(next, treeId, anchorId, newPersonId, parentType);
      }
      break;
    }
    default:
      break;
  }

  return next;
}

const emptySnapshot = {
  trees: [EMPTY_TREE],
  activeTreeId: EMPTY_TREE.id,
  people: [] as Person[],
  relationships: [] as Relationship[],
  photos: [] as Photo[],
  stories: [] as Story[],
  events: [] as FamilyEvent[],
  sources: [] as Source[],
  activity: [] as ActivityItem[],
  selectedPersonId: null as string | null,
  profileOpen: false,
  onboardingStep: "none" as const,
};

const aponteSnapshot = {
  trees: [APONTE_TREE],
  activeTreeId: APONTE_TREE.id,
  people: APONTE_PEOPLE,
  relationships: APONTE_RELATIONSHIPS,
  photos: APONTE_PHOTOS,
  stories: APONTE_STORIES,
  events: APONTE_EVENTS,
  sources: APONTE_SOURCES,
  activity: APONTE_ACTIVITY,
  selectedPersonId: "eric" as string | null,
  profileOpen: true,
  onboardingStep: "none" as const,
};

export const useTreeStore = create<TreeState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ...emptySnapshot,
      profileTab: "details",
      saveState: "saved",
      addPersonOpen: false,
      addPersonContext: null,
      shareOpen: false,
      searchOpen: false,
      searchQuery: "",
      generationLimit: 4,
      focusedPersonId: null,
      profileEditing: false,
      userName: "Janelle",
      setUserName: (name) => set({ userName: name }),

      setHydrated: (value) => set({ hydrated: value }),
      setActiveTreeId: (id) => {
        if (!get().trees.some((tree) => tree.id === id)) return;
        set({ activeTreeId: id });
      },
      selectPerson: (id, openProfile = true) =>
        set({
          selectedPersonId: id,
          profileOpen: Boolean(id) && openProfile,
          profileTab: "details",
          profileEditing: false,
        }),
      setProfileEditing: (value) => set({ profileEditing: value, profileOpen: true }),
      setProfileTab: (tab) => set({ profileTab: tab }),
      closeProfile: () => set({ profileOpen: false }),
      openAddPerson: (context = null) => set({ addPersonOpen: true, addPersonContext: context }),
      closeAddPerson: () => set({ addPersonOpen: false, addPersonContext: null }),
      setShareOpen: (open) => set({ shareOpen: open }),
      setSearchOpen: (open) => set({ searchOpen: open }),
      setSearchQuery: (query) => set({ searchQuery: query, searchOpen: query.length > 0 }),
      setGenerationLimit: (limit) => set({ generationLimit: limit }),
      setFocusedPersonId: (id) => set({ focusedPersonId: id }),
      markSaving: () => touchSave(set),

      addPersonWithConnection: (draft, context) => {
        const { activeTreeId, people, relationships } = get();
        const anchor = people.find((p) => p.id === context?.anchorId);
        const person = personFromDraft(
          draft,
          activeTreeId,
          anchor ? Math.max(1, anchor.generation + (context?.connection === "parent" || context?.connection === "grandparent" ? -1 : 1)) : 1,
          anchor?.branch ?? "Williams",
        );
        let nextRels = relationships;
        if (context?.anchorId && context.connection && context.connection !== "other") {
          nextRels = applyConnection(activeTreeId, relationships, person.id, context.anchorId, context.connection);
        }
        const nextPeople = computeGenerations([...people, person], nextRels);
        set({
          people: nextPeople,
          relationships: nextRels,
          selectedPersonId: person.id,
          profileOpen: true,
          addPersonOpen: false,
          addPersonContext: null,
          onboardingStep: "none",
        });
        touchSave(set);
        return person.id;
      },

      linkExistingPerson: (existingPersonId, context) => {
        const { activeTreeId, people, relationships } = get();
        if (!context.anchorId || !context.connection || context.connection === "other") return false;
        if (existingPersonId === context.anchorId) return false;
        if (!people.some((p) => p.id === existingPersonId) || !people.some((p) => p.id === context.anchorId)) {
          return false;
        }

        const nextRels = applyConnection(
          activeTreeId,
          relationships,
          existingPersonId,
          context.anchorId,
          context.connection,
        );
        set({
          people: computeGenerations(people, nextRels),
          relationships: nextRels,
          selectedPersonId: existingPersonId,
          profileOpen: true,
          addPersonOpen: false,
          addPersonContext: null,
          onboardingStep: "none",
        });
        touchSave(set);
        return true;
      },

      unlinkRelationship: (personId, relatedPersonId, kind) => {
        if (personId === relatedPersonId) return;
        const nextRels = unlinkPeople(get().relationships, personId, relatedPersonId, kind);
        set({
          people: computeGenerations(get().people, nextRels),
          relationships: nextRels,
        });
        touchSave(set);
      },

      updatePerson: (id, patch) => {
        set({
          people: get().people.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
          ),
        });
        touchSave(set);
      },

      deletePerson: (id) => {
        const { people, relationships, selectedPersonId, photos, stories } = get();
        set({
          people: computeGenerations(
            people.filter((p) => p.id !== id),
            relationships.filter((r) => r.personId !== id && r.relatedPersonId !== id),
          ),
          relationships: relationships.filter((r) => r.personId !== id && r.relatedPersonId !== id),
          photos: photos.map((photo) => ({
            ...photo,
            taggedPersonIds: photo.taggedPersonIds.filter((pid) => pid !== id),
          })),
          stories: stories.map((story) => ({
            ...story,
            personIds: story.personIds.filter((pid) => pid !== id),
          })),
          selectedPersonId: selectedPersonId === id ? null : selectedPersonId,
          profileOpen: selectedPersonId === id ? false : get().profileOpen,
        });
        touchSave(set);
      },

      addPhoto: (photo) => {
        const item: Photo = {
          ...photo,
          id: newId("ph"),
          familyTreeId: get().activeTreeId,
          uploadedAt: new Date().toISOString(),
        };
        set({ photos: [item, ...get().photos] });
        touchSave(set);
      },

      updatePhoto: (id, patch) => {
        set({ photos: get().photos.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
        touchSave(set);
      },

      addStory: (story) => {
        const item: Story = {
          ...story,
          id: newId("st"),
          familyTreeId: get().activeTreeId,
          createdAt: new Date().toISOString(),
        };
        set({ stories: [item, ...get().stories] });
        touchSave(set);
      },

      updateStory: (id, patch) => {
        set({ stories: get().stories.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
        touchSave(set);
      },

      updateTree: (patch) => {
        set({
          trees: get().trees.map((t) => (t.id === get().activeTreeId ? { ...t, ...patch } : t)),
        });
        touchSave(set);
      },

      setShareAccess: (access) => {
        get().updateTree({ shareAccess: access });
      },

      createEmptyTree: () => {
        clearTreeBackup();
        const tree = { ...EMPTY_TREE, id: newId("tree") };
        set({
          trees: [tree],
          activeTreeId: tree.id,
          people: [],
          relationships: [],
          photos: [],
          stories: [],
          events: [],
          sources: [],
          activity: [],
          selectedPersonId: null,
          profileOpen: false,
          onboardingStep: "none",
        });
        touchSave(set);
      },

      loadWilliamsTree: () => {
        set({ ...aponteSnapshot, profileTab: "details", saveState: "saved" });
      },
      loadAponteTree: () => {
        set({ ...aponteSnapshot, profileTab: "details", saveState: "saved" });
      },

      startOnboardingSelf: (draft) => {
        const treeId = get().activeTreeId;
        const person = personFromDraft(draft.firstName ? draft : { ...emptyPersonDraft(), ...draft }, treeId, 1);
        set({
          people: [person],
          relationships: [],
          selectedPersonId: person.id,
          profileOpen: true,
          onboardingStep: "next",
          addPersonOpen: false,
        });
        touchSave(set);
        return person.id;
      },

      finishOnboarding: () => set({ onboardingStep: "none" }),
    }),
    {
      name: "our-family-tree-v1",
      version: 5,
      skipHydration: true,
      migrate: (persisted) => {
        const saved = (persisted || {}) as Partial<TreeState>;
        return {
          trees: saved.trees?.length ? saved.trees : emptySnapshot.trees,
          activeTreeId: saved.activeTreeId || emptySnapshot.activeTreeId,
          people: saved.people || [],
          relationships: saved.relationships || [],
          photos: saved.photos || [],
          stories: saved.stories || [],
          events: saved.events || [],
          sources: saved.sources || [],
          activity: saved.activity || [],
          selectedPersonId: saved.selectedPersonId ?? null,
          userName: saved.userName || "Janelle",
        };
      },
      partialize: (state) => ({
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
      }),
    },
  ),
);

export function useActiveTree() {
  return useTreeStore((s) => s.trees.find((t) => t.id === s.activeTreeId) ?? s.trees[0]);
}

export async function waitForTreeHydration() {
  if (useTreeStore.persist.hasHydrated()) return;
  await new Promise<void>((resolve) => {
    const unsub = useTreeStore.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
    void useTreeStore.persist.rehydrate();
  });
}
