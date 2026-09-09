"use client";

import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { SignInPrompt } from "@/components/auth/sign-in-prompt";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
      <SignInPrompt />
    </AuthGuard>
  );
}
