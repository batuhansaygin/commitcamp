import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Header } from "@/components/layout/header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your CommitCamp account password.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center p-4">
        <ForgotPasswordForm />
      </main>
    </div>
  );
}
