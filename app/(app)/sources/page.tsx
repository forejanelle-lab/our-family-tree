"use client";

import { useTreeStore } from "@/store/use-tree-store";
import { cardName } from "@/lib/format";

export default function SourcesPage() {
  const sources = useTreeStore((s) => s.sources);
  const people = useTreeStore((s) => s.people);

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-10">
        <h1 className="font-serif text-3xl text-charcoal sm:text-4xl">Sources</h1>
        <p className="mt-2 text-sm text-soft">The documents that quietly prove a life was lived.</p>
        <div className="mt-8 space-y-4">
          {sources.map((source) => (
            <article key={source.id} className="rounded-3xl border border-line bg-white p-5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-gold">{source.type}</p>
              <h2 className="mt-2 font-serif text-2xl text-charcoal">{source.title}</h2>
              <p className="mt-2 text-sm italic text-soft">{source.citation}</p>
              {source.notes ? <p className="mt-3 text-sm text-charcoal">{source.notes}</p> : null}
              <p className="mt-3 text-xs text-soft">
                {source.relatedPersonIds
                  .map((id) => people.find((p) => p.id === id))
                  .filter(Boolean)
                  .map((p) => cardName(p!))
                  .join(" · ")}
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
