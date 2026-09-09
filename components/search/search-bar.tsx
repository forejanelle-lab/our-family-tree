"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { searchAll } from "@/lib/search";
import { useTreeStore } from "@/store/use-tree-store";

export function SearchBar() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const query = useTreeStore((s) => s.searchQuery);
  const setSearchQuery = useTreeStore((s) => s.setSearchQuery);
  const searchOpen = useTreeStore((s) => s.searchOpen);
  const setSearchOpen = useTreeStore((s) => s.setSearchOpen);
  const people = useTreeStore((s) => s.people);
  const stories = useTreeStore((s) => s.stories);
  const photos = useTreeStore((s) => s.photos);
  const events = useTreeStore((s) => s.events);
  const selectPerson = useTreeStore((s) => s.selectPerson);

  const results = useMemo(
    () => searchAll(query, { people, stories, photos, events }),
    [query, people, stories, photos, events],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setSearchOpen(true);
      }
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchOpen]);

  const grouped = results.reduce<Record<string, typeof results>>((acc, hit) => {
    acc[hit.group] = acc[hit.group] || [];
    acc[hit.group].push(hit);
    return acc;
  }, {});

  return (
    <div className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-soft" />
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => setSearchQuery(event.target.value)}
        onFocus={() => query && setSearchOpen(true)}
        placeholder="Search people, places, or events..."
        className="h-11 w-full rounded-full border border-line bg-cream pl-10 pr-4 text-sm text-charcoal placeholder:text-soft/80 focus:border-forest focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest/10"
        aria-label="Search people, places, or events"
      />
      {searchOpen && query ? (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-soft)]">
          <div className="max-h-80 overflow-y-auto scrollbar-thin p-2">
            {results.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-soft">No matches for “{query}”</p>
            ) : (
              Object.entries(grouped).map(([group, hits]) => (
                <div key={group} className="mb-2">
                  <p className="px-3 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.16em] text-soft">
                    {group}
                  </p>
                  {hits.map((hit) => (
                    <button
                      key={hit.id}
                      type="button"
                      className="flex w-full flex-col rounded-xl px-3 py-2 text-left hover:bg-cream"
                      onClick={() => {
                        if (hit.personId) {
                          selectPerson(hit.personId);
                          router.push("/tree");
                        } else if (hit.href) {
                          router.push(hit.href);
                        }
                        setSearchOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      <span className="text-sm text-charcoal">{hit.title}</span>
                      <span className="text-xs text-soft">{hit.subtitle}</span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
