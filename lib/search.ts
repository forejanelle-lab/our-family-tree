import type { Person, Photo, Story, FamilyEvent } from "./types";
import { cardName, displayName } from "./format";

export type SearchGroup = "People" | "Stories" | "Photos" | "Places" | "Events";

export interface SearchHit {
  id: string;
  group: SearchGroup;
  title: string;
  subtitle: string;
  href?: string;
  personId?: string;
  photoId?: string;
  storyId?: string;
}

export function searchAll(query: string, data: {
  people: Person[];
  stories: Story[];
  photos: Photo[];
  events: FamilyEvent[];
}): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const hits: SearchHit[] = [];

  for (const person of data.people) {
    const hay = [
      cardName(person),
      displayName(person),
      person.preferredName,
      person.birthPlace,
      person.currentLocation,
      person.occupation,
    ]
      .join(" ")
      .toLowerCase();
    if (hay.includes(q)) {
      hits.push({
        id: `person-${person.id}`,
        group: "People",
        title: cardName(person),
        subtitle: person.occupation || person.birthPlace || "Family member",
        personId: person.id,
      });
    }
  }

  for (const story of data.stories) {
    const hay = `${story.title} ${story.body} ${story.location}`.toLowerCase();
    if (hay.includes(q)) {
      hits.push({
        id: `story-${story.id}`,
        group: "Stories",
        title: story.title,
        subtitle: story.location || story.date,
        storyId: story.id,
        href: `/stories/${story.id}`,
      });
    }
  }

  for (const photo of data.photos) {
    const hay = `${photo.caption} ${photo.description} ${photo.location}`.toLowerCase();
    if (hay.includes(q)) {
      hits.push({
        id: `photo-${photo.id}`,
        group: "Photos",
        title: photo.caption,
        subtitle: photo.location || photo.date,
        photoId: photo.id,
        href: "/photos",
      });
    }
  }

  const places = new Set<string>();
  for (const person of data.people) {
    for (const place of [person.birthPlace, person.currentLocation, person.deathPlace]) {
      if (place && place.toLowerCase().includes(q) && !places.has(place)) {
        places.add(place);
        hits.push({
          id: `place-${place}`,
          group: "Places",
          title: place,
          subtitle: "Place in family history",
        });
      }
    }
  }
  for (const photo of data.photos) {
    if (photo.location && photo.location.toLowerCase().includes(q) && !places.has(photo.location)) {
      places.add(photo.location);
      hits.push({
        id: `place-${photo.location}`,
        group: "Places",
        title: photo.location,
        subtitle: "Place in family history",
      });
    }
  }

  for (const event of data.events) {
    const hay = `${event.title} ${event.location} ${event.description}`.toLowerCase();
    if (hay.includes(q)) {
      hits.push({
        id: `event-${event.id}`,
        group: "Events",
        title: event.title,
        subtitle: event.location || event.date,
        personId: event.personId,
      });
    }
  }

  return hits;
}
