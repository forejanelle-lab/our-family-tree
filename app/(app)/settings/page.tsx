"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useActiveTree, useTreeStore } from "@/store/use-tree-store";
import { useAuthStore } from "@/store/use-auth-store";

export default function SettingsPage() {
  const router = useRouter();
  const tree = useActiveTree();
  const updateTree = useTreeStore((s) => s.updateTree);
  const loadWilliamsTree = useTreeStore((s) => s.loadWilliamsTree);
  const createEmptyTree = useTreeStore((s) => s.createEmptyTree);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  if (!tree) return null;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-2xl px-4 py-4 lg:px-10 lg:py-8">
        <h1 className="hidden font-serif text-4xl text-charcoal lg:block">Settings</h1>
        <p className="text-sm text-soft lg:mt-2">Keep the archive warm, private, and yours.</p>

        <section className="mt-8 rounded-3xl border border-line bg-white p-6">
          <h2 className="font-serif text-2xl">Your profile</h2>
          <p className="mt-2 text-sm text-charcoal">{user?.name}</p>
          <p className="text-sm text-soft">{user?.email}</p>
          <Button
            className="mt-5"
            variant="secondary"
            onClick={() => {
              signOut();
              router.push("/");
            }}
          >
            Sign out
          </Button>
        </section>

        <section className="mt-5 rounded-3xl border border-line bg-white p-6">
          <h2 className="font-serif text-2xl">Privacy</h2>
          <p className="mt-2 text-sm text-soft">
            Living people’s sensitive information is hidden from public views by default.
          </p>
          <div className="mt-5 space-y-3">
            {[
              ["hideLivingDates", "Hide living people's birth dates"],
              ["hideContactInfo", "Hide contact information"],
              ["hidePrivateNotes", "Hide private notes"],
              ["hidePhotosPublic", "Hide photos from shared links"],
            ].map(([key, label]) => (
              <label key={key} className="flex min-h-12 items-center justify-between gap-3 rounded-xl bg-cream px-3 py-3 text-sm">
                <span>{label}</span>
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-forest"
                  checked={Boolean(tree[key as keyof typeof tree])}
                  onChange={(event) => updateTree({ [key]: event.target.checked })}
                />
              </label>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-line bg-white p-6">
          <h2 className="font-serif text-2xl">This tree</h2>
          <p className="mt-2 text-sm text-soft">{tree.name}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={loadWilliamsTree}>
              Restore Williams sample
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                if (confirm("Start a new empty tree? Your current local copy will be replaced.")) {
                  createEmptyTree();
                }
              }}
            >
              Start over
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
