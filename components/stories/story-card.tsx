"use client";

import Link from "next/link";
import { formatLongDate } from "@/lib/format";
import type { Story } from "@/lib/types";

export function StoryCard({ story }: { story: Story }) {
  return (
    <Link
      href={`/stories/${story.id}`}
      className="group overflow-hidden rounded-3xl border border-line bg-white shadow-[var(--shadow-card)]"
    >
      <div className="relative h-56 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={story.coverPhotoUrl}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="p-5">
        <p className="text-xs uppercase tracking-[0.14em] text-gold">
          {story.location}
          {story.date ? ` · ${formatLongDate(story.date)}` : ""}
        </p>
        <h2 className="mt-2 font-serif text-2xl leading-snug text-charcoal">{story.title}</h2>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-soft">{story.body}</p>
      </div>
    </Link>
  );
}
