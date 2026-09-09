"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PersonCard } from "@/components/person/person-card";
import { directoryRelationship } from "@/lib/relationships";
import { useTreeStore } from "@/store/use-tree-store";
import { TextInput } from "@/components/ui/button";

export function PeopleDirectory() {
  const people = useTreeStore((s) => s.people);
  const relationships = useTreeStore((s) => s.relationships);
  const selectPerson = useTreeStore((s) => s.selectPerson);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [generation, setGeneration] = useState("all");
  const [branch, setBranch] = useState("all");
  const [sort, setSort] = useState<"name" | "birth">("name");

  const branches = [...new Set(people.map((p) => p.branch).filter(Boolean))];
  const generations = [...new Set(people.map((p) => p.generation))].sort((a, b) => a - b);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return people
      .filter((p) => `${p.firstName} ${p.lastName} ${p.preferredName}`.toLowerCase().includes(q))
      .filter((p) => (generation === "all" ? true : String(p.generation) === generation))
      .filter((p) => (branch === "all" ? true : p.branch === branch))
      .sort((a, b) =>
        sort === "name"
          ? a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)
          : (a.birthDate || "9999").localeCompare(b.birthDate || "9999"),
      );
  }, [people, query, generation, branch, sort]);

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-6xl px-6 py-8 sm:px-10">
        <h1 className="font-serif text-4xl text-charcoal">People</h1>
        <p className="mt-2 text-sm text-soft">{people.length} family members</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <div className="min-w-[220px] flex-1">
            <TextInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people..."
              aria-label="Search people"
            />
          </div>
          <select
            className="h-11 rounded-xl border border-line bg-white px-3 text-sm"
            value={generation}
            onChange={(e) => setGeneration(e.target.value)}
            aria-label="Filter by generation"
          >
            <option value="all">All generations</option>
            {generations.map((g) => (
              <option key={g} value={g}>
                Generation {g}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-xl border border-line bg-white px-3 text-sm"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            aria-label="Filter by family branch"
          >
            <option value="all">All branches</option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-xl border border-line bg-white px-3 text-sm"
            value={sort}
            onChange={(e) => setSort(e.target.value as "name" | "birth")}
            aria-label="Sort people"
          >
            <option value="name">Sort alphabetically</option>
            <option value="birth">Sort by birth year</option>
          </select>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              subtitle={directoryRelationship(person, people, relationships)}
              onClick={() => {
                selectPerson(person.id);
                router.push("/tree");
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
