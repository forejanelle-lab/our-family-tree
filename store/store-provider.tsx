"use client";

import { useEffect } from "react";
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

export function StoreProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const finishTree = useTreeStore.persist.onFinishHydration(() => {
      finishTreeHydration();
    });
    const finishAuth = useAuthStore.persist.onFinishHydration(() => {
      useAuthStore.setState({ hydrated: true });
    });
    const stopBackup = useTreeStore.subscribe((state) => {
      writeTreeBackup(snapshotFromTreeState(state));
    });

    if (useTreeStore.persist.hasHydrated()) finishTreeHydration();
    else void useTreeStore.persist.rehydrate();

    if (useAuthStore.persist.hasHydrated()) useAuthStore.setState({ hydrated: true });
    else void useAuthStore.persist.rehydrate();

    return () => {
      finishTree();
      finishAuth();
      stopBackup();
    };
  }, []);

  return children;
}
