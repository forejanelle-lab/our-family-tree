"use client";

import { useState } from "react";
import { Check, Loader2, Search, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/search/search-bar";
import { useTreeStore } from "@/store/use-tree-store";
import { useAuthStore, useCanEdit } from "@/store/use-auth-store";

export function TopNav() {
  const saveState = useTreeStore((s) => s.saveState);
  const setShareOpen = useTreeStore((s) => s.setShareOpen);
  const markSaving = useTreeStore((s) => s.markSaving);
  const setSearchOpen = useTreeStore((s) => s.setSearchOpen);
  const setSearchQuery = useTreeStore((s) => s.setSearchQuery);
  const canEdit = useCanEdit();
  const openSignInPrompt = useAuthStore((s) => s.openSignInPrompt);
  const [mobileSearch, setMobileSearch] = useState(false);

  function closeMobileSearch() {
    setMobileSearch(false);
    setSearchOpen(false);
    setSearchQuery("");
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 bg-white/90 px-2 backdrop-blur-sm sm:h-[72px] sm:gap-4 sm:px-6">
      {mobileSearch ? (
        <div className="flex min-w-0 flex-1 items-center gap-1 sm:hidden">
          <SearchBar autoFocus compact onNavigate={closeMobileSearch} />
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-soft"
            aria-label="Close search"
            onClick={closeMobileSearch}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="hidden min-w-0 flex-1 items-center gap-3 sm:flex">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-soft hover:bg-cream"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
            </button>
            <SearchBar />
          </div>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full text-soft hover:bg-cream sm:hidden"
            aria-label="Search"
            onClick={() => {
              setMobileSearch(true);
              setSearchOpen(true);
            }}
          >
            <Search className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {canEdit ? (
              <>
                <Button variant="secondary" size="icon" className="h-11 w-11 sm:h-10 sm:w-auto sm:px-4" onClick={() => setShareOpen(true)}>
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
                <Button size="icon" className="h-11 w-11 sm:h-10 sm:w-auto sm:px-4" onClick={markSaving} aria-live="polite">
                  {saveState === "saving" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{saveState === "saving" ? "Saving..." : "Saved"}</span>
                </Button>
              </>
            ) : (
              <Button onClick={openSignInPrompt}>
                <span className="sm:hidden">Sign in</span>
                <span className="hidden sm:inline">Sign in to edit</span>
              </Button>
            )}
          </div>
        </>
      )}
    </header>
  );
}
