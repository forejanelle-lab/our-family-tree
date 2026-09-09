import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEMO_EMAIL,
  DEMO_NAME,
  DEMO_PASSWORD,
  firstNameFrom,
  hashPassword,
  normalizeEmail,
  type AuthUser,
  type StoredAccount,
} from "@/lib/auth";

function mergeAccounts(left: StoredAccount[], right: StoredAccount[]) {
  const byEmail = new Map<string, StoredAccount>();
  for (const account of [...left, ...right]) byEmail.set(account.email, account);
  return [...byEmail.values()];
}

async function waitForAuthHydration() {
  if (useAuthStore.persist.hasHydrated()) return;
  await new Promise<void>((resolve) => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
    void useAuthStore.persist.rehydrate();
  });
}

async function syncAccountToServer(
  path: "/api/auth/signin" | "/api/auth/signup",
  payload: Record<string, string>,
) {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return (await response.json()) as {
      ok: boolean;
      error?: string;
      account?: StoredAccount;
      user?: AuthUser;
    };
  } catch {
    return { ok: false, error: "Could not reach the archive." };
  }
}
import { findTreeByEditCode, findTreeByInviteCode, matchesViewPasscode } from "@/lib/invites";
import { newId } from "@/lib/format";
import { WILLIAMS_TREE } from "@/lib/mock-data";
import type { AccessRole } from "@/lib/types";
import { useTreeStore } from "@/store/use-tree-store";

