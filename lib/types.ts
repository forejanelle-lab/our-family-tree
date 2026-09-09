export type Gender = "female" | "male" | "nonbinary" | "unknown";

export type RelationshipType =
  | "parent"
  | "spouse"
  | "partner"
  | "sibling"
  | "adoptive_parent"
  | "step_parent";

export type ConnectionChoice =
  | "parent"
  | "child"
  | "spouse"
  | "partner"
  | "sibling"
  | "grandparent"
  | "grandchild"
  | "other";

export type ShareAccess = "private" | "link" | "family";
export type AccessRole = "owner" | "editor" | "viewer";

export interface PersonPrivacy {
  hideBirthDate: boolean;
  hideContact: boolean;
  hideNotes: boolean;
  hidePhotos: boolean;
  hideFromPublic: boolean;
}

export interface Person {
  id: string;
  familyTreeId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  preferredName: string;
  gender: Gender;
  birthDate: string;
  deathDate: string;
  birthPlace: string;
  deathPlace: string;
  currentLocation: string;
  occupation: string;
  education: string;
  biography: string;
  email: string;
  phone: string;
  website: string;
  socialLinks: { label: string; url: string }[];
  profilePhotoUrl: string;
  generation: number;
  branch: string;
  notes: string;
  privacy: PersonPrivacy;
  createdAt: string;
  updatedAt: string;
}

export interface Relationship {
  id: string;
  familyTreeId: string;
  personId: string;
  relatedPersonId: string;
  relationshipType: RelationshipType;
  createdAt: string;
}

export interface Photo {
  id: string;
  familyTreeId: string;
  url: string;
  caption: string;
  date: string;
  location: string;
  description: string;
  taggedPersonIds: string[];
  isPrivate: boolean;
  uploadedAt: string;
}

export interface Story {
  id: string;
  familyTreeId: string;
  title: string;
  coverPhotoUrl: string;
  body: string;
  date: string;
  location: string;
  personIds: string[];
  isPrivate: boolean;
  createdAt: string;
}

export interface FamilyEvent {
  id: string;
  familyTreeId: string;
  personId: string;
  title: string;
  date: string;
  location: string;
  description: string;
}

export interface Source {
  id: string;
  familyTreeId: string;
  title: string;
  type: string;
  citation: string;
  url: string;
  relatedPersonIds: string[];
  notes: string;
}

export interface ActivityItem {
  id: string;
  text: string;
  detail: string;
  time: string;
}

export interface FamilyTreeRecord {
  id: string;
  name: string;
  ownerName: string;
  shareAccess: ShareAccess;
  hideLivingDates: boolean;
  hideContactInfo: boolean;
  hidePrivateNotes: boolean;
  hidePhotosPublic: boolean;
  inviteCode: string;
  viewPasscode: string;
  editCode: string;
}

export interface PersonDraft {
  firstName: string;
  middleName: string;
  lastName: string;
  preferredName: string;
  gender: Gender;
  birthDate: string;
  deathDate: string;
  birthPlace: string;
  currentLocation: string;
  occupation: string;
  education: string;
  biography: string;
  email: string;
  phone: string;
  website: string;
  profilePhotoUrl: string;
}

export const emptyPersonDraft = (): PersonDraft => ({
  firstName: "",
  middleName: "",
  lastName: "",
  preferredName: "",
  gender: "unknown",
  birthDate: "",
  deathDate: "",
  birthPlace: "",
  currentLocation: "",
  occupation: "",
  education: "",
  biography: "",
  email: "",
  phone: "",
  website: "",
  profilePhotoUrl: "",
});

export const defaultPrivacy = (): PersonPrivacy => ({
  hideBirthDate: false,
  hideContact: false,
  hideNotes: false,
  hidePhotos: false,
  hideFromPublic: false,
});
