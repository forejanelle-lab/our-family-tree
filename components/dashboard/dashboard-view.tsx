"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { greeting } from "@/lib/format";
import { firstNameFrom } from "@/lib/auth";
import { generationCount } from "@/lib/relationships";
import { Button } from "@/components/ui/button";
import { LeafMark } from "@/components/ui/leaf-mark";
import { useActiveTree, useTreeStore } from "@/store/use-tree-store";
import { useAuthStore } from "@/store/use-auth-store";

export function DashboardView() {
  const router = useRouter();
  const tree = useActiveTree();
  const people = useTreeStore((s) => s.people);
  const activity = useTreeStore((s) => s.activity);
  const userName = useTreeStore((s) => s.userName);
  const authUser = useAuthStore((s) => s.user);
  const createEmptyTree = useTreeStore((s) => s.createEmptyTree);
  const gens = generationCount(people);
  const hello = firstNameFrom(authUser?.name || userName);

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-5xl px-6 py-10 sm:px-10">
        <p className="text-sm text-soft">{greeting()}, {hello}</p>
        <h1 className="mt-2 font-serif text-4xl text-charcoal sm:text-5xl">Continue building your family story.</h1>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <article className="rounded-3xl border border-line bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage text-forest">
              <LeafMark className="h-6 w-6" />
            </div>
            <h2 className="mt-5 font-serif text-3xl text-charcoal">{tree?.name ?? "Your Family"}</h2>
            <p className="mt-2 text-sm text-soft">
              {gens} {gens === 1 ? "generation" : "generations"} · {people.length} {people.length === 1 ? "person" : "people"}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button onClick={() => router.push("/tree")}>Open Tree</Button>
              <Button
                variant="secondary"
                onClick={() => {
                  createEmptyTree();
                  router.push("/tree");
                }}
              >
                Create New Tree
              </Button>
            </div>
          </article>

          <article className="rounded-3xl border border-line bg-cream-dark/60 p-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-soft">Recent activity</p>
            <ul className="mt-4 space-y-4">
              {activity.length === 0 ? (
                <li className="text-sm text-soft">Your family’s first moments will appear here.</li>
              ) : (
                activity.map((item) => (
                  <li key={item.id}>
                    <p className="text-sm text-charcoal">{item.text}</p>
                    <p className="text-xs text-soft">
                      {item.detail} · {item.time}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </article>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { href: "/photos", title: "Photos", copy: "Albums, portraits, and scanned history." },
            { href: "/stories", title: "Stories", copy: "The family scrapbook, written with care." },
            { href: "/people", title: "People", copy: "Every relative, in one quiet directory." },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-2xl border border-line bg-white p-5 transition-colors hover:border-forest/30"
            >
              <h3 className="font-serif text-xl text-charcoal">{card.title}</h3>
              <p className="mt-2 text-sm text-soft">{card.copy}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
