import { cookies } from "next/headers";
import type { StoredAccount } from "@/lib/auth";

const COOKIE = "oft-account-book-v1";
const globalForAccounts = globalThis as typeof globalThis & {
  __oftAccounts?: StoredAccount[];
};

function parseAccounts(raw: string | undefined): StoredAccount[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function mergeAccounts(left: StoredAccount[], right: StoredAccount[]) {
  const byEmail = new Map<string, StoredAccount>();
  for (const account of [...left, ...right]) {
    byEmail.set(account.email, account);
  }
  return [...byEmail.values()];
}

export async function readAccountBook(): Promise<StoredAccount[]> {
  const jar = await cookies();
  const fromCookie = parseAccounts(jar.get(COOKIE)?.value);
  const fromMemory = globalForAccounts.__oftAccounts ?? [];
  const merged = mergeAccounts(fromMemory, fromCookie);
  globalForAccounts.__oftAccounts = merged;
  return merged;
}

export async function writeAccountBook(accounts: StoredAccount[]) {
  const unique = mergeAccounts(accounts, []);
  globalForAccounts.__oftAccounts = unique;
  const jar = await cookies();
  jar.set(COOKIE, JSON.stringify(unique), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return unique;
}

export async function upsertAccount(account: StoredAccount) {
  const current = await readAccountBook();
  const next = mergeAccounts(current, [account]);
  return writeAccountBook(next);
}

export async function findAccount(email: string) {
  const accounts = await readAccountBook();
  return accounts.find((account) => account.email === email) ?? null;
}
