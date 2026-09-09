"use client";

import { Eye } from "lucide-react";

export function ViewOnlyBanner() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[88px] z-20 flex justify-center px-4 sm:top-24">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-line bg-white/95 px-4 py-2 text-xs text-charcoal shadow-[var(--shadow-card)]">
        <Eye className="h-3.5 w-3.5 text-forest" />
        Viewing only — sign in to make changes
      </div>
    </div>
  );
}
