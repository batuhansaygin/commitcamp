import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Header } from "@/components/layout/header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your CommitCamp account.",
};

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center p-4">
        <ResetPasswordForm />
      </main>
    </div>
  );
}