interface AuthState {
  hydrated: boolean;
  user: AuthUser | null;
  accounts: StoredAccount[];
  guestView: boolean;
  role: AccessRole;
  signInPromptOpen: boolean;
  setHydrated: (value: boolean) => void;
  openSignInPrompt: () => void;
  closeSignInPrompt: () => void;
  canEdit: () => boolean;
  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signUp: (
    name: string,
    email: string,
    password: string,
    joinCode?: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  signInDemo: () => Promise<void>;
  lookupInvite: (inviteCode: string) => { ok: true; name: string } | { ok: false; error: string };
  enterAsViewer: (
    inviteCode: string,
    passcode: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => void;
}

async function withDemoAccount(accounts: StoredAccount[]) {
  if (accounts.some((account) => account.email === DEMO_EMAIL)) return accounts;
  return [
    ...accounts,
    {
      id: "user_janelle",
      name: DEMO_NAME,
      email: DEMO_EMAIL,
      passwordHash: await hashPassword(DEMO_PASSWORD),
      createdAt: "2026-09-01T10:00:00.000Z",
      role: "owner" as const,
    },
  ];
}

function toUser(account: StoredAccount): AuthUser {
  return { id: account.id, name: account.name, email: account.email, role: account.role || "owner" };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      user: null,
      accounts: [],
      guestView: false,
      role: "owner",
      signInPromptOpen: false,
      setHydrated: (value) => set({ hydrated: value }),
      openSignInPrompt: () => set({ signInPromptOpen: true }),
      closeSignInPrompt: () => set({ signInPromptOpen: false }),
      canEdit: () => {
        const { user, guestView, role } = get();
        if (guestView || !user) return false;
        const resolved = user.role || role || "owner";
        return resolved === "owner" || resolved === "editor";
      },

      signIn: async (email, password) => {
        await waitForAuthHydration();
        const normalized = normalizeEmail(email);
        if (!normalized.includes("@")) return { ok: false, error: "Please use a valid email." };
        if (password.length < 8) return { ok: false, error: "Use at least 8 characters." };

        const remote = await syncAccountToServer("/api/auth/signin", {
          email: normalized,
          password,
          name: firstNameFrom(normalized.split("@")[0] || "Family"),
        });
        if (remote.error === "That password doesn’t match.") {
          return { ok: false, error: remote.error };
        }

        let accounts = await withDemoAccount(get().accounts);
        let account = accounts.find((item) => item.email === normalized) ?? remote.account ?? null;

        if (remote.ok && remote.account) {
          accounts = mergeAccounts(accounts, [remote.account]);
          account = remote.account;
        }

        if (!account) {
          account = {
            id: newId("user"),
            name: firstNameFrom(normalized.split("@")[0] || "Family"),
            email: normalized,
            passwordHash: await hashPassword(password),
            createdAt: new Date().toISOString(),
            role: "owner",
          };
          accounts = mergeAccounts(accounts, [account]);
        } else if (account.passwordHash !== (await hashPassword(password))) {
          return { ok: false, error: "That password doesn’t match." };
        }

        const user = toUser(account);
        useTreeStore.getState().setUserName(firstNameFrom(user.name));
        if (useTreeStore.getState().people.length === 0 || user.role === "editor" || account.email === DEMO_EMAIL) {
          useTreeStore.getState().loadWilliamsTree();
        }
        set({ accounts, user, guestView: false, role: user.role, signInPromptOpen: false });
        return { ok: true };
      },

      signUp: async (name, email, password, joinCode) => {
        await waitForAuthHydration();
        const trimmedName = name.trim();
        const normalized = normalizeEmail(email);
        if (!trimmedName) return { ok: false, error: "Please add your name." };
        if (!normalized.includes("@")) return { ok: false, error: "Please use a valid email." };
        if (password.length < 8) return { ok: false, error: "Use at least 8 characters." };
        const accounts = await withDemoAccount(get().accounts);
        const existing = accounts.find((item) => item.email === normalized);
        if (existing) {
          if (existing.passwordHash !== (await hashPassword(password))) {
            return { ok: false, error: "An account already exists for that email." };
          }
          const user = toUser(existing);
          useTreeStore.getState().setUserName(firstNameFrom(user.name));
          set({ accounts, user, guestView: false, role: user.role, signInPromptOpen: false });
          return { ok: true };
        }

        let role: AccessRole = "owner";
        const code = joinCode?.trim();
        if (code) {
          const extra = useTreeStore.getState().trees;
          const tree = findTreeByEditCode(code, extra);
          if (!tree) return { ok: false, error: "That family join code isn’t valid." };
          role = "editor";
          if (tree.id === WILLIAMS_TREE.id) useTreeStore.getState().loadWilliamsTree();
        } else if (useTreeStore.getState().people.length === 0) {
          useTreeStore.getState().loadWilliamsTree();
        }

        const account: StoredAccount = {
          id: newId("user"),
          name: trimmedName,
          email: normalized,
          passwordHash: await hashPassword(password),
          createdAt: new Date().toISOString(),
          role,
        };
        await syncAccountToServer("/api/auth/signup", {
          name: trimmedName,
          email: normalized,
          password,
          role,
          id: account.id,
          createdAt: account.createdAt,
        });
        const user = toUser(account);
        useTreeStore.getState().setUserName(firstNameFrom(user.name));
        set({
          accounts: mergeAccounts(accounts, [account]),
          user,
          guestView: false,
          role,
          signInPromptOpen: false,
        });
        return { ok: true };
      },

      signInDemo: async () => {
        const result = await get().signIn(DEMO_EMAIL, DEMO_PASSWORD);
        if (!result.ok) throw new Error(result.error);
      },

      lookupInvite: (inviteCode) => {
        const extra = useTreeStore.getState().trees;
        const tree = findTreeByInviteCode(inviteCode, extra);
        if (!tree) return { ok: false, error: "We couldn’t find a tree with that invite code." };
        return { ok: true, name: tree.name };
      },

      enterAsViewer: async (inviteCode, passcode) => {
        const extra = useTreeStore.getState().trees;
        const tree = findTreeByInviteCode(inviteCode, extra);
        if (!tree) return { ok: false, error: "We couldn’t find a tree with that invite code." };
        if (!matchesViewPasscode(tree, passcode)) {
          return { ok: false, error: "That passcode doesn’t match this family archive." };
        }
        if (tree.id === WILLIAMS_TREE.id) useTreeStore.getState().loadWilliamsTree();
        set({ guestView: true, user: null, role: "viewer", signInPromptOpen: false });
        return { ok: true };
      },

      signOut: () => set({ user: null, guestView: false, role: "owner", signInPromptOpen: false }),
    }),
    {
      name: "our-family-tree-auth-v1",
      skipHydration: true,
      partialize: (state) => ({
        user: state.user,
        accounts: state.accounts,
        guestView: state.guestView,
        role: state.role,
      }),
      merge: (persisted, current) => {
        const saved = (persisted || {}) as Partial<AuthState>;
        return {
          ...current,
          ...saved,
          accounts: mergeAccounts(current.accounts, saved.accounts || []),
        };
      },
    },
  ),
);

export function useCanEdit() {
  const user = useAuthStore((s) => s.user);
  const guestView = useAuthStore((s) => s.guestView);
  const role = useAuthStore((s) => s.role);
  if (guestView || !user) return false;
  const resolved = user.role || role;
  if (resolved === "viewer") return false;
  return true;
}
