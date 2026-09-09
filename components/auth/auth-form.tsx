"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button, Field, TextInput } from "@/components/ui/button";
import { LeafMark } from "@/components/ui/leaf-mark";
import { useAuthStore } from "@/store/use-auth-store";

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [joinCode, setJoinCode] = useState(searchParams.get("join") ?? "");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const isSignUp = mode === "signup";

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (isSignUp && password !== confirm) {
      setError("Passwords don’t match.");
      return;
    }
    setPending(true);
    const result = isSignUp
      ? await signUp(name, email, password, joinCode)
      : await signIn(email, password);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(isSignUp && joinCode.trim() ? "/tree" : "/home");
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-forest px-12 py-12 text-cream lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-2.5 text-cream">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
            <LeafMark className="h-5 w-5" />
          </span>
          <span className="font-serif text-xl">Our Family Tree</span>
        </Link>
        <div>
          <p className="font-serif text-4xl leading-tight">Preserve your story for generations.</p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/75">
            A quiet archive for portraits, recipes, and the people who made you. Private by default. Beautiful on purpose.
          </p>
        </div>
        <p className="text-xs text-cream/50">
          {isSignUp
            ? "Have a family join code? Add it below to edit an existing tree."
            : "Living relatives stay hidden from public views."}
        </p>
      </aside>

      <div className="flex items-center justify-center bg-cream px-5 py-10 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-12">
        <div className="w-full max-w-[400px]">
          <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sage text-forest">
              <LeafMark className="h-5 w-5" />
            </span>
            <span className="font-serif text-xl text-charcoal">Family Tree</span>
          </Link>
          <h1 className="font-serif text-[2rem] leading-tight text-charcoal sm:text-4xl">
            {isSignUp ? "Create your archive" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-soft">
            {isSignUp
              ? "Start a new tree, or join one you were invited to."
              : "Use the same email and password you created. We’ll keep this account on your phone."}
          </p>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            {isSignUp ? (
              <Field label="Your name" htmlFor="name">
                <TextInput
                  id="name"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </Field>
            ) : null}
            <Field label="Email" htmlFor="email">
              <TextInput
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </Field>
            <Field label="Password" htmlFor="password">
              <div className="relative">
                <TextInput
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={isSignUp ? 8 : undefined}
                  required
                  className="pr-11"
                />
                <button
                  type="button"
                  className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-soft hover:text-charcoal"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            {isSignUp ? (
              <Field label="Confirm password" htmlFor="confirm">
                <TextInput
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  required
                />
              </Field>
            ) : null}
            {isSignUp ? (
              <Field
                label="Family join code"
                htmlFor="join"
                hint="Optional. Use this to join a tree and make changes. Leave blank to start your own."
              >
                <TextInput
                  id="join"
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                  placeholder="OAK-1935"
                  autoCapitalize="characters"
                />
              </Field>
            ) : null}
            {error ? (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" size="lg" className="w-full" disabled={pending || !hydrated}>
              {pending ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-soft">
            {isSignUp ? (
              <>
                Already have an archive?{" "}
                <Link href="/login" className="font-medium text-forest hover:underline">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New here?{" "}
                <Link href="/signup" className="font-medium text-forest hover:underline">
                  Create an account
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
