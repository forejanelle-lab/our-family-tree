"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Pencil, Plus, Eye } from "lucide-react";
import { cn } from "@/lib/cn";
import { cardName, lifespan } from "@/lib/format";
import { PersonAvatar } from "@/components/person/person-avatar";
import type { Person } from "@/lib/types";

export type PersonNodeData = {
  person: Person;
  selected: boolean;
  canEdit: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onAddRelative: (id: string) => void;
};

export type PersonFlowNode = Node<PersonNodeData, "person">;

export function PersonNode({ data }: NodeProps<PersonFlowNode>) {
  const { person, selected } = data;

  return (
    <div className="group relative" onClick={() => data.onSelect(person.id)}>
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-none !bg-transparent" />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-none !bg-transparent"
      />
      <Handle
        id="left"
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-none !bg-transparent"
      />
      <Handle
        id="right"
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-none !bg-transparent"
      />
      <div
        className={cn(
          "flex w-[188px] flex-col items-center rounded-2xl border bg-white px-4 pb-4 pt-5 shadow-[var(--shadow-card)] transition-all duration-200",
          selected ? "border-forest ring-4 ring-forest/10" : "border-line hover:-translate-y-0.5 hover:border-forest/30",
        )}
      >
        <PersonAvatar person={person} size="md" />
        <h3 className="mt-3 text-center font-serif text-[17px] leading-tight text-charcoal">
          {cardName(person)}
        </h3>
        <p className="mt-1 text-[12px] text-soft">{lifespan(person)}</p>
      </div>
      <div
        className={cn(
          "absolute left-1/2 top-full z-20 mt-2 flex -translate-x-1/2 gap-1 transition-opacity duration-150",
          selected
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0 [@media(hover:hover)]:group-hover:pointer-events-auto [@media(hover:hover)]:group-hover:opacity-100",
        )}
      >
        {data.canEdit ? (
          <button
            type="button"
            className="flex h-10 items-center gap-1 rounded-full border border-line bg-white px-3 text-xs text-charcoal shadow-sm hover:border-forest"
            onClick={(event) => {
              event.stopPropagation();
              data.onAddRelative(person.id);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        ) : null}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-soft shadow-sm hover:text-charcoal"
          aria-label={`View ${cardName(person)}`}
          onClick={(event) => {
            event.stopPropagation();
            data.onSelect(person.id);
          }}
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-soft shadow-sm hover:text-charcoal"
          aria-label={`Edit ${cardName(person)}`}
          onClick={(event) => {
            event.stopPropagation();
            data.onEdit(person.id);
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
