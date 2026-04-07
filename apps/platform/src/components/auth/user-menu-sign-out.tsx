"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/lib/actions/auth/sign-out";

function SignOutSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors cursor-pointer disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" />
      {pending ? "Signing out..." : "Sign Out"}
    </button>
  );
}

export function UserMenuSignOut() {
  return (
    <form action={signOutAction} className="w-full">
      <SignOutSubmit />
    </form>
  );
}
