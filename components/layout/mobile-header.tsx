"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Search, Share2, X } from "lucide-react";
import { pageTitleFromPath } from "@/lib/page-title";
import { SearchBar } from "@/components/search/search-bar";
import { useActiveTree, useTreeStore } from "@/store/use-tree-store";
import { useAuthStore, useCanEdit } from "@/store/use-auth-store";

export function MobileHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const tree = useActiveTree();
  const saveState = useTreeStore((s) => s.saveState);
  const setShareOpen = useTreeStore((s) => s.setShareOpen);
  const setSearchOpen = useTreeStore((s) => s.setSearchOpen);
  const setSearchQuery = useTreeStore((s) => s.setSearchQuery);
  const canEdit = useCanEdit();
  const openSignInPrompt = useAuthStore((s) => s.openSignInPrompt);
  const [searching, setSearching] = useState(false);
  const nested = pathname.startsWith("/stories/") && pathname !== "/stories";
  const title = pathname === "/tree" ? tree?.name ?? "Tree" : pageTitleFromPath(pathname);

  return (
    <header className="shrink-0 border-b border-line/80 bg-cream/95 pt-[env(safe-area-inset-top)] backdrop-blur-md lg:hidden">
      {searching ? (
        <div className="flex h-12 items-center gap-1 px-2">
          <SearchBar
            autoFocus
            compact
            onNavigate={() => {
              setSearching(false);
              setSearchOpen(false);
              setSearchQuery("");
            }}
          />
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-soft"
            aria-label="Close search"
            onClick={() => {
              setSearching(false);
              setSearchOpen(false);
              setSearchQuery("");
            }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div className="grid h-12 grid-cols-[44px_1fr_88px] items-center px-2">
          {nested ? (
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full text-charcoal"
              aria-label="Back"
              onClick={() => router.push("/stories")}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          ) : (
            <span />
          )}
          <h1 className="truncate text-center font-serif text-[17px] text-charcoal">{title}</h1>
          <div className="flex items-center justify-end">
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full text-charcoal"
              aria-label="Search"
              onClick={() => {
                setSearching(true);
                setSearchOpen(true);
              }}
            >
              <Search className="h-5 w-5" />
            </button>
            {canEdit ? (
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full text-charcoal"
                aria-label="Share"
                onClick={() => setShareOpen(true)}
              >
                {saveState === "saving" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Share2 className="h-5 w-5" />}
              </button>
            ) : (
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full text-charcoal"
                aria-label="Sign in"
                onClick={openSignInPrompt}
              >
                <Share2 className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
