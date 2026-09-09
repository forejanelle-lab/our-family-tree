"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { PersonAvatar } from "@/components/person/person-avatar";
import { PhotoUploader } from "@/components/person/photo-uploader";
import { Button, Field, TextArea, TextInput } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cardName, formatLongDate } from "@/lib/format";
import { useTreeStore } from "@/store/use-tree-store";
import { useAuthStore, useCanEdit } from "@/store/use-auth-store";
import { useRouter } from "next/navigation";

export function PhotoGallery() {
  const photos = useTreeStore((s) => s.photos);
  const people = useTreeStore((s) => s.people);
  const addPhoto = useTreeStore((s) => s.addPhoto);
  const selectPerson = useTreeStore((s) => s.selectPerson);
  const router = useRouter();
  const canEdit = useCanEdit();
  const openSignInPrompt = useAuthStore((s) => s.openSignInPrompt);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const active = photos.find((p) => p.id === activeId);

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl text-charcoal sm:text-4xl">Photos</h1>
            <p className="mt-2 text-sm text-soft">Portraits, gatherings, and the pictures that hold a house together.</p>
          </div>
          <Button onClick={() => (canEdit ? setUploadOpen(true) : openSignInPrompt())}>Upload photo</Button>
        </div>
        <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {photos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setActiveId(photo.id)}
              className="mb-4 block w-full overflow-hidden rounded-3xl border border-line bg-white text-left shadow-[var(--shadow-card)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={photo.caption} className="w-full object-cover" />
              <span className="block px-4 py-3">
                <span className="block font-serif text-lg text-charcoal">{photo.caption}</span>
                <span className="mt-1 block text-xs text-soft">
                  {photo.location}
                  {photo.date ? ` · ${photo.date.slice(0, 4)}` : ""}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {active ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <button type="button" className="absolute inset-0 bg-charcoal/40" aria-label="Close photo" onClick={() => setActiveId(null)} />
          <div className="relative z-10 max-h-[min(92vh,calc(100dvh-env(safe-area-inset-bottom)))] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-cream pb-[env(safe-area-inset-bottom)] shadow-[var(--shadow-soft)] sm:rounded-3xl sm:pb-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active.url} alt={active.caption} className="max-h-[40vh] w-full object-cover sm:max-h-[50vh]" />
            <button
              type="button"
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/90"
              onClick={() => setActiveId(null)}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="p-6">
              <h2 className="font-serif text-3xl text-charcoal">{active.caption}</h2>
              <p className="mt-2 text-sm text-soft">
                {formatLongDate(active.date)}
                {active.location ? ` · ${active.location}` : ""}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-charcoal">{active.description}</p>
              <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.14em] text-soft">People in the photo</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {active.taggedPersonIds.map((id) => {
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
          </div>
        </div>
      ) : null}

      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Add a family photo">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!url) return;
            addPhoto({
              url,
              caption,
              date,
              location,
              description,
              taggedPersonIds: tags,
              isPrivate: false,
            });
            setUploadOpen(false);
            setCaption("");
            setDate("");
            setLocation("");
            setDescription("");
            setUrl("");
            setTags([]);
          }}
        >
          <PhotoUploader value={url} onChange={setUrl} label="Drop a photo" />
          <Field label="Caption">
            <TextInput value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Family Christmas — 1998" required />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Date">
              <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Location">
              <TextInput value={location} onChange={(e) => setLocation(e.target.value)} />
            </Field>
          </div>
          <Field label="Description">
            <TextArea value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label="People tagged">
            <div className="flex flex-wrap gap-2">
              {people.map((person) => {
                const on = tags.includes(person.id);
                return (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => setTags((curr) => (on ? curr.filter((id) => id !== person.id) : [...curr, person.id]))}
                    className={`rounded-full border px-3 py-1 text-xs ${on ? "border-forest bg-sage-soft text-forest" : "border-line bg-white"}`}
                  >
                    {cardName(person)}
                  </button>
                );
              })}
            </div>
          </Field>
          <Button type="submit" className="w-full" disabled={!url || !caption}>
            Save photo
          </Button>
        </form>
      </Modal>
    </div>
  );
}
