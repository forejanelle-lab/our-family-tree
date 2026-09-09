"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Pencil, Plus, X } from "lucide-react";
import { PersonAvatar } from "@/components/person/person-avatar";
import { PhotoUploader } from "@/components/person/photo-uploader";
import { Button, Field, TextArea, TextInput } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { cardName, displayName, formatLongDate, lifespan } from "@/lib/format";
import {
  getChildren,
  getParents,
  getPartners,
  getSiblings,
} from "@/lib/relationships";
import type { Person, PersonDraft } from "@/lib/types";
import { useTreeStore, type ProfileTab } from "@/store/use-tree-store";
import { useAuthStore, useCanEdit } from "@/store/use-auth-store";

function RelList({
  label,
  ids,
  people,
  onSelect,
}: {
  label: string;
  ids: string[];
  people: Person[];
  onSelect: (id: string) => void;
}) {
  const items = ids
    .map((id) => people.find((p) => p.id === id))
    .filter(Boolean) as Person[];
  if (!items.length) return null;
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-soft">{label}</p>
      <div className="mt-2 space-y-1.5">
        {items.map((person) => (
          <button
            key={person.id}
            type="button"
            onClick={() => onSelect(person.id)}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-1 py-2 text-left hover:bg-cream"
          >
            <PersonAvatar person={person} size="sm" />
            <span className="text-sm text-charcoal">{displayName(person)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function PersonProfile({ mobile = false }: { mobile?: boolean }) {
  const people = useTreeStore((s) => s.people);
  const relationships = useTreeStore((s) => s.relationships);
  const photos = useTreeStore((s) => s.photos);
  const stories = useTreeStore((s) => s.stories);
  const events = useTreeStore((s) => s.events);
  const selectedPersonId = useTreeStore((s) => s.selectedPersonId);
  const tab = useTreeStore((s) => s.profileTab);
  const setProfileTab = useTreeStore((s) => s.setProfileTab);
  const closeProfile = useTreeStore((s) => s.closeProfile);
  const openAddPerson = useTreeStore((s) => s.openAddPerson);
  const selectPerson = useTreeStore((s) => s.selectPerson);
  const updatePerson = useTreeStore((s) => s.updatePerson);
  const deletePerson = useTreeStore((s) => s.deletePerson);
  const editing = useTreeStore((s) => s.profileEditing);
  const setProfileEditing = useTreeStore((s) => s.setProfileEditing);
  const canEdit = useCanEdit();
  const openSignInPrompt = useAuthStore((s) => s.openSignInPrompt);
  const [menuOpen, setMenuOpen] = useState(false);

  const person = people.find((p) => p.id === selectedPersonId);
  const related = useMemo(() => {
    if (!person) return null;
    return {
      parents: getParents(person.id, relationships).map((p) => p.id),
      siblings: getSiblings(person.id, relationships),
      partners: getPartners(person.id, relationships).map((p) => p.id),
      children: getChildren(person.id, relationships).map((p) => p.id),
    };
  }, [person, relationships]);

  if (!person || !related) return null;

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "photos", label: "Photos" },
    { id: "stories", label: "Stories" },
    { id: "events", label: "Events" },
  ];

  const personPhotos = photos.filter((p) => p.taggedPersonIds.includes(person.id));
  const personStories = stories.filter((s) => s.personIds.includes(person.id));
  const personEvents = events.filter((e) => e.personId === person.id);

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-line bg-white",
        mobile
          ? "max-h-[min(82vh,calc(100dvh-env(safe-area-inset-bottom)))] rounded-t-3xl border-t pb-[env(safe-area-inset-bottom)] shadow-[var(--shadow-soft)] bottom-sheet-in"
          : "border-l sheet-in",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 px-4 pt-4 sm:px-5 sm:pt-5">
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full text-soft hover:bg-cream lg:hidden"
          onClick={closeProfile}
          aria-label="Close profile"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="ml-auto flex items-center gap-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              canEdit ? openAddPerson({ anchorId: person.id }) : openSignInPrompt()
            }
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Add relative</span>
            <span className="sm:hidden">Add</span>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => (canEdit ? setProfileEditing(!editing) : openSignInPrompt())}
          >
            <Pencil className="h-3.5 w-3.5" />
            {editing ? "Done" : "Edit"}
          </Button>
          <div className="relative">
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full text-soft hover:bg-cream"
              aria-label="More actions"
              onClick={() => (canEdit ? setMenuOpen((v) => !v) : openSignInPrompt())}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 z-10 mt-1 w-52 rounded-xl border border-line bg-white p-1 shadow-[var(--shadow-soft)]">
                {people.length > 1 ? (
                  <button
                    type="button"
                    className="block min-h-11 w-full rounded-lg px-3 py-2.5 text-left text-sm text-charcoal hover:bg-cream"
                    onClick={() => {
                      openAddPerson({ anchorId: person.id, mode: "link" });
                      setMenuOpen(false);
                    }}
                  >
                    Link existing relative
                  </button>
                ) : null}
                <button
                  type="button"
                  className="block min-h-11 w-full rounded-lg px-3 py-2.5 text-left text-sm text-red-700 hover:bg-red-50"
                  onClick={() => {
                    deletePerson(person.id);
                    setMenuOpen(false);
                  }}
                >
                  Remove from tree
                </button>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="hidden h-11 w-11 items-center justify-center rounded-full text-soft hover:bg-cream lg:flex"
            onClick={closeProfile}
            aria-label="Close profile"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center px-6 pb-4 pt-2 text-center">
        <PersonAvatar person={person} size="lg" />
        <h2 className="mt-4 font-serif text-2xl text-charcoal">{cardName(person)}</h2>
        <p className="mt-1 text-sm text-soft">{lifespan(person)}</p>
      </div>

      <div className="flex gap-1 px-3 sm:px-4">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setProfileTab(item.id)}
            className={cn(
              "min-h-11 flex-1 rounded-full px-2 py-2 text-xs sm:text-sm",
              tab === item.id ? "bg-sage-soft font-medium text-forest" : "text-soft hover:text-charcoal",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto scrollbar-thin px-6 pb-8">
        {editing ? (
          <EditPersonForm
            person={person}
            onSave={(patch) => {
              updatePerson(person.id, patch);
              setProfileEditing(false);
            }}
            onCancel={() => setProfileEditing(false)}
          />
        ) : null}

        {!editing && tab === "details" ? (
          <div className="space-y-6">
            {person.birthDate || person.birthPlace ? (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-soft">Born</p>
                <p className="mt-1 text-sm text-charcoal">
                  {formatLongDate(person.birthDate) || "Date unknown"}
                </p>
                {person.birthPlace ? <p className="text-sm text-soft">{person.birthPlace}</p> : null}
              </div>
            ) : null}
            {person.occupation ? (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-soft">Occupation</p>
                <p className="mt-1 text-sm text-charcoal">{person.occupation}</p>
              </div>
            ) : null}
            {person.biography ? (
              <p className="text-sm leading-relaxed text-charcoal/90">{person.biography}</p>
            ) : null}
            <RelList label="Parents" ids={related.parents} people={people} onSelect={selectPerson} />
            <RelList label="Siblings" ids={related.siblings} people={people} onSelect={selectPerson} />
            <RelList
              label={related.partners.length > 1 ? "Partners" : "Partner"}
              ids={related.partners}
              people={people}
              onSelect={selectPerson}
            />
            <RelList label="Children" ids={related.children} people={people} onSelect={selectPerson} />
          </div>
        ) : null}

        {!editing && tab === "photos" ? (
          <div className="grid grid-cols-2 gap-3">
            {personPhotos.length === 0 ? (
              <p className="col-span-2 text-sm text-soft">No photos tagged yet.</p>
            ) : (
              personPhotos.map((photo) => (
                <figure key={photo.id} className="overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.caption} className="h-28 w-full object-cover" />
                  <figcaption className="mt-1.5 text-xs text-soft">{photo.caption}</figcaption>
                </figure>
              ))
            )}
          </div>
        ) : null}

        {!editing && tab === "stories" ? (
          <div className="space-y-3">
            {personStories.length === 0 ? (
              <p className="text-sm text-soft">No stories yet.</p>
            ) : (
              personStories.map((story) => (
                <a
                  key={story.id}
                  href={`/stories/${story.id}`}
                  className="block overflow-hidden rounded-2xl border border-line"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={story.coverPhotoUrl} alt="" className="h-28 w-full object-cover" />
                  <div className="p-3">
                    <p className="font-serif text-lg text-charcoal">{story.title}</p>
                    <p className="mt-1 text-xs text-soft">{story.location}</p>
                  </div>
                </a>
              ))
            )}
          </div>
        ) : null}

        {!editing && tab === "events" ? (
          <div className="space-y-4">
            {personEvents.length === 0 ? (
              <p className="text-sm text-soft">No events recorded.</p>
            ) : (
              personEvents.map((event) => (
                <div key={event.id} className="border-l border-gold pl-3">
                  <p className="text-sm font-medium text-charcoal">{event.title}</p>
                  <p className="text-xs text-soft">
                    {formatLongDate(event.date)}
                    {event.location ? ` · ${event.location}` : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function EditPersonForm({
  person,
  onSave,
  onCancel,
}: {
  person: Person;
  onSave: (patch: Partial<Person>) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<PersonDraft>({
    firstName: person.firstName,
    middleName: person.middleName,
    lastName: person.lastName,
    preferredName: person.preferredName,
    gender: person.gender,
    birthDate: person.birthDate,
    deathDate: person.deathDate,
    birthPlace: person.birthPlace,
    currentLocation: person.currentLocation,
    occupation: person.occupation,
    education: person.education,
    biography: person.biography,
    email: person.email,
    phone: person.phone,
    website: person.website,
    profilePhotoUrl: person.profilePhotoUrl,
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(draft);
      }}
    >
      <PhotoUploader
        value={draft.profilePhotoUrl}
        onChange={(profilePhotoUrl) => setDraft((d) => ({ ...d, profilePhotoUrl }))}
        size="md"
      />
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name">
          <TextInput value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} required />
        </Field>
        <Field label="Last name">
          <TextInput value={draft.lastName} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} />
        </Field>
      </div>
      <Field label="Birth date">
        <TextInput type="date" value={draft.birthDate} onChange={(e) => setDraft({ ...draft, birthDate: e.target.value })} />
      </Field>
      <Field label="Death date">
        <TextInput type="date" value={draft.deathDate} onChange={(e) => setDraft({ ...draft, deathDate: e.target.value })} />
      </Field>
      <Field label="Biography">
        <TextArea value={draft.biography} onChange={(e) => setDraft({ ...draft, biography: e.target.value })} />
      </Field>
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">
          Save
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
