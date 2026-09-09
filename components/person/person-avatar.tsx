import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";
import type { Person } from "@/lib/types";

export function PersonAvatar({
  person,
  src,
  size = "md",
  alt,
}: {
  person?: Pick<Person, "firstName" | "lastName" | "profilePhotoUrl">;
  src?: string;
  size?: "sm" | "md" | "lg" | "xl";
  alt?: string;
}) {
  const url = src || person?.profilePhotoUrl;
  const label = alt || (person ? `${person.firstName} ${person.lastName}` : "Portrait");
  const dim =
    size === "sm" ? "h-9 w-9 text-[10px]" : size === "md" ? "h-16 w-16 text-sm" : size === "lg" ? "h-24 w-24 text-lg" : "h-32 w-32 text-xl";

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full border border-line bg-sage-soft text-forest",
        dim,
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={label} className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-medium">
          {person ? initials(person) : "+"}
        </span>
      )}
    </div>
  );
}
