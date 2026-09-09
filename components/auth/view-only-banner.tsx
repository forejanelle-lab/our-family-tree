"use client";

import { Eye } from "lucide-react";
import { cn } from "@/lib/cn";

export function ViewOnlyBanner({ inline = false }: { inline?: boolean }) {
  return (
    <div
      className={cn(
        inline
          ? "flex"
          : "pointer-events-none absolute inset-x-0 top-24 z-20 flex justify-center px-4",
      )}
    >
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-line bg-white/95 px-3 py-2 text-xs text-charcoal shadow-[var(--shadow-card)] sm:px-4">
        <Eye className="h-3.5 w-3.5 shrink-0 text-forest" />
        Viewing only — sign in to make changes
      </div>
    </div>
  );
}
