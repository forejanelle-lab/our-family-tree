"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Camera, GitFork, Home, Library, MoreHorizontal, Settings, Upload, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/store/use-auth-store";
import { useTreeStore } from "@/store/use-tree-store";

const TABS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/tree", label: "Tree", icon: GitFork },
  { href: "/people", label: "People", icon: Users },
  { href: "/photos", label: "Photos", icon: Camera },
] as const;

export function MobileTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const guestView = useAuthStore((s) => s.guestView);
  const signOut = useAuthStore((s) => s.signOut);
  const setShareOpen = useTreeStore((s) => s.setShareOpen);
  const [moreOpen, setMoreOpen] = useState(false);
  const tabs = guestView ? TABS.filter((tab) => tab.href !== "/home") : TABS;
  const moreActive = ["/stories", "/sources", "/settings", "/import"].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  return (
    <>
      {moreOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-charcoal/30"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] mx-3 overflow-hidden rounded-3xl border border-line bg-white shadow-[var(--shadow-soft)] bottom-sheet-in">
            <div className="p-2">
              {[
                { href: "/stories", label: "Stories", icon: BookOpen },
                { href: "/sources", label: "Sources", icon: Library },
                ...(!guestView
                  ? [
                      { href: "/settings", label: "Settings", icon: Settings },
                      { href: "/import", label: "Import", icon: Upload },
                    ]
                  : []),
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className="flex min-h-12 items-center gap-3 rounded-2xl px-3 text-[15px] text-charcoal"
                  >
                    <Icon className="h-5 w-5 text-forest" />
                    {item.label}
                  </Link>
                );
              })}
              <button
                type="button"
                className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-left text-[15px] text-charcoal"
                onClick={() => {
                  setMoreOpen(false);
                  setShareOpen(true);
                }}
              >
                <MoreHorizontal className="h-5 w-5 text-forest" />
                Share tree
              </button>
              <button
                type="button"
                className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-left text-[15px] text-red-700"
                onClick={() => {
                  setMoreOpen(false);
                  signOut();
                  router.push("/");
                }}
              >
                {guestView ? "Leave tree" : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <nav
        className="shrink-0 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
        aria-label="App"
      >
        <div className="grid h-14" style={{ gridTemplateColumns: `repeat(${tabs.length + 1}, minmax(0, 1fr))` }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = pathname === tab.href || (tab.href !== "/home" && pathname.startsWith(`${tab.href}/`));
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                  active ? "text-forest" : "text-soft",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-6 w-6" strokeWidth={active ? 2.2 : 1.75} />
                {tab.label}
              </Link>
            );
          })}
          <button
            type="button"
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
              moreOpen || moreActive ? "text-forest" : "text-soft",
            )}
            onClick={() => setMoreOpen((value) => !value)}
          >
            <MoreHorizontal className="h-6 w-6" strokeWidth={moreOpen || moreActive ? 2.2 : 1.75} />
            More
          </button>
        </div>
      </nav>
    </>
  );
}
