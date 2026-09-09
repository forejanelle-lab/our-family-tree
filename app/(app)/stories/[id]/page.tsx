"use client";

import { useParams, useRouter } from "next/navigation";
import { PersonAvatar } from "@/components/person/person-avatar";
import { cardName, formatLongDate } from "@/lib/format";
import { useTreeStore } from "@/store/use-tree-store";

export default function StoryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const story = useTreeStore((s) => s.stories.find((item) => item.id === params.id));
  const people = useTreeStore((s) => s.people);
  const selectPerson = useTreeStore((s) => s.selectPerson);

  if (!story) {
    return (
      <div className="flex h-full items-center justify-center text-soft">
        This story could not be found.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <button type="button" className="min-h-11 text-sm text-soft hover:text-charcoal" onClick={() => router.push("/stories")}>
          ← All stories
        </button>
        <p className="mt-6 text-xs uppercase tracking-[0.16em] text-gold">
          {story.location}
          {story.date ? ` · ${formatLongDate(story.date)}` : ""}
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-charcoal sm:text-5xl">{story.title}</h1>
        {story.coverPhotoUrl ? (
          <div className="mt-8 overflow-hidden rounded-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={story.coverPhotoUrl} alt="" className="w-full object-cover" />
          </div>
        ) : null}
        <div className="mt-8 space-y-5 text-[17px] leading-8 text-charcoal">
          {story.body.split("\n\n").map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
        <div className="mt-10 border-t border-line pt-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-soft">People in this story</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {story.personIds.map((id) => {
              const person = people.find((p) => p.id === id);
              if (!person) return null;
              return (
                <button
                  key={id}
                  type="button"
                  className="flex items-center gap-2 rounded-full bg-white px-2 py-1 pr-3"
                  onClick={() => {
                    selectPerson(person.id);
                    router.push("/tree");
                  }}
                >
                  <PersonAvatar person={person} size="sm" />
                  <span className="text-sm">{cardName(person)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </article>
    </div>
  );
}
