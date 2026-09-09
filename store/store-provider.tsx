"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { useTreeStore } from "@/store/use-tree-store";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const finishTree = useTreeStore.persist.onFinishHydration(() => {
      useTreeStore.setState({ hydrated: true });
    });
    const finishAuth = useAuthStore.persist.onFinishHydration(() => {
      useAuthStore.setState({ hydrated: true });
    });

    if (useTreeStore.persist.hasHydrated()) useTreeStore.setState({ hydrated: true });
    else void useTreeStore.persist.rehydrate();

    if (useAuthStore.persist.hasHydrated()) useAuthStore.setState({ hydrated: true });
    else void useAuthStore.persist.rehydrate();

    return () => {
      finishTree();
      finishAuth();
    };
  }, []);

  return children;
}
