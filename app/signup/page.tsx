"use client";

import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { GuestGuard, Splash } from "@/components/auth/auth-guard";

export default function SignUpPage() {
  return (
    <GuestGuard>
      <Suspense fallback={<Splash />}>
        <AuthForm mode="signup" />
      </Suspense>
    </GuestGuard>
  );
}
