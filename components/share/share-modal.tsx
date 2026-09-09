"use client";

import { useState } from "react";
import { Check, Copy, Link2, Lock, Users } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useActiveTree, useTreeStore } from "@/store/use-tree-store";
import type { ShareAccess } from "@/lib/types";

const OPTIONS: { id: ShareAccess; title: string; description: string; icon: typeof Lock }[] = [
  { id: "private", title: "Private", description: "Only you can see this tree.", icon: Lock },
  { id: "link", title: "Anyone with the link", description: "People you send the link to can view a privacy-safe version.", icon: Link2 },
  { id: "family", title: "Family members only", description: "Invited relatives can view and contribute.", icon: Users },
];

export function ShareModal() {
  const open = useTreeStore((s) => s.shareOpen);
  const setShareOpen = useTreeStore((s) => s.setShareOpen);
  const tree = useActiveTree();
  const setShareAccess = useTreeStore((s) => s.setShareAccess);
  const updateTree = useTreeStore((s) => s.updateTree);
  const [copied, setCopied] = useState(false);
  const link = "https://ourfamilytree.app/s/williams-family";

  if (!tree) return null;

  return (
    <Modal
      open={open}
      onClose={() => setShareOpen(false)}
      title="Share your family tree"
      subtitle="Privacy controls stay with you. Living relatives are hidden from public views by default."
    >
      <div className="space-y-3">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = tree.shareAccess === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setShareAccess(option.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors",
                active ? "border-forest bg-sage-soft" : "border-line bg-white hover:bg-cream",
              )}
            >
              <span className="mt-0.5 text-forest">
                <Icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-medium text-charcoal">{option.title}</span>
                <span className="mt-0.5 block text-sm text-soft">{option.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-white p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-soft">Shareable link</p>
        <div className="mt-2 flex items-center gap-2">
          <code className="flex-1 truncate rounded-xl bg-cream px-3 py-2 text-xs text-charcoal">{link}</code>
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              await navigator.clipboard.writeText(link);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-3 rounded-2xl border border-line bg-cream p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-soft">Family codes</p>
        {[
          ["Invite code", tree.inviteCode, "For viewing. Enter this on the homepage."],
          ["View passcode", tree.viewPasscode, "Asked after the invite code. Look, don’t edit."],
          ["Join code", tree.editCode, "Used when creating an account to join and edit."],
        ].map(([label, value, hint]) => (
          <div key={label} className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-charcoal">{label}</p>
              <p className="text-xs text-soft">{hint}</p>
            </div>
            <code className="rounded-lg bg-white px-2 py-1 text-xs tracking-wide">{value}</code>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-soft">Hide from shared view</p>
        {[
          ["hideLivingDates", "Living people's birth dates"],
          ["hideContactInfo", "Contact information"],
          ["hidePrivateNotes", "Private notes"],
          ["hidePhotosPublic", "Photos"],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5 text-sm">
            <span>{label}</span>
            <input
              type="checkbox"
              className="h-4 w-4 accent-forest"
              checked={Boolean(tree[key as keyof typeof tree])}
              onChange={(event) => updateTree({ [key]: event.target.checked })}
            />
          </label>
        ))}
      </div>
    </Modal>
  );
}
