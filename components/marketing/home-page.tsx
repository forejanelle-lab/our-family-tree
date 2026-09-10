"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, ButtonLink, TextInput } from "@/components/ui/button";
import { LeafMark } from "@/components/ui/leaf-mark";
import { Modal } from "@/components/ui/modal";
import { useAuthStore } from "@/store/use-auth-store";

export function MarketingHome() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const lookupInvite = useAuthStore((s) => s.lookupInvite);
  const enterAsViewer = useAuthStore((s) => s.enterAsViewer);
  const signedIn = hydrated && Boolean(user);
  const searchParams = useSearchParams();

  const [inviteCode, setInviteCode] = useState("");
  const [passcode, setPasscode] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [passError, setPassError] = useState("");
  const [treeName, setTreeName] = useState("");
  const [passOpen, setPassOpen] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const preset = searchParams.get("invite");
    if (preset) setInviteCode(preset.toUpperCase());
  }, [searchParams]);

  async function onInviteSubmit(event: React.FormEvent) {
    event.preventDefault();
    setInviteError("");
    const result = await lookupInvite(inviteCode);
    if (!result.ok) {
      setInviteError(result.error);
      return;
    }
    setTreeName(result.name);
    setPasscode("");
    setPassError("");
    setPassOpen(true);
  }

  async function onPasscodeSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPassError("");
    setPending(true);
    const result = await enterAsViewer(inviteCode, passcode);
    setPending(false);
    if (!result.ok) {
      setPassError(result.error);
      return;
    }
    setPassOpen(false);
    router.push("/tree");
  }

  return (
    <div className="home-canvas min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:py-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-forest shadow-[var(--shadow-card)] ring-1 ring-line">
            <LeafMark className="h-5 w-5" />
          </span>
          <span className="font-serif text-lg tracking-tight text-charcoal sm:hidden">Family Tree</span>
          <span className="hidden font-serif text-[22px] tracking-tight text-charcoal sm:inline">Our Family Tree</span>
        </Link>
        <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
          {!hydrated ? null : signedIn ? (
            <ButtonLink href="/home" size="sm" className="sm:h-10 sm:px-4 sm:text-sm">
              Open your tree
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm" className="sm:h-10 sm:px-4 sm:text-sm">
                Sign in
              </ButtonLink>
              <ButtonLink href="/signup" size="sm" className="sm:h-10 sm:px-4 sm:text-sm">
                <span className="sm:hidden">Join</span>
                <span className="hidden sm:inline">Create account</span>
              </ButtonLink>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto flex min-w-0 max-w-5xl flex-col justify-center px-5 pb-16 pt-6 sm:min-h-[calc(100dvh-88px)] sm:px-6 sm:pb-20 sm:pt-8">
        <div className="mb-6 h-px w-12 bg-gold" />
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-forest">A private family archive</p>
        <h1 className="mt-4 min-w-0 max-w-full text-balance break-words font-serif text-4xl leading-[1.12] text-charcoal sm:mt-5 sm:text-6xl lg:text-[5.25rem] lg:leading-[1.05]">
          Keep them close to home.
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-soft sm:mt-8 sm:text-xl">
          Portraits, stories, and the quiet line from one generation to the next — held in a place that feels like an album, not software. Build a living tree. Add a parent, a partner, a child. Write the stories no one else thinks to write down. Keep living relatives private until you decide otherwise.
        </p>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-soft sm:mt-6 sm:text-xl">
          See everyone at once. Join with a code. Look without an account, or sign in when you are ready to change the archive. One name is enough to begin. Then the tree takes shape.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap">
          {signedIn ? (
            <ButtonLink href="/home" size="lg" className="w-full sm:w-auto">
              Continue your story
            </ButtonLink>
          ) : (
            <ButtonLink href="/signup" size="lg" className="w-full sm:w-auto">
              Create an account
            </ButtonLink>
          )}
        </div>

        {!signedIn ? (
          <form
            onSubmit={onInviteSubmit}
            className="mt-10 w-full rounded-[28px] border border-line bg-white/80 p-5 shadow-[var(--shadow-card)] backdrop-blur-sm sm:mt-14 sm:p-8"
          >
            <p className="font-serif text-2xl text-charcoal">Have an invite code?</p>
            <p className="mt-2 text-base text-soft">
              Look at a family tree without creating an account. Editing requires a sign-in.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <TextInput
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                placeholder="Enter invite code"
                aria-label="Invite code"
                className="font-medium tracking-[0.12em]"
                autoCapitalize="characters"
              />
              <Button type="submit" className="w-full sm:w-auto sm:px-6" disabled={!hydrated}>
                Continue
              </Button>
            </div>
            {inviteError ? <p className="mt-2 text-sm text-red-700">{inviteError}</p> : null}
          </form>
        ) : null}
      </section>

      <section className="border-t border-line bg-white/70">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-12 sm:grid-cols-2 sm:gap-14 lg:grid-cols-3">
            {[
              {
                title: "See the whole house",
                copy: "A visual tree that grows as you add a parent, a partner, a child — no charts to learn. The family sits in front of you, generation by generation.",
              },
              {
                title: "Join with a code",
                copy: "Family can look with an invite and passcode. To change the tree, they create an account with a join code. Viewing is not editing.",
              },
              {
                title: "Private on purpose",
                copy: "Living dates, notes, and photographs stay with you until you decide to share. The default is care, not a public page.",
              },
            ].map((item) => (
              <article key={item.title}>
                <div className="mb-4 h-px w-8 bg-gold" />
                <h2 className="font-serif text-[1.75rem] text-charcoal sm:text-3xl">{item.title}</h2>
                <p className="mt-4 text-base leading-relaxed text-soft">{item.copy}</p>
              </article>
            ))}
          </div>
          <p className="mt-20 font-serif text-3xl leading-snug text-charcoal sm:text-4xl">
            We tell these stories because they are the first ones. Everything else grows from them.
          </p>
          <div className="mt-12">
            <ButtonLink href={signedIn ? "/home" : "/signup"} size="lg" className="w-full sm:w-auto">
              {signedIn ? "Open your tree" : "Start with yourself"}
            </ButtonLink>
          </div>
        </div>
      </section>

      <footer className="border-t border-line px-5 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 text-sm text-soft">
          <p className="font-serif text-base text-charcoal">Our Family Tree</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-charcoal">
              Sign in
            </Link>
            <Link href="/signup" className="hover:text-charcoal">
              Create account
            </Link>
          </div>
        </div>
      </footer>

      <Modal
        open={passOpen}
        onClose={() => setPassOpen(false)}
        title="Enter the family passcode"
        subtitle={`${treeName || "This archive"} is protected. The passcode lets you look — not edit.`}
      >
        <form className="space-y-4" onSubmit={onPasscodeSubmit}>
          <TextInput
            value={passcode}
            onChange={(event) => setPasscode(event.target.value)}
            placeholder="Passcode"
            aria-label="Family passcode"
            autoFocus
            type="password"
          />
          {passError ? <p className="text-sm text-red-700">{passError}</p> : null}
          <Button type="submit" size="lg" className="w-full" disabled={pending || !passcode.trim()}>
            {pending ? "Opening…" : "View family tree"}
          </Button>
          <p className="text-center text-xs text-soft">
            Need to make changes?{" "}
            <Link href="/signup" className="font-medium text-forest hover:underline">
              Create an account with a join code
            </Link>
          </p>
        </form>
      </Modal>
    </div>
  );
}
