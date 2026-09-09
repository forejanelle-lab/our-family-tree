"use client";

import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/use-auth-store";

export function SignInPrompt() {
  const router = useRouter();
  const open = useAuthStore((s) => s.signInPromptOpen);
  const close = useAuthStore((s) => s.closeSignInPrompt);

  return (
    <Modal
      open={open}
      onClose={close}
      title="Sign in to edit"
      subtitle="You’re viewing this family tree. To add people, photos, or stories, sign in with a family join code."
    >
      <div className="flex flex-col gap-3">
        <Button
          size="lg"
          onClick={() => {
            close();
            router.push("/login");
          }}
        >
          Sign in
        </Button>
        <Button
          size="lg"
          variant="secondary"
          onClick={() => {
            close();
            router.push("/signup?join=FORE-2026");
          }}
        >
          Create an account
        </Button>
        <p className="text-center text-xs text-soft">
          Family members use join code <span className="font-medium text-charcoal">FORE-2026</span> to edit the Aponte tree.
        </p>
      </div>
    </Modal>
  );
}
