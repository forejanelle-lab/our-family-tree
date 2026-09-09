"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { ShareModal } from "@/components/share/share-modal";
import { AddPersonModal } from "@/components/person/add-person-modal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-cream">
      <div className="hidden lg:flex">
        <Sidebar />
      </div>
      {mobileNav ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-charcoal/30"
            aria-label="Close navigation"
            onClick={() => setMobileNav(false)}
          />
          <div className="relative z-10 h-full">
            <Sidebar onNavigate={() => setMobileNav(false)} />
          </div>
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center border-b border-line bg-white lg:border-0">
          <button
            type="button"
            className="ml-2 flex h-10 w-10 items-center justify-center rounded-full text-charcoal lg:hidden"
            aria-label={mobileNav ? "Close menu" : "Open menu"}
            onClick={() => setMobileNav((v) => !v)}
          >
            {mobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="min-w-0 flex-1">
            <TopNav />
          </div>
        </div>
        <main className="relative min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
      <ShareModal />
      <AddPersonModal />
    </div>
  );
}
