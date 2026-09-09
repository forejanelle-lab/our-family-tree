"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Camera, GitFork, Home, Library, LogOut, Settings, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { firstNameFrom } from "@/lib/auth";
import { LeafMark } from "@/components/ui/leaf-mark";
import { useAuthStore } from "@/store/use-auth-store";

const NAV = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/tree", label: "Tree", icon: GitFork },
  { href: "/people", label: "People", icon: Users },
  { href: "/photos", label: "Photos", icon: Camera },
  { href: "/stories", label: "Stories", icon: BookOpen },
  { href: "/sources", label: "Sources", icon: Library },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const guestView = useAuthStore((s) => s.guestView);
  const signOut = useAuthStore((s) => s.signOut);
  const items = guestView ? NAV.filter((item) => item.href !== "/home" && item.href !== "/settings") : NAV;

  return (
    <aside className="flex h-full w-[min(232px,85vw)] shrink-0 flex-col border-r border-line bg-white">
      <Link href={guestView ? "/tree" : "/home"} className="flex items-center gap-2.5 px-5 pb-6 pt-7" onClick={onNavigate}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage text-forest">
          <LeafMark className="h-5 w-5" />
        </span>
        <span className="font-serif text-[19px] leading-tight tracking-tight text-charcoal">
          Our Family Tree
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5 px-3" aria-label="Main">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/home" && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors lg:min-h-0 lg:py-2.5",
                active
                  ? "bg-sage-soft font-medium text-forest"
                  : "text-soft hover:bg-cream hover:text-charcoal",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="rounded-2xl border border-line bg-cream px-4 py-4">
          <LeafMark className="mb-3 h-5 w-5 text-forest" />
          <p className="font-serif text-lg leading-snug text-charcoal">
            Preserve your story
            <br />
            for generations.
          </p>
        </div>
        {user || guestView ? (
          <div className="mt-3 flex items-center justify-between gap-2 px-1 pt-1">
            <p className="min-w-0 truncate text-xs text-soft">
              {guestView ? "Viewing" : firstNameFrom(user?.name || "")}
            </p>
            <button
              type="button"
              className="flex min-h-11 items-center gap-1 text-xs text-soft hover:text-charcoal"
              onClick={() => {
                signOut();
                onNavigate?.();
                router.push("/");
              }}
            >
              <LogOut className="h-3.5 w-3.5" />
              {guestView ? "Leave" : "Sign out"}
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
