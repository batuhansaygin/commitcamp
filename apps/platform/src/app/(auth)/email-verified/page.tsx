import { EmailVerifiedModal } from "@/components/auth/email-verified-modal";
import { Header } from "@/components/layout/header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Activated — CommitCamp",
  description: "Your CommitCamp account has been successfully activated.",
};

export default function EmailVerifiedPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center p-4">
        <EmailVerifiedModal />
      </main>
    </div>
  );
}
