"use client";

import { useEffect, useRef } from "react";
import { currentTreeSlice, loadMyTreeOnServer, saveMyTreeOnServer, applySavedShareCodes } from "@/lib/tree-sync";
import { readTreeBackup, snapshotFromTreeState, writeTreeBackup } from "@/lib/tree-backup";
import { useAuthStore } from "@/store/use-auth-store";
import { useTreeStore } from "@/store/use-tree-store";

function finishTreeHydration() {
  const state = useTreeStore.getState();
  if (state.people.length === 0) {
    const backup = readTreeBackup();
    if (backup) {
      useTreeStore.setState({ ...backup, hydrated: true });
      return;
    }
  } else {
    writeTreeBackup(snapshotFromTreeState(state));
  }
  useTreeStore.setState({ hydrated: true });
}

async function pushLocalTree(email: string) {
  const slice = currentTreeSlice();
  if (!slice || slice.people.length === 0) return;
  const saved = await saveMyTreeOnServer(slice, email);
  if (saved.ok) {
    applySavedShareCodes(saved.snapshot);
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const finishTree = useTreeStore.persist.onFinishHydration(() => {
      finishTreeHydration();
    });
    const finishAuth = useAuthStore.persist.onFinishHydration(() => {
      useAuthStore.setState({ hydrated: true });
    });
    const stopBackup = useTreeStore.subscribe((state) => {
      writeTreeBackup(snapshotFromTreeState(state));
      const user = useAuthStore.getState().user;
      const guest = useAuthStore.getState().guestView;
      if (!user || guest || state.people.length === 0) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void pushLocalTree(user.email);
      }, 1600);
    });

    if (useTreeStore.persist.hasHydrated()) finishTreeHydration();
    else void useTreeStore.persist.rehydrate();

    if (useAuthStore.persist.hasHydrated()) useAuthStore.setState({ hydrated: true });
    else void useAuthStore.persist.rehydrate();

    return () => {
      finishTree();
      finishAuth();
      stopBackup();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    const unsub = useAuthStore.subscribe((state, previous) => {
      if (!state.user || state.guestView) return;
      if (state.user.email === previous.user?.email && previous.hydrated) return;
      const email = state.user.email;
      void (async () => {
        await new Promise((resolve) => setTimeout(resolve, 400));
        const remote = await loadMyTreeOnServer();
        const local = useTreeStore.getState();
        if (remote.ok && remote.snapshot?.people.length && local.people.length === 0) {
          local.applySnapshot(remote.snapshot, { keepLocalPhotos: true });
          return;
        }
        if (local.people.length > 0) await pushLocalTree(email);
      })();
    });
    return unsub;
  }, []);

  return children;
}
