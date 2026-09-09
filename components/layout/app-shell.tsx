"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { ShareModal } from "@/components/share/share-modal";
import { AddPersonModal } from "@/components/person/add-person-modal";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-cream">
      <div className="hidden lg:flex">
        <Sidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="hidden lg:block">
          <TopNav />
        </div>
        <MobileHeader />
        <main className="relative min-h-0 flex-1 overflow-hidden">{children}</main>
        <MobileTabBar />
      </div>
      <ShareModal />
      <AddPersonModal />
    </div>
  );
}
