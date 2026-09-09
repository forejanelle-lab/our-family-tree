"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LeafMark } from "@/components/ui/leaf-mark";
import { useAuthStore } from "@/store/use-auth-store";

export function Splash() {
  return (
    <div className="flex h-dvh items-center justify-center bg-cream">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage text-forest">
        <LeafMark className="h-7 w-7" />
      </div>
    </div>
  );
}

const GUEST_ALLOWED = ["/tree", "/people", "/photos", "/stories", "/sources"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const guestView = useAuthStore((s) => s.guestView);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    if (!user && !guestView) {
      router.replace("/login");
      return;
    }
    if (guestView && !user && !GUEST_ALLOWED.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
      router.replace("/tree");
    }
  }, [hydrated, user, guestView, pathname, router]);

  if (!hydrated || (!user && !guestView)) return <Splash />;
  return children;
}

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (hydrated && user) router.replace("/home");
  }, [hydrated, user, router]);

  if (!hydrated) return <Splash />;
  if (user) return <Splash />;
  return children;
}
