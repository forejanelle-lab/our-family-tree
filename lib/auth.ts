import type { AccessRole } from "@/lib/types";

export const DEMO_EMAIL = "janelle@williams.family";
export const DEMO_PASSWORD = "familytree";
export const DEMO_NAME = "Janelle";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: AccessRole;
}

export interface StoredAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  role: AccessRole;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string) {
  const data = new TextEncoder().encode(password);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function firstNameFrom(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}
