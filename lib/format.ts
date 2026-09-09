import type { Gender, Person } from "./types";

export function fullName(person: Pick<Person, "firstName" | "middleName" | "lastName">) {
  return [person.firstName, person.middleName, person.lastName].filter(Boolean).join(" ");
}

export function displayName(person: Pick<Person, "firstName" | "lastName" | "preferredName">) {
  if (person.preferredName) return person.preferredName;
  return [person.firstName, person.lastName].filter(Boolean).join(" ");
}

export function cardName(person: Pick<Person, "firstName" | "lastName">) {
  return [person.firstName, person.lastName].filter(Boolean).join(" ");
}

export function yearOf(iso: string) {
  if (!iso) return "";
  const year = iso.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : "";
}

export function isLiving(person: Pick<Person, "deathDate">) {
  return !person.deathDate;
}

export function lifespan(person: Pick<Person, "birthDate" | "deathDate">) {
  const birth = yearOf(person.birthDate);
  const death = person.deathDate ? yearOf(person.deathDate) : birth ? "Present" : "";
  if (birth && death) return `${birth} – ${death}`;
  if (birth) return `${birth} – Present`;
  if (death && death !== "Present") return `– ${death}`;
  return "";
}

export function formatLongDate(iso: string) {
  if (!iso) return "";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    const year = yearOf(iso);
    return year || iso;
  }
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function childLabel(gender: Gender) {
  if (gender === "female") return "Daughter";
  if (gender === "male") return "Son";
  return "Child";
}

export function parentLabel(gender: Gender) {
  if (gender === "female") return "Mother";
  if (gender === "male") return "Father";
  return "Parent";
}

export function partnerLabel(type: "spouse" | "partner" | string) {
  return type === "spouse" ? "Spouse" : "Partner";
}

export function initials(person: Pick<Person, "firstName" | "lastName">) {
  return `${person.firstName?.[0] ?? ""}${person.lastName?.[0] ?? ""}`.toUpperCase();
}

export function newId(prefix = "id") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
