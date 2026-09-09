"use client";

import { PersonAvatar } from "@/components/person/person-avatar";
import { cn } from "@/lib/cn";
import { cardName, lifespan } from "@/lib/format";
import type { Person } from "@/lib/types";

export function PersonCard({
  person,
  subtitle,
  selected,
  onClick,
}: {
  person: Person;
  subtitle?: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 rounded-3xl border bg-white p-4 text-left shadow-[var(--shadow-card)] transition-colors",
        selected ? "border-forest ring-4 ring-forest/10" : "border-line hover:border-forest/30",
      )}
    >
      <PersonAvatar person={person} size="md" />
      <span>
        <span className="block font-serif text-xl text-charcoal">{cardName(person)}</span>
        <span className="mt-0.5 block text-xs text-soft">{lifespan(person)}</span>
        {subtitle ? <span className="mt-2 block text-xs text-forest">{subtitle}</span> : null}
      </span>
    </button>
  );
}
