"use client";

import { useState } from "react";
import { StoryCard } from "@/components/stories/story-card";
import { Button, Field, TextArea, TextInput } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PhotoUploader } from "@/components/person/photo-uploader";
import { cardName } from "@/lib/format";
import { useTreeStore } from "@/store/use-tree-store";
import { useAuthStore, useCanEdit } from "@/store/use-auth-store";

export default function StoriesPage() {
  const stories = useTreeStore((s) => s.stories);
  const people = useTreeStore((s) => s.people);
  const addStory = useTreeStore((s) => s.addStory);
  const canEdit = useCanEdit();
  const openSignInPrompt = useAuthStore((s) => s.openSignInPrompt);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [cover, setCover] = useState("");
  const [personIds, setPersonIds] = useState<string[]>([]);

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl text-charcoal sm:text-4xl">Stories</h1>
            <p className="mt-2 text-sm text-soft">A digital family scrapbook, not a filing cabinet.</p>
          </div>
          <Button onClick={() => (canEdit ? setOpen(true) : openSignInPrompt())}>Write a story</Button>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Write a family story" wide>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            addStory({
              title,
              body,
              date,
              location,
              coverPhotoUrl: cover,
              personIds,
              isPrivate: false,
            });
            setOpen(false);
            setTitle("");
            setBody("");
            setDate("");
            setLocation("");
            setCover("");
            setPersonIds([]);
          }}
        >
          <PhotoUploader value={cover} onChange={setCover} label="Cover photo" />
          <Field label="Title">
            <TextInput value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Date">
              <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Location">
              <TextInput value={location} onChange={(e) => setLocation(e.target.value)} />
            </Field>
          </div>
          <Field label="Story">
            <TextArea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[180px]" required />
          </Field>
          <Field label="People involved">
            <div className="flex flex-wrap gap-2">
              {people.map((person) => {
                const on = personIds.includes(person.id);
                return (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() =>
                      setPersonIds((curr) => (on ? curr.filter((id) => id !== person.id) : [...curr, person.id]))
                    }
                    className={`rounded-full border px-3 py-1 text-xs ${on ? "border-forest bg-sage-soft text-forest" : "border-line bg-white"}`}
                  >
                    {cardName(person)}
                  </button>
                );
              })}
            </div>
          </Field>
          <Button type="submit" className="w-full" disabled={!title || !body}>
            Save story
          </Button>
        </form>
      </Modal>
    </div>
  );
}
