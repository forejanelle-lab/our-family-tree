"use client";

import { Maximize2, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

export function TreeControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onFit,
  generations,
  maxGenerations,
  onGenerations,
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  generations: number;
  maxGenerations: number;
  onGenerations: (value: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center rounded-full border border-line bg-white p-1">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full text-soft hover:bg-cream hover:text-charcoal"
          aria-label="Zoom out"
          onClick={onZoomOut}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="min-w-[3.2rem] text-center text-xs text-charcoal">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full text-soft hover:bg-cream hover:text-charcoal"
          aria-label="Zoom in"
          onClick={onZoomIn}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-soft hover:text-charcoal"
        aria-label="Fit tree to screen"
        onClick={onFit}
      >
        <Maximize2 className="h-4 w-4" />
      </button>
      <label className="relative">
        <span className="sr-only">Visible generations</span>
        <select
          value={generations}
          onChange={(event) => onGenerations(Number(event.target.value))}
          className={cn(
            "h-11 appearance-none rounded-full border border-line bg-white pl-3 pr-7 text-sm text-charcoal sm:h-10 sm:pl-4 sm:pr-8",
          )}
        >
          {Array.from({ length: maxGenerations }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "Gen" : "Gens"}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
