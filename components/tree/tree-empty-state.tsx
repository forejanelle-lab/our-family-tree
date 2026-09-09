"use client";

import { Button } from "@/components/ui/button";
import { LeafMark } from "@/components/ui/leaf-mark";
import { useTreeStore } from "@/store/use-tree-store";

export function TreeEmptyState() {
  const openAddPerson = useTreeStore((s) => s.openAddPerson);
  const setOnboarding = () => openAddPerson({ connection: "other" });

  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-sage text-forest">
          <LeafMark className="h-8 w-8" />
        </div>
        <h1 className="font-serif text-4xl text-charcoal">Start your family story</h1>
        <p className="mt-3 text-base text-soft">Build your family tree one person at a time.</p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Button size="lg" onClick={setOnboarding}>
            Add yourself
          </Button>
          <a href="/import" className="text-sm text-forest underline-offset-4 hover:underline">
            Import family tree
          </a>
        </div>
      </div>
    </div>
  );
}
