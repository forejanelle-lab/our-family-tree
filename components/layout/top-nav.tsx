"use client";

import { Check, Loader2, Search, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/search/search-bar";
import { useTreeStore } from "@/store/use-tree-store";
import { useAuthStore, useCanEdit } from "@/store/use-auth-store";

export function TopNav({ onOpenSearch }: { onOpenSearch?: () => void }) {
  const saveState = useTreeStore((s) => s.saveState);
  const setShareOpen = useTreeStore((s) => s.setShareOpen);
  const markSaving = useTreeStore((s) => s.markSaving);
  const setSearchOpen = useTreeStore((s) => s.setSearchOpen);
  const canEdit = useCanEdit();
  const openSignInPrompt = useAuthStore((s) => s.openSignInPrompt);

  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between gap-4 border-b border-line bg-white/90 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          className="hidden h-10 w-10 items-center justify-center rounded-full text-soft hover:bg-cream sm:flex"
          aria-label="Search"
          onClick={() => {
            onOpenSearch?.();
            setSearchOpen(true);
          }}
        >
          <Search className="h-4 w-4" />
        </button>
        <SearchBar />
      </div>
      <div className="flex items-center gap-2">
        {canEdit ? (
          <>
            <Button variant="secondary" onClick={() => setShareOpen(true)}>
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button onClick={markSaving} aria-live="polite">
              {saveState === "saving" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Saved
                </>
              )}
            </Button>
          </>
        ) : (
          <Button onClick={openSignInPrompt}>Sign in to edit</Button>
        )}
      </div>
    </header>
  );
}
